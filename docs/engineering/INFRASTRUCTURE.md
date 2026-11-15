# Infrastructure

## Environments
| Environment | Hosting | Data | Status |
|---|---|---|---|
| Local | `npm run dev` | Guest mode, or a Supabase project via `.env.local` | Working |
| Production | Vercel (Next.js) + Supabase project `speakara` (`mpgldpkxfhxvbdoouqjw`, eu-west-3) | Postgres, Auth | Supabase live with both migrations applied; Vercel deployment pending team authorisation |

## Environment variables
| Variable | Scope | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser | For accounts | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | Browser | For accounts | Publishable key; safe to expose because of RLS |
| `PROGRESS_SIGNING_SECRET` | Server | For accounts | HMAC key for progress updates; must equal `private.app_secrets.progress_hmac` |
| `AI_PROVIDER` | Server | No | `anthropic` or `openai-compatible` |
| `ANTHROPIC_API_KEY` | Server | For AI tutor | Secret |
| `AI_BASE_URL`, `AI_API_KEY` | Server | For other providers | Secret |
| `AI_TUTOR_MODEL` | Server | No | Model id |
| `TTS_API_URL`, `TTS_API_KEY` | Server | No | Optional server voices via `/api/tts` |

Never put a Supabase service-role key in this app; it does not need one.

## Deployment steps
1. Create a Supabase project and apply `supabase/migrations/` in order.
2. Create the signing secret in the database:
   `insert into private.app_secrets values ('progress_hmac', encode(extensions.gen_random_bytes(32), 'hex'));`
3. Run the Supabase security and performance advisors.
4. Import the repository into Vercel (framework preset: Next.js). Add the variables above; `PROGRESS_SIGNING_SECRET`
   is the value from step 2 (`select value from private.app_secrets where name = 'progress_hmac'`).
5. Supabase Auth → URL configuration: site URL = the deployment, redirect allow-list includes `<site>/reset-password`.
6. Supabase Auth → SMTP: configure a provider. The built-in mailer sends only a few emails per hour.
7. Verify: `node e2e/smoke.mjs https://<deployment>` and `npx tsx e2e/cloud.mts https://<deployment>`.

To rotate the signing secret, update the database row and the Vercel variable together and redeploy; in-flight
updates signed with the old key are refused and the client retries.

## Build and CI
`.github/workflows/ci.yml` runs type check, lint, unit tests, content check and build on pull requests and on `main`.
The database test (`bash supabase/tests/run-local.sh`) and the browser and live-backend suites are run by hand.

## Monitoring (planned)
Error reporting (e.g. Sentry) for client and route errors; Vercel and Supabase dashboards for latency and database
health; a daily check on AI spend and 429 rates. No third-party trackers.

## Capacity notes
All marketing and app shells are static; per-learner load is a handful of small PostgREST calls per session and one
route call per tutor turn. The first bottlenecks to expect: Supabase free-tier connection and auth email limits, and AI
provider rate limits.

## Backup and data protection
Rely on Supabase backups for the plan in use; learners can reset progress in Settings. Account deletion is in Settings. Data export is
not built and is required before a public launch in some jurisdictions.
