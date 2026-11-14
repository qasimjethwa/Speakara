# Infrastructure

## Environments
| Environment | Hosting | Data | Status |
|---|---|---|---|
| Local | `npm run dev` | Guest mode, or a Supabase project via `.env.local` | Working |
| Production | Vercel (Next.js) + Supabase | Postgres, Auth | **Not deployed** — no Supabase project or Vercel project was created in this build |

## Environment variables
| Variable | Scope | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser | For accounts | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | Browser | For accounts | Publishable key; safe to expose because of RLS |
| `AI_PROVIDER` | Server | No | `anthropic` or `openai-compatible` |
| `ANTHROPIC_API_KEY` | Server | For AI tutor | Secret |
| `AI_BASE_URL`, `AI_API_KEY` | Server | For other providers | Secret |
| `AI_TUTOR_MODEL` | Server | No | Model id |

Never put a Supabase service-role key in this app; it does not need one.

## Deployment steps
1. Create a Supabase project. In Auth settings choose whether email confirmation is required.
2. Apply the schema: `supabase link --project-ref <ref>` then `supabase db push` (or paste the migration into the SQL editor).
3. Run the Supabase security and performance advisors and resolve any findings.
4. Import the repository into Vercel (framework preset: Next.js). Add the variables above.
5. Add the Vercel URL to Supabase Auth → URL configuration.
6. Smoke test: `node e2e/smoke.mjs https://<deployment>` covers guest mode; then sign up manually and check sync,
   leaderboard and friends.

## Build and CI
`npm run typecheck`, `npm test`, `npm run content:check`, `npm run build`, `bash supabase/tests/run-local.sh`,
`node e2e/smoke.mjs`. A CI workflow is not included yet; these six commands are what it should run.

## Monitoring (planned)
Error reporting (e.g. Sentry) for client and route errors; Vercel and Supabase dashboards for latency and database
health; a daily check on AI spend and 429 rates. No third-party trackers.

## Capacity notes
All marketing and app shells are static; per-learner load is a handful of small PostgREST calls per session and one
route call per tutor turn. The first bottlenecks to expect: Supabase free-tier connection and auth email limits, and AI
provider rate limits.

## Backup and data protection
Rely on Supabase backups for the plan in use; learners can reset progress in Settings. Account deletion and data export
flows are not built and are required before a public launch in most jurisdictions.
