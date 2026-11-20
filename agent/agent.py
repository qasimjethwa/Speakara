"""
Speakara companion agent worker.

A long-running LiveKit Agents process (deploy to LiveKit Cloud or any container host; never Vercel). For each AI
conversation room it:
  1. asks the Speakara server to confirm the session (one claim per session, with the seconds still allowed);
  2. runs Gemini Live for the conversation and Anam for the pre-made avatar's lip-synced video;
  3. warns, then ends the conversation before the reserved time runs out (always under Anam's 3-minute free limit);
  4. closes the room (stopping Anam billing), writes a learning report with Gemini, and sends it to the server.
Nothing is recorded: LiveKit session recording is turned off and no audio is stored.
"""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import logging
import os
import time
from typing import Any

import aiohttp
from google import genai
from google.genai import types as gtypes
from livekit import agents, rtc
from livekit.agents import Agent, AgentServer, AgentSession, room_io
from livekit.plugins import anam, google

import prompts

AGENT_NAME = "speakara-companion"
log = logging.getLogger("speakara-companion")

if not os.getenv("GOOGLE_API_KEY") and os.getenv("GEMINI_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = os.environ["GEMINI_API_KEY"]

server = AgentServer()


async def speakara(op: str, body: dict[str, Any]) -> dict[str, Any]:
    """Signed call to the Speakara app's worker endpoint."""
    base = os.environ["SPEAKARA_API_URL"].rstrip("/")
    raw = json.dumps({"op": op, **body}, separators=(",", ":"))
    headers = {"content-type": "application/json"}
    if os.getenv("LIVE_WORKER_SECRET"):   # optional shared key; otherwise the app verifies us through LiveKit
        ts = str(int(time.time() * 1000))
        headers["x-speakara-ts"] = ts
        headers["x-speakara-signature"] = hmac.new(os.environ["LIVE_WORKER_SECRET"].encode(), f"{ts}.{raw}".encode(), hashlib.sha256).hexdigest()
    if os.getenv("VERCEL_AUTOMATION_BYPASS_SECRET"):
        headers["x-vercel-protection-bypass"] = os.environ["VERCEL_AUTOMATION_BYPASS_SECRET"]
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=20)) as http:
        async with http.post(f"{base}/api/live/worker", data=raw, headers=headers) as res:
            data = await res.json(content_type=None)
            if res.status != 200:
                raise RuntimeError(f"speakara {op} failed: {res.status} {data}")
            return data


def transcript_of(session: AgentSession) -> list[dict[str, str]]:
    out = []
    for item in session.history.items:
        if getattr(item, "type", None) == "message" and item.role in ("user", "assistant"):
            text = (item.text_content or "").strip()
            if text:
                out.append({"role": "learner" if item.role == "user" else "tutor", "text": text[:500]})
    return out


async def write_report(cfg: dict[str, Any], transcript: list[dict[str, str]]) -> dict[str, Any]:
    if len([t for t in transcript if t["role"] == "learner"]) == 0:
        return prompts.clean_report({"summary": "The conversation ended before you said anything. Try again when you're ready!"})
    try:
        client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
        res = await client.aio.models.generate_content(
            model=os.getenv("GEMINI_REPORT_MODEL", "gemini-2.5-flash"),
            contents=prompts.report_prompt(cfg, transcript),
            config=gtypes.GenerateContentConfig(response_mime_type="application/json", temperature=0.2, max_output_tokens=1500),
        )
        return prompts.clean_report(prompts.parse_json(res.text or ""))
    except Exception:  # the report is a bonus; never fail the settlement because of it
        log.exception("report generation failed")
        return prompts.clean_report({"summary": "Your conversation is saved, but the detailed report couldn't be written this time."})


@server.rtc_session(agent_name=AGENT_NAME)
async def companion(ctx: agents.JobContext) -> None:
    room_name = ctx.room.name
    try:
        session_id = json.loads(ctx.job.metadata or "{}").get("session_id", "")
    except ValueError:
        session_id = ""
    if not room_name.startswith("ai_") or not session_id:
        log.warning("refusing dispatch without a Speakara session: %s", room_name)
        return
    await ctx.connect()
    try:
        claim = await speakara("claim", {"session_id": session_id, "room_name": room_name, "identity": ctx.room.local_participant.identity})
    except Exception:
        log.exception("session %s not claimable; not starting Gemini or Anam", session_id)
        return

    cfg: dict[str, Any] = claim.get("config") or {}
    seconds = int(claim.get("seconds_left", 0)) - 8          # stop a few seconds before the reservation ends
    if seconds < 20:
        return
    deadline = time.monotonic() + seconds
    finished = asyncio.Event()
    session = AgentSession(
        llm=google.realtime.RealtimeModel(
            model=os.getenv("GEMINI_LIVE_MODEL", "gemini-3.8-live"),
            voice=str(cfg.get("voice", "Puck")),
            temperature=0.7,
            input_audio_transcription=gtypes.AudioTranscriptionConfig(),
            output_audio_transcription=gtypes.AudioTranscriptionConfig(),
        ),
    )
    avatar = anam.AvatarSession(
        persona_config=anam.PersonaConfig(name=str(cfg.get("avatar_name", cfg.get("companion_name", "Kiko")))[:24], avatarId=str(cfg["avatar_id"])),
        session_options=anam.SessionOptions(show_ai_avatar_disclosure=True),
    )
    session.on("close", lambda _ev: finished.set())

    @ctx.room.on("participant_disconnected")
    def _left(p: rtc.RemoteParticipant) -> None:
        if p.kind != rtc.ParticipantKind.PARTICIPANT_KIND_AGENT:
            finished.set()

    try:
        await avatar.start(session, room=ctx.room)
        await session.start(
            agent=Agent(instructions=prompts.instructions(cfg, str(claim.get("display_name") or "Learner"), claim.get("memory") or [], seconds)),
            room=ctx.room,
            room_options=room_io.RoomOptions(close_on_disconnect=True, video_input=False),
            record=False,
        )
        session.generate_reply(instructions=prompts.opening(cfg))

        async def timer() -> None:
            await asyncio.sleep(max(0, deadline - time.monotonic() - 20))
            if not finished.is_set():
                session.generate_reply(instructions="Our time is nearly up. In one or two short sentences, praise one thing the learner did well and say goodbye.")
            await asyncio.sleep(max(0, deadline - time.monotonic()))
            finished.set()

        timer_task = asyncio.create_task(timer())
        await finished.wait()
        timer_task.cancel()
    except Exception:
        log.exception("conversation failed in %s", room_name)
    finally:
        transcript = transcript_of(session)
        # Stop the avatar first so Anam stops counting, then take as long as the report needs.
        try:
            await ctx.delete_room()
        except Exception:
            log.exception("could not delete room %s", room_name)
        report = await write_report(cfg, transcript)
        try:
            await speakara("report", {"session_id": session_id, "room_name": room_name, "report_token": claim.get("report_token", ""), "report": report, "memory": prompts.memory_items(report)})
        except Exception:
            log.exception("could not send report for %s", session_id)
        ctx.shutdown("conversation finished")


if __name__ == "__main__":
    agents.cli.run_app(server)
