#!/usr/bin/env python3
"""Model router — local-first, remote opt-in. The Hive runs its own models and can
reach local model servers (llama.cpp, Ollama, MNN) or an OpenAI-compatible endpoint.

Rule: nothing remote is contacted unless that provider is explicitly selected AND
its key/server is present. The built-in 'seed' provider is always local and always on.
"""
from __future__ import annotations

import json
import os
import socket
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))

# kind: local = runs in-process or on this machine; remote = network egress.
PROVIDERS = {
    "seed":     {"kind": "local",  "desc": "packaged Hive seed model", "url": None, "model": "seed", "key_env": None},
    "llama":    {"kind": "local",  "desc": "llama.cpp CLI (llama-cli + GGUF)",
                 "url": None, "model": os.environ.get("HIVE_LLAMA_MODEL") or "model.gguf", "key_env": None},
    "ollama":   {"kind": "local",  "desc": "local Ollama server",      "url": "http://localhost:11434/v1", "model": os.environ.get("HIVE_OLLAMA_MODEL") or "llama3", "key_env": None},
    "llamacpp": {"kind": "local",  "desc": "local llama.cpp server",   "url": "http://localhost:8080/v1", "model": "local", "key_env": None},
    "mnn":      {"kind": "local",  "desc": "on-device MNN runtime",    "url": "http://localhost:8000/v1", "model": "mnn", "key_env": None},
    "openai":   {"kind": "remote", "desc": "OpenAI-compatible cloud",  "url": os.environ.get("HIVE_OPENAI_URL") or "https://api.openai.com/v1", "model": os.environ.get("HIVE_OPENAI_MODEL") or "gpt-4o-mini", "key_env": "OPENAI_API_KEY"},
}

PRIORITY = ["seed", "llama", "ollama", "llamacpp", "mnn", "openai"]


def _llama_bin() -> str | None:
    b = os.environ.get("HIVE_LLAMA_BIN")
    if b:
        return b
    # auto-detect a llama CLI on PATH only when the device has a hive shell open
    if not os.environ.get("HIVE_SHELL_OPEN"):
        return None
    for cand in ("llama-cli", "llama-cli.exe", "main", "llama"):
        import shutil
        p = shutil.which(cand)
        if p:
            return p
    return None


def _up(url: str, port: int) -> bool:
    host = "127.0.0.1"
    if url:
        try:
            from urllib.parse import urlparse
            host = urlparse(url).hostname or host
        except Exception:
            pass
    try:
        s = socket.create_connection((host, port), timeout=1)
        s.close()
        return True
    except OSError:
        return False


def _ready(name: str) -> bool:
    p = PROVIDERS.get(name)
    if not p:
        return False
    if name == "seed":
        return True
    if name == "llama":
        return _llama_bin() is not None
    if p["key_env"] and not os.environ.get(p["key_env"]):
        return False
    if p.get("url") and p["kind"] == "local":
        return _up(p["url"], _port_of(p["url"]))
    return True  # remote with key present


def _port_of(url: str) -> int:
    try:
        from urllib.parse import urlparse
        return int(urlparse(url).port or (443 if urlparse(url).scheme == "https" else 80))
    except Exception:
        return 80


def list_providers() -> list:
    out = []
    for name, p in PROVIDERS.items():
        out.append({"name": name, "kind": p["kind"], "desc": p["desc"], "model": p["model"],
                    "configured": _ready(name)})
    return out


def first_ready(prefer: list[str] | None = None) -> str:
    for name in (prefer or PRIORITY):
        if _ready(name):
            return name
    return "seed"


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
    if provider == "llama":
        return _llama_cli(prompt, prov)
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


def _llama_cli(prompt: str, prov) -> dict:
    """Run llama.cpp CLI: llama-cli -m MODEL -p prompt --no-display-prompt."""
    binpath = _llama_bin()
    if not binpath:
        return {"ok": False, "provider": "llama", "error": "no HIVE_LLAMA_BIN", "egress": "none"}
    model_path = os.environ.get("HIVE_LLAMA_MODEL") or prov["model"]
    try:
        r = subprocess.run(
            [binpath, "-m", model_path, "-p", prompt, "--no-display-prompt", "-n", "128", "--temp", "0.7"],
            capture_output=True, timeout=120)
        text = (r.stdout or b"").decode("utf-8", errors="replace").strip()
        if not text:
            text = (r.stderr or b"").decode("utf-8", errors="replace").strip().splitlines()[-1][:200]
        return {"ok": bool(text), "provider": "llama", "egress": "none",
                "model": model_path, "text": text or "no output"}
    except FileNotFoundError:
        return {"ok": False, "provider": "llama", "error": f"binary not found: {binpath}", "egress": "none"}
    except subprocess.TimeoutExpired:
        return {"ok": False, "provider": "llama", "error": "timed out", "egress": "none"}


def auto(model, prompt: str, prefer: list[str] | None = None) -> dict:
    """Try the strongest ready provider, falling back to seed. Never blocks long."""
    for name in (prefer or PRIORITY):
        if name == "seed":
            continue
        if not _ready(name):
            continue
        out = route(model, prompt, name)
        if out.get("ok") and out.get("text"):
            return out
    return route(model, prompt, "seed")


def status() -> dict:
    local = [p for p in list_providers() if p["kind"] == "local"]
    ready = [p["name"] for p in list_providers() if p["configured"]]
    return {"providers": list_providers(),
            "local_count": len(local), "remote_count": len(list_providers()) - len(local),
            "configured": ready, "auto": first_ready(), "default": "auto",
            "offline_capable": True,
            "how": "set HIVE_LLAMA_BIN + HIVE_LLAMA_MODEL (llama.cpp GGUF), or run Ollama",
            "models": {"bin": _llama_bin(), "gguf": os.environ.get("HIVE_LLAMA_MODEL")}}


if __name__ == "__main__":
    print(json.dumps(status(), indent=2))
