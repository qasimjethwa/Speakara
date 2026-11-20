import prompts

CFG = {"target_lang": "es", "level": 2, "companion_name": "Kiko", "personality": "calm", "teaching_style": "strict", "scenario": "hotel"}

def test_instructions_cover_settings():
    text = prompts.instructions(CFG, "Ana", [{"kind": "vocabulary", "content": {"term": "llave"}}, {"kind": "mistake", "content": {"better": "yo soy"}}], 165)
    assert "Spanish" in text and "A2" in text and "receptionist" in text and "every grammar" in text
    assert "llave" in text and "yo soy" in text and "You are an AI" in text and "at most 2 minutes" in text

def test_unknown_values_fall_back_safely():
    text = prompts.instructions({"target_lang": "xx", "level": 9, "scenario": "zzz"}, "B" * 99, [], 30)
    assert "Spanish" in text and "A1" in text and "language exchange" in text and "B" * 31 not in text

def test_clean_report_trims_and_validates():
    r = prompts.clean_report({"summary": "x" * 900, "vocabulary": [{"term": "hola", "meaning": "hi"}] * 20, "mistakes": ["bad", {"said": "yo es", "better": "yo soy", "why": "ser"}], "fluency": 9, "next_steps": ["a", 3]})
    assert len(r["summary"]) == 600 and len(r["vocabulary"]) == 8 and r["mistakes"] == [{"said": "yo es", "better": "yo soy", "why": "ser"}]
    assert r["fluency"] is None and r["next_steps"] == ["a"] and r["pronunciation"] == []
    assert prompts.clean_report(None)["summary"]

def test_memory_items_and_json_parsing():
    r = prompts.clean_report({"vocabulary": [{"term": "a", "meaning": "b"}], "mistakes": [{"said": "c", "better": "d", "why": "e"}]})
    assert [m["kind"] for m in prompts.memory_items(r)] == ["vocabulary", "mistake"]
    assert prompts.parse_json('```json\n{"summary": "ok"}\n```')["summary"] == "ok"
    assert prompts.parse_json('noise {"a": 1} tail') == {"a": 1}
