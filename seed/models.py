#!/usr/bin/env python3
"""Model router — local-first, remote opt-in. The Hive runs its own models and can
reach local model servers (llama.cpp, Ollama, MNN) or an OpenAI-compatible endpoint.

Rule: nothing remote is contacted unless that provider is explicitly selected AND
its key/server is present. The built-in 'seed' provider is always local and always on.
"""
from __future__ import annotations

import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))

# kind: local = runs in-process or on this machine; remote = network egress.
PROVIDERS = {
    "seed":     {"kind": "local",  "desc": "packaged Hive seed model", "url": None, "model": "seed", "key_env": None},
    "ollama":   {"kind": "local",  "desc": "local Ollama server",      "url": "http://localhost:11434/v1", "model": "llama3", "key_env": None},
    "llamacpp": {"kind": "local",  "desc": "local llama.cpp server",   "url": "http://localhost:8080/v1", "model": "local", "key_env": None},
    "mnn":      {"kind": "local",  "desc": "on-device MNN runtime",    "url": "http://localhost:8000/v1", "model": "mnn", "key_env": None},
    "openai":   {"kind": "remote", "desc": "OpenAI-compatible cloud",  "url": "https://api.openai.com/v1", "model": "gpt-4o-mini", "key_env": "OPENAI_API_KEY"},
}


def list_providers() -> list:
    out = []
    for name, p in PROVIDERS.items():
        reachable = name == "seed" or bool(p["url"])
        has_key = (not p["key_env"]) or bool(os.environ.get(p["key_env"]))
        out.append({"name": name, "kind": p["kind"], "desc": p["desc"], "model": p["model"],
                    "configured": _ready(name)})
    return out


def _ready(name: str) -> bool:
    p = PROVIDERS.get(name)
    if not p:
        return False
    if p["kind"] == "local" and name == "seed":
        return True
    if p["key_env"] and not os.environ.get(p["key_env"]):
        return False
    return True


def route(model, prompt: str, provider: str = "seed", model_name: str | None = None,
          gen_kwargs: dict | None = None) -> dict:
    """Route a prompt to a provider. `model` is the in-process seed (for provider=seed)."""
    if provider not in PROVIDERS:
        return {"ok": False, "error": f"unknown provider {provider}",
                "providers": [p["name"] for p in list_providers()]}
    prov = PROVIDERS[provider]
    if prov["kind"] == "remote" and prov["key_env"] and not os.environ.get(prov["key_env"]):
        return {"ok": False, "provider": provider, "error": f"no {prov['key_env']} in env", "egress": "blocked"}
    if provider == "seed":
        text = model.generate(prompt)
        return {"ok": True, "provider": "seed", "egress": "none", "text": text}
    # OpenAI-compatible chat for local servers / remote endpoints
    import urllib.request
    base, mdl = prov["url"], prov["model"]
    body = {"model": mdl, "messages": [{"role": "user", "content": prompt}], "stream": False}
    headers = {"content-type": "application/json"}
    if prov["key_env"]:
        headers["authorization"] = "Bearer " + os.environ[prov["key_env"]]
    try:
        req = urllib.request.Request(base.rstrip("/") + "/chat/completions",
                                     data=json.dumps(body).encode(), headers=headers)
        with urllib.request.urlopen(req, timeout=60) as r:
            data = json.load(r)
        text = data["choices"][0]["message"]["content"]
        return {"ok": True, "provider": provider, "egress": prov["kind"], "text": text}
    except Exception as e:  # noqa: BLE001
        return {"ok": False, "provider": provider, "error": str(e), "egress": prov["kind"]}


def status() -> dict:
    local = [p for p in list_providers() if p["kind"] == "local"]
    return {"providers": list_providers(),
            "local_count": len(local), "remote_count": len(list_providers()) - len(local),
            "default": "seed", "offline_capable": True}


if __name__ == "__main__":
    print(json.dumps(status(), indent=2))
