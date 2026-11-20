"""Discovery (and copy writing) can run on OpenAI: a gpt-* or openai/* model goes to OpenAI."""
from attribute_engine import discover


class Resp:
    status_code = 200

    def __init__(self, body):
        self.body = body

    def json(self):
        return self.body


def test_gpt_model_goes_to_openai(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "k")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "should-not-be-used")
    sent = []

    def post(url, timeout=None, headers=None, json=None):
        sent.append((url, headers, json))
        return Resp({"choices": [{"message": {"content": "[]"}}], "usage": {"prompt_tokens": 30, "completion_tokens": 4}})
    monkeypatch.setattr(discover.requests, "post", post)
    assert discover.call_claude("hi", "gpt-4.1", None) == ("[]", 30, 4)
    url, headers, body = sent[0]
    assert url == "https://api.openai.com/v1/chat/completions" and headers["Authorization"] == "Bearer k"
    assert body["model"] == "gpt-4.1"
    discover.call_claude("hi", "openai/gpt-4.1-mini", None)
    assert sent[1][2]["model"] == "gpt-4.1-mini"
