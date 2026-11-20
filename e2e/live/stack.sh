#!/usr/bin/env bash
# Starts a throwaway local stack for e2e/live.mjs: Postgres (migrations + seed) and the fake Supabase API.
# Never touches a real database. Needs Postgres 15+ binaries and `npm i --no-save pg` (or NODE_PATH with pg).
# Prints the environment to export for `next build` / `next start`. Stop with: kill $(cat $DIR/pids)
set -euo pipefail
BIN=${PG_BIN:-/usr/lib/postgresql/16/bin}; HERE=$(cd "$(dirname "$0")" && pwd); ROOT="$HERE/../.."
DIR=${LIVE_STACK_DIR:-$(mktemp -d)}; PORT=${PGPORT_TEST:-54331}; API=${FAKE_SUPABASE_PORT:-54400}
chmod 777 "$DIR"
RUN() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }
RUN "$BIN/initdb -D $DIR/data -U postgres -A trust >/dev/null && $BIN/pg_ctl -D $DIR/data -o \"-p $PORT -k $DIR -c listen_addresses=''\" -l $DIR/pg.log -w start >/dev/null"
P="psql -h $DIR -p $PORT -U postgres -v ON_ERROR_STOP=1 -q"
$P -f "$ROOT/supabase/tests/local_stub.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do $P -f "$f"; done
$P <<'SQL'
insert into private.app_secrets values ('progress_hmac', 'e2e-progress-secret');
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-0000000000a1', 'ana@speakara.test', '{"username":"e2e_ana","display_name":"Ana"}'),
  ('00000000-0000-4000-8000-0000000000b1', 'ben@speakara.test', '{"username":"e2e_ben","display_name":"Ben"}'),
  ('00000000-0000-4000-8000-0000000000c1', 'cara@speakara.test', '{"username":"e2e_cara","display_name":"Cara"}');
update public.profiles set onboarded = true, course_id = 'es-en';
update public.profiles set role = 'editor' where username = 'e2e_ana';
SQL
PGHOST=$DIR PGPORT=$PORT nohup node "$HERE/fake-supabase.mjs" "$API" > "$DIR/api.log" 2>&1 &
echo $! > "$DIR/pids"
for i in $(seq 1 30); do curl -s "http://127.0.0.1:$API/auth/v1/user" >/dev/null && break; sleep 0.2; done
cat <<ENV
export LIVE_STACK_DIR=$DIR PGHOST=$DIR PGPORT=$PORT
export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:$API NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=e2e-publishable
export PROGRESS_SIGNING_SECRET=e2e-progress-secret LIVE_WORKER_SECRET=e2e-worker-secret-0123456789abcdef
export LIVEKIT_URL=ws://127.0.0.1:7999 LIVEKIT_API_KEY=e2e-key LIVEKIT_API_SECRET=e2e-livekit-secret-0123456789abcdefghij
ENV
