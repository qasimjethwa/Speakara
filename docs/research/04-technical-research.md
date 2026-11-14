# Technical research

Each finding is classified as the brief requires: **1 Verified**, **2 Inference**, **3 Recommendation for Speakara**, **4 Unknown**.

## Frontend (web)

| # | Finding | Class | Basis / limitation |
|---|---|---|---|
| F1 | The logged-out site is a client-rendered single-page app: the HTML document carries tiny inline scripts and loads hashed bundles (`app-*.js` ≈1.15 MB, vendor chunks ≈0.75 MB and ≈0.31 MB, `manifest-*.js`, `polyfills-*.js`) | 1 | REA E2 script inventory |
| F2 | Static assets are served from a CloudFront distribution (`d35aaqx5ub95lt.cloudfront.net/js/…`) | 1 | REA E2 |
| F3 | UI strings ship as a per-locale chunk (`js/strings/en-*.js`) | 1 | REA E2 |
| F4 | Numeric chunk names plus a separate `manifest` runtime indicate a webpack-style code-split build | 2 | Naming convention only; bundler not identified from source |
| F5 | Routing is declarative with `path` properties and `:param` segments (121 patterns incl. `/course/:learningLanguageId/:fromLanguageId?/:slug?`, `/register/:languageId?`, `/math/unit/:referenceId`) | 1 | REA E6 route inventory (`mechanism: property:path`) |
| F6 | The UI framework is React with a Redux-style store | 4 (commonly reported, **not** confirmed here) | Bundle text matched `lottie` but we did not find a conclusive framework fingerprint in the analysed slice |
| F7 | Lottie is used for animation; there is a `/debug/components/controls/LottieAnimationLazy` route | 1 | REA E6 routes + string match |
| F8 | A PWA manifest is linked (`/manifest.json`) | 1 | REA E2 DOM URL list |
| F9 | Enterprise SSO exists (`/okta/callback`) and classroom codes (`/o/:classroomCode`) | 1 (route exists) / 4 (behaviour) | REA E6 |

## Mobile and sync

| # | Finding | Class | Basis |
|---|---|---|---|
| M1 | The mobile app uses **frontend prediction** (optimistic updates): UI state updates from a predicted backend response, enabling low latency and offline progress | 1 | B4 |
| M2 | Costs called out by Duolingo: duplicated state/logic on client and server, rollback decisions, need for granular models | 1 | B4 headings |
| M3 | Leaderboards: users are grouped into cohorts; predicted XP can conflict with the backend; "immediate" vs "deferred" rollback strategies | 1 | B4 |

## Backend, data and ML

| # | Finding | Class | Basis |
|---|---|---|---|
| D1 | Backend languages, databases, queueing | 4 | Not observable from public pages; not guessed |
| D2 | A personalisation model called **Birdbrain** estimates learner ability and exercise difficulty | [P] → treat as 4 for design | Recalled from public Duolingo publications; not fetched this session |
| D3 | **Half-life regression** (Settles & Meeder, ACL 2016) models word memory decay for spaced repetition | [P] | Published paper; not fetched this session |
| D4 | Max features were built on OpenAI GPT-4 | 1 | B3 |
| D5 | Speech recognition / TTS vendors | 4 | Not stated in fetched sources |

## Recommendations for Speakara (class 3)

| Topic | Recommendation | Reason |
|---|---|---|
| Rendering | Next.js App Router; marketing pages static, app screens client components | Static pages are fast and cheap; the lesson loop is inherently interactive |
| Optimistic updates | Apply the learner-model change locally first, then persist a diff (M1). Queue writes; surface failures in a banner | Same benefit Duolingo describes, at our scale, without a custom sync engine |
| Avoid M2's duplicated logic | Keep rules in pure TypeScript modules (`src/lib/engine`) that can run on client today and inside an Edge Function later | One implementation, two runtimes |
| Server authority | Enforce invariants in Postgres (XP ≤ 50 per event, append-only ledger, RLS) now; move XP awarding into a server function before leagues carry real stakes | Client-computed XP is cheatable (documented limitation) |
| Scheduling | Transparent SM-2-style algorithm now; evaluate half-life regression once we have review logs | Do not pretend to reproduce Birdbrain |
| Speech | Browser Web Speech API first (free, on-device or vendor-provided); provider abstraction for server STT/TTS later | Zero marginal cost |
| AI | Provider-agnostic tutor interface with a deterministic scripted fallback | The product must work with no AI budget |
