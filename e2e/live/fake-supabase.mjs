/**
 * Test-only stand-in for the Supabase HTTP APIs, backed by a REAL local Postgres that has Speakara's migrations applied.
 * It implements just enough of PostgREST and GoTrue for Speakara's pages and API routes: eq filters, order, limit,
 * insert/upsert/update/delete, rpc, and /auth/v1/user. Every query runs under the same roles and RLS as production
 * (role "authenticated" with request.jwt.claim.sub, or "anon"), so access rules are exercised for real.
 *
 * Never point this at a real database. Usage: PGHOST=<socket dir> PGPORT=<port> node e2e/live/fake-supabase.mjs 54400
 * Tokens are unsigned JWT-shaped strings made by fakeToken(); they are accepted only by this server.
 */
import http from "node:http";
import pg from "pg";

const PK = { consents: ["user_id", "kind"], call_preferences: ["user_id"], avatar_preferences: ["user_id"], user_blocks: ["blocker_id", "blocked_id"], profiles: ["id"] };
const pool = new pg.Pool({ user: "postgres", database: "postgres", max: 8 });
const ident = (s) => { if (!/^[a-z_][a-z0-9_]*$/.test(s)) throw new Error(`bad identifier ${s}`); return `"${s}"`; };

export const fakeToken = (sub, email = `${sub}@example.test`) => {
  const b = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b({ alg: "none", typ: "JWT" })}.${b({ sub, email, role: "authenticated", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 86400 })}.test`;
};
const subOf = (req) => {
  const tok = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  try { const p = JSON.parse(Buffer.from(tok.split(".")[1], "base64url").toString()); return p.sub && p.role === "authenticated" ? p : null; } catch { return null; }
};

async function asRole(user, sql, params) {
  const c = await pool.connect();
  try {
    await c.query("begin");
    await c.query(user ? "set local role authenticated" : "set local role anon");
    await c.query("select set_config('request.jwt.claim.sub', $1, true)", [user?.sub ?? ""]);
    const r = await c.query(sql, params);
    await c.query("commit");
    return r;
  } catch (e) { await c.query("rollback").catch(() => {}); throw e; } finally { c.release(); }
}

function filters(url, params) {
  const where = [];
  for (const [k, v] of url.searchParams) {
    if (["select", "order", "limit", "on_conflict", "columns"].includes(k)) continue;
    const m = /^(eq|neq|gt|lt|gte|lte|is)\.(.*)$/s.exec(v); if (!m) continue;
    const op = { eq: "=", neq: "<>", gt: ">", lt: "<", gte: ">=", lte: "<=", is: "is" }[m[1]];
    if (op === "is") where.push(`${ident(k)} is ${m[2] === "null" ? "null" : "not null"}`);
    else { params.push(m[2]); where.push(`${ident(k)}::text ${op} $${params.length}`); }
  }
  return where.length ? ` where ${where.join(" and ")}` : "";
}

async function handle(req, res, body) {
  const url = new URL(req.url, "http://x"); const user = subOf(req);
  const send = (status, data, headers = {}) => { res.writeHead(status, { "content-type": "application/json", "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*", "access-control-expose-headers": "*", ...headers }); res.end(data === undefined ? "" : JSON.stringify(data)); };
  if (req.method === "OPTIONS") return send(204);
  if (url.pathname === "/auth/v1/user") return user ? send(200, { id: user.sub, email: user.email, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {} }) : send(401, { message: "invalid token", code: "bad_jwt" });
  if (url.pathname.startsWith("/auth/v1/")) return send(200, {});
  const rpc = /^\/rest\/v1\/rpc\/([a-z_]+)$/.exec(url.pathname);
  try {
    if (rpc) {
      const args = body ? JSON.parse(body) : {}; const keys = Object.keys(args);
      const r = await asRole(user, `select to_jsonb(public.${ident(rpc[1])}(${keys.map((k, i) => `${ident(k)} => $${i + 1}`).join(", ")})) as r`, keys.map((k) => (typeof args[k] === "object" && args[k] !== null ? JSON.stringify(args[k]) : args[k])));
      return send(200, r.rows[0]?.r ?? null);
    }
    const tbl = /^\/rest\/v1\/([a-z_]+)$/.exec(url.pathname)?.[1]; if (!tbl) return send(404, { message: "not found" });
    const t = `public.${ident(tbl)}`; const params = [];
    const single = (req.headers.accept ?? "").includes("vnd.pgrst.object");
    if (req.method === "GET" || req.method === "HEAD") {
      let sql = `select * from ${t}${filters(url, params)}`;
      const order = url.searchParams.get("order"); if (order) sql += " order by " + order.split(",").map((o) => { const [c, d] = o.split("."); return `${ident(c)} ${d === "desc" ? "desc" : "asc"}`; }).join(", ");
      const limit = Number(url.searchParams.get("limit")); if (limit > 0) sql += ` limit ${Math.min(1000, limit)}`;
      const r = await asRole(user, sql, params);
      if (single) return r.rows.length === 1 ? send(200, r.rows[0]) : send(406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned", details: `The result contains ${r.rows.length} rows` });
      return send(200, r.rows);
    }
    if (req.method === "POST") {
      const rows = [].concat(JSON.parse(body || "[]")); if (!rows.length) return send(201, []);
      const cols = [...new Set(rows.flatMap(Object.keys))];
      const values = rows.map((row) => `(${cols.map((c) => { params.push(row[c] === undefined ? null : typeof row[c] === "object" && row[c] !== null && !Array.isArray(row[c]) ? JSON.stringify(row[c]) : row[c]); return `$${params.length}`; }).join(", ")})`);
      let sql = `insert into ${t} (${cols.map(ident).join(", ")}) values ${values.join(", ")}`;
      if ((req.headers.prefer ?? "").includes("merge-duplicates")) {
        const pk = (url.searchParams.get("on_conflict")?.split(",") ?? PK[tbl]); const upd = cols.filter((c) => !pk.includes(c));
        sql += ` on conflict (${pk.map(ident).join(", ")}) do ${upd.length ? `update set ${upd.map((c) => `${ident(c)} = excluded.${ident(c)}`).join(", ")}` : "nothing"}`;
      }
      await asRole(user, sql + " returning *", params);
      return send(201, []);
    }
    if (req.method === "PATCH") {
      const patch = JSON.parse(body || "{}"); const sets = Object.keys(patch).map((k) => { params.push(typeof patch[k] === "object" && patch[k] !== null && !Array.isArray(patch[k]) ? JSON.stringify(patch[k]) : patch[k]); return `${ident(k)} = $${params.length}`; });
      await asRole(user, `update ${t} set ${sets.join(", ")}${filters(url, params)}`, params);
      return send(204);
    }
    if (req.method === "DELETE") { await asRole(user, `delete from ${t}${filters(url, params)}`, params); return send(204); }
    return send(405, { message: "method not allowed" });
  } catch (e) {
    const code = e.code === "42501" ? "42501" : e.code ?? "P0001";
    return send(e.code === "42501" ? 403 : 400, { message: e.message, code, details: null, hint: null });
  }
}

if (process.argv[1]?.endsWith("fake-supabase.mjs")) {
  const port = Number(process.argv[2] ?? 54400);
  http.createServer((req, res) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => void handle(req, res, b)); }).listen(port, "127.0.0.1", () => console.log(`fake supabase on ${port}`));
}
