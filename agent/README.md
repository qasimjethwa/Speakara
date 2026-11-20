# Speakara companion agent worker

A long-running [LiveKit Agents](https://docs.livekit.io/agents/) process (Python) that runs each AI companion
conversation: Gemini Live for the conversation and Anam for the pre-made avatar's lip-synced video. **It cannot run
on Vercel**: serverless functions stop after each request, and this worker must stay connected to LiveKit. Deploy it
to LiveKit Cloud (recommended) or any container host.

```
Browser ──(Supabase session)──► Next.js on Vercel ──(signed)──► Supabase  (quota, sessions, memory)
   │                                  │ short-lived room token with agent dispatch
   └──────── WebRTC ────────► LiveKit Cloud room ◄──── this worker ──► Gemini Live (conversation)
                                                           └──────► Anam (avatar video + speech)
```

## What it does per conversation

1. LiveKit dispatches the worker (agent name `speakara-companion`) only when a room token from
   `/api/companion/start` creates the room. The worker then **claims** the session from the Speakara app
   (`POST /api/live/worker`, signed with `LIVE_WORKER_SECRET`). A session can be claimed once; anything else is
   refused before Gemini or Anam is started, so no avatar minutes can be spent outside Speakara's accounting.
2. Starts Gemini Live (`GEMINI_LIVE_MODEL`, default `gemini-3.8-live`) with instructions built from the learner's
   companion name, personality, teaching style, voice, language, level, scenario and (with consent) learning memory.
3. Starts the Anam avatar (pre-made avatar ID from Speakara's catalog only) and the conversation. Gemini handles
   interruptions natively; the learner can talk over the companion.
4. 20 seconds before the reserved time ends it asks the companion to wrap up, then ends. Reserved time is at most
   165 s, so every conversation stops before Anam's 3-minute free-plan limit.
5. Deletes the room first (stopping Anam), writes a learning report with Gemini (`GEMINI_REPORT_MODEL`), and sends
   it to Speakara, which settles the minutes and saves memory only if the learner consented.

Nothing is recorded: LiveKit session recording is off (`record=False`) and no audio is stored.

## Environment (worker secrets)

| Name | Required | Notes |
|---|---|---|
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | yes | Same LiveKit project as Vercel. LiveKit Cloud injects these for deployed agents. |
| `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) | yes | Gemini Developer API key. Only the worker needs it. |
| `ANAM_API_KEY` | yes | Anam API key. Only the worker needs it. |
| `LIVE_WORKER_SECRET` | yes | Random 32+ character string. Must equal the Vercel value. |
| `SPEAKARA_API_URL` | yes | `https://speakara.vercel.app` (or a preview URL). |
| `GEMINI_LIVE_MODEL` | no | Default `gemini-3.8-live`. |
| `GEMINI_REPORT_MODEL` | no | Default `gemini-2.5-flash`. |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | no | Only to reach a Vercel preview protected by Vercel Authentication. |

## Run locally

```bash
cd agent && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
cp .env.example .env.local   # fill in the values; never commit it
set -a && . ./.env.local && set +a && python agent.py dev
python -m pytest -q test_prompts.py
```

## Deploy to LiveKit Cloud

Requires the LiveKit CLI (`lk`) logged in to the Speakara LiveKit project. The free Build plan allows one agent
deployment. Check the current CLI command names in LiveKit's deployment docs before running them.

```bash
cd agent
lk agent create            # first time: registers the agent from this folder's Dockerfile
lk agent update-secrets --secrets-file .env.local   # GEMINI_API_KEY, ANAM_API_KEY, LIVE_WORKER_SECRET, SPEAKARA_API_URL
lk agent deploy            # later releases
lk agent logs              # watch it register as "speakara-companion"
```

## Pre-made avatars

Speakara only offers Anam's stock avatars. To list them for `LIVE_AVATAR_CATALOG` on Vercel:

```bash
ANAM_API_KEY=... python list_avatars.py
```

Without `LIVE_AVATAR_CATALOG` the app offers one stock avatar (the one used in Anam's own documentation).

## Manual release checklist (needs real keys; cannot run in CI)

- Avatar video appears and the lips follow the speech.
- Learner can interrupt; the companion stops and answers.
- The 20-second wrap-up happens, and the call ends by itself before 2:45.
- Report appears; with memory on, items show on `/live/memory`.
- The Anam dashboard's usage matches Speakara's `avatar_usage` (Speakara should always show equal or more).
