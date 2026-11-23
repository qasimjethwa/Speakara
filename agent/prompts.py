"""Instructions for the Speakara companion. Pure functions, unit-tested without any network access."""

from __future__ import annotations

import json
from typing import Any

LANGS = {"es": "Spanish", "fr": "French", "de": "German", "ko": "Korean", "it": "Italian", "ru": "Russian", "ar": "Modern Standard Arabic"}
LEVELS = {
    1: "an absolute beginner (CEFR A1). Use very short sentences, the most common words and the present tense. Speak slowly and clearly.",
    2: "an elementary learner (CEFR A2). Use short, simple sentences and everyday vocabulary. Speak slowly.",
    3: "an intermediate learner (CEFR B1). Use natural everyday language with some longer sentences.",
    4: "an upper-intermediate learner (CEFR B2). Speak naturally, with idioms now and then.",
    5: "an advanced learner (CEFR C1). Speak naturally at normal speed.",
}
PERSONALITIES = {
    "friendly": "warm, encouraging and upbeat",
    "calm": "calm, patient and unhurried",
    "playful": "playful and humorous, with light, kind teasing",
    "professional": "clear, focused and professional",
}
STYLES = {
    "gentle": "Correct only mistakes that block understanding. Never interrupt the learner to correct them.",
    "balanced": "After the learner finishes a turn, correct the single most useful mistake briefly, then carry on the conversation.",
    "strict": "After each learner turn, correct every grammar or vocabulary mistake briefly, then carry on.",
    "immersive": "Stay in the target language almost entirely. Correct by recasting: repeat what they meant, correctly, as part of your reply.",
}
SCENES = {
    "meet": "meeting someone new at a language exchange café: names, where you're from, hobbies",
    "restaurant": "a restaurant: you are the waiter; the learner gets a table, orders and asks for the bill",
    "airport": "an airport: you are the check-in agent; bags, seats, gates and a possible delay",
    "hotel": "a hotel: you are the receptionist; check-in, breakfast times and fixing a small problem with the room",
    "shopping": "a clothes shop: you are the shop assistant; prices, sizes and colours",
    "interview": "a friendly job interview for an entry-level job: experience, strengths and availability",
    "everyday": "everyday small talk as a neighbour: the day, family, food and plans",
}


def instructions(cfg: dict[str, Any], learner_name: str, memory: list[dict[str, Any]], seconds: int) -> str:
    lang = LANGS.get(str(cfg.get("target_lang")), "Spanish")
    level = LEVELS.get(int(cfg.get("level", 1)), LEVELS[1])
    name = str(cfg.get("companion_name", "Kiko"))[:24]
    lines = [
        f"You are {name}, a {PERSONALITIES.get(str(cfg.get('personality')), PERSONALITIES['friendly'])} {lang} conversation partner in the Speakara language-learning app.",
        f"You are an AI. If asked, say so plainly. The learner's name is {learner_name[:30]}. The learner is {level}",
        f"Role-play this scene with them: {SCENES.get(str(cfg.get('scenario')), SCENES['meet'])}.",
        f"Speak {lang}. Keep each turn short (one to three sentences) so the learner talks more than you do. Ask one question at a time.",
        "Adapt as you go: if the learner struggles or answers in English, simplify, slow down, and offer a short English hint; if they cope easily, use richer words and longer sentences.",
        STYLES.get(str(cfg.get("teaching_style")), STYLES["balanced"]),
        "When you correct, say the better version in the target language and a few words of explanation in English for beginners.",
        "If you notice a word the learner pronounces in a way that would be hard to understand, model it slowly once and ask them to repeat it. Do not comment on accent otherwise.",
        "If the learner interrupts you, stop and respond to what they said.",
        f"The conversation lasts at most {max(1, seconds // 60)} minutes. Never mention the timer unless you are told to wrap up.",
        "Stay safe and kind: no personal data requests (address, phone, social media), no romance, no medical, legal or financial advice. Keep everything suitable for teenagers.",
    ]
    brief = cfg.get("twin_brief")
    if isinstance(brief, list) and brief:
        lines.append("Personal learning profile (shared with the learner's consent; use it to adapt, never mention it as data):")
        lines.extend("- " + str(b)[:300] for b in brief[:12] if isinstance(b, str))
    if memory:
        vocab = [m["content"].get("term") for m in memory if m.get("kind") == "vocabulary" and isinstance(m.get("content"), dict)][:10]
        errs = [m["content"].get("better") for m in memory if m.get("kind") == "mistake" and isinstance(m.get("content"), dict)][:5]
        if vocab:
            lines.append("Words they practised before (reuse a few naturally): " + ", ".join(str(v)[:40] for v in vocab if v) + ".")
        if errs:
            lines.append("Mistakes they made before (give them a chance to get these right): " + "; ".join(str(e)[:80] for e in errs if e) + ".")
    return "\n".join(lines)


def opening(cfg: dict[str, Any]) -> str:
    return "Greet the learner warmly in one short sentence in the target language, introduce yourself by name, and open the scene with one simple question."


def report_prompt(cfg: dict[str, Any], transcript: list[dict[str, str]]) -> str:
    lang = LANGS.get(str(cfg.get("target_lang")), "Spanish")
    lines = "\n".join(f"{t['role'].upper()}: {t['text']}" for t in transcript[-80:])
    return (
        f"You are reviewing a short {lang} speaking practice between a learner (LEARNER) and a tutor (TUTOR).\n"
        "Write a learning report for the learner in English. Base it only on the transcript; do not invent anything.\n"
        "Return JSON with keys: summary (2-3 encouraging sentences), vocabulary (up to 8 useful words or phrases from the conversation as "
        f"{{\"term\": <{lang}>, \"meaning\": <English>}}), mistakes (up to 6 real learner mistakes as {{\"said\", \"better\", \"why\"}}), "
        "pronunciation (only items the tutor explicitly corrected, as {\"word\", \"tip\"}; else empty), next_steps (2-3 short suggestions), "
        "fluency (integer 1-5).\n\nTranscript:\n" + lines
    )


def clean_report(raw: Any) -> dict[str, Any]:
    """Validates and trims a model-written report to the shape the app expects."""
    r = raw if isinstance(raw, dict) else {}

    def items(key: str, fields: tuple[str, ...], limit: int, size: int) -> list[dict[str, str]]:
        out = []
        for x in r.get(key) or []:
            if isinstance(x, dict) and all(isinstance(x.get(f), str) for f in fields[:1]):
                out.append({f: str(x.get(f, ""))[:size] for f in fields})
        return out[:limit]

    fluency = r.get("fluency")
    return {
        "summary": str(r.get("summary") or "Great effort today. Keep practising!")[:600],
        "vocabulary": items("vocabulary", ("term", "meaning"), 8, 120),
        "mistakes": items("mistakes", ("said", "better", "why"), 6, 200),
        "pronunciation": items("pronunciation", ("word", "tip"), 5, 200),
        "next_steps": [str(s)[:160] for s in (r.get("next_steps") or []) if isinstance(s, str)][:3],
        "fluency": fluency if isinstance(fluency, int) and 1 <= fluency <= 5 else None,
    }


def memory_items(report: dict[str, Any]) -> list[dict[str, Any]]:
    """Learning memory rows derived from a report (saved by the server only if the learner consented)."""
    out: list[dict[str, Any]] = []
    out += [{"kind": "vocabulary", "content": v} for v in report["vocabulary"]]
    out += [{"kind": "mistake", "content": m} for m in report["mistakes"]]
    out += [{"kind": "pronunciation", "content": p} for p in report["pronunciation"]]
    return out[:30]


def parse_json(text: str) -> Any:
    text = (text or "").strip()
    if text.startswith("```"):
        text = text.strip("`")
        text = text[text.find("{"):]
    try:
        return json.loads(text)
    except ValueError:
        start, end = text.find("{"), text.rfind("}")
        return json.loads(text[start : end + 1]) if start >= 0 and end > start else {}
