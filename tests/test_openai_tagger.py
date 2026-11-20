"""The tagger can use OpenAI (chat, JSON answers) instead of Jev: same answer shape, cost from tokens."""
import json

from attribute_engine import tag

ATTRS = [
    {"name": "framing", "computed_by": "jev", "type": "choice", "question": "What does it lead with?",
     "options": {"problem": "a pain", "solution": "a fix", "neither": "neither"}},
    {"name": "mentions_number", "computed_by": "jev", "type": "boolean", "question": "Any number?",
     "true": "has a figure", "false": "no figure"},
]
CONFIG = {"attributes": ATTRS + [{"name": "word_count", "computed_by": "code", "type": "number"}],
          "settings": {"jev_provider": "openai", "openai_model": "gpt-4.1-mini", "openai_prices": [0.4, 1.6],
                       "openai_instructions": "Label the copy.", "low_confidence": 0.6, "concurrency": 2}}


class Resp:
    status_code = 200
    headers = {}

    def __init__(self, body):
        self.body = body

    def json(self):
        return self.body


def test_openai_tagging(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "k")
    sent = []

    def post(url, headers=None, json=None, timeout=None):
        sent.append((url, json))
        answer = {"framing": {"problem": 0.1, "solution": 0.8, "neither": 0.1}, "mentions_number": 0.9}
        return Resp({"choices": [{"message": {"content": __import__("json").dumps(answer)}}],
                     "usage": {"prompt_tokens": 1000, "completion_tokens": 100}})
    monkeypatch.setattr(tag.requests, "post", post)
    rows = tag.tag_rows([{"copy": "Save 5 hours a week", "conversion_rate": "0.05"}], CONFIG, None)
    r = rows[0]
    assert sent[0][0] == "https://api.openai.com/v1/chat/completions"
    body = sent[0][1]
    assert body["model"] == "gpt-4.1-mini" and body["response_format"] == {"type": "json_object"}
    assert body["messages"][0]["content"].startswith("Label the copy.")
    assert "Save 5 hours a week" in body["messages"][1]["content"]
    assert r["jev_framing"] == "solution" and json.loads(r["jev_framing_weights"])["solution"] == 0.8
    assert r["jev_mentions_number"] == "yes" and r["jev_mentions_number_p"] == 0.9
    assert r["word_count"] == 5
    assert abs(r["jev_billed_cost_usd"] - (1000 * 0.4 + 100 * 1.6) / 1e6) < 1e-12


def test_openai_weights_are_normalized_and_bad_options_dropped(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "k")
    answer = {"framing": {"problem": 2, "solution": 2, "made_up": 5}, "mentions_number": "yes"}
    monkeypatch.setattr(tag.requests, "post", lambda *a, **k: Resp(
        {"choices": [{"message": {"content": json.dumps(answer)}}], "usage": {}}))
    r = tag.tag_rows([{"copy": "x", "conversion_rate": "0"}], CONFIG, None)[0]
    w = json.loads(r["jev_framing_weights"])
    assert set(w) == {"problem", "solution", "neither"} and abs(sum(w.values()) - 1) < 1e-9
    assert r["jev_mentions_number_p"] == 1.0
