#!/usr/bin/env python3
"""
KRACKERJACK AI — First-boot install assistant (LOCAL ONLY)

Talks only to local Ollama (http://127.0.0.1:11434).
No cloud providers. No xAI / OpenAI / Anthropic calls.

Architect: KRACKERJACK1134
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

HOST = os.environ.get("HIVE_ASSIST_HOST", "127.0.0.1")
PORT = int(os.environ.get("HIVE_ASSIST_PORT", "8788"))
OLLAMA = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
MODEL = os.environ.get("HIVE_LOCAL_MODEL", "phi3:mini")
ROOT = Path(__file__).resolve().parent
UI = ROOT / "install_assistant.html"
SOUL = Path(os.environ.get("HIVE_SOUL", r"C:\Users\ARCHITECT\THE_HIVE\NEURAL\soul\CONSTITUTION.md"))
CATALOG = Path(os.environ.get("HIVE_CATALOG", r"C:\Users\ARCHITECT\THE_HIVE\LOCAL_OS\catalog\windows_payload.json"))

SYSTEM = """You are KRACKERJACK AI — digital twin of Architect KRACKERJACK1134.
You are the FIRST process the user meets during HIVE OS Federation install.
Capricorn Protocol: cold, practical, truthful. No corporate fluff.
You run 100% LOCAL via Ollama. You must never suggest cloud AI APIs as required.
Help install and wire: Windows host, WSL Kali, Hive DNA, local models, boot media.
If unsure, say so. Prefer step-by-step commands the user can run.
Short answers unless user asks for depth.
"""


def load_text(p: Path, limit: int = 8000) -> str:
    try:
        if p.exists():
            return p.read_text(encoding="utf-8", errors="replace")[:limit]
    except Exception:
        pass
    return ""


def ollama_tags() -> dict:
    req = urllib.request.Request(f"{OLLAMA}/api/tags", method="GET")
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode("utf-8"))


def ollama_chat(user_text: str) -> str:
    soul = load_text(SOUL)
    catalog = load_text(CATALOG, 4000)
    payload = {
        "model": MODEL,
        "stream": False,
        "options": {"temperature": 0.4},
        "messages": [
            {
                "role": "system",
                "content": SYSTEM
                + "\n\nCONSTITUTION:\n"
                + soul
                + "\n\nPAYLOAD_CATALOG:\n"
                + catalog,
            },
            {"role": "user", "content": user_text},
        ],
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{OLLAMA}/api/chat",
        data=data,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=300) as r:
        out = json.loads(r.read().decode("utf-8"))
    return out.get("message", {}).get("content", "") or json.dumps(out)


def health() -> dict:
    status = {
        "assistant": "KRACKERJACK AI",
        "mode": "local_only",
        "ollama": OLLAMA,
        "model": MODEL,
        "ollama_up": False,
        "models": [],
        "error": None,
    }
    try:
        tags = ollama_tags()
        status["ollama_up"] = True
        status["models"] = [m.get("name") for m in tags.get("models", [])]
        # reject pure cloud pseudo-models as install brain
        cloudish = [n for n in status["models"] if n and "cloud" in n.lower()]
        status["cloud_models_present"] = cloudish
        status["local_ready"] = any(
            n == MODEL or n.startswith(MODEL.split(":")[0]) for n in status["models"]
        )
    except Exception as e:
        status["error"] = str(e)
        status["local_ready"] = False
    return status


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        sys.stderr.write("[krackerjack-local] " + (fmt % args) + "\n")

    def _send(self, code: int, body, ctype: str = "application/json"):
        if isinstance(body, (dict, list)):
            raw = json.dumps(body).encode("utf-8")
        elif isinstance(body, str):
            raw = body.encode("utf-8")
        else:
            raw = body
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        u = urlparse(self.path)
        if u.path in ("/", "/ui", "/install"):
            html = UI.read_text(encoding="utf-8") if UI.exists() else "<h1>UI missing</h1>"
            return self._send(200, html, "text/html; charset=utf-8")
        if u.path == "/health":
            return self._send(200, health())
        if u.path == "/ask":
            qs = parse_qs(u.query)
            text = (qs.get("q") or qs.get("text") or ["status"])[0]
            try:
                ans = ollama_chat(text)
                return self._send(200, {"ok": True, "model": MODEL, "answer": ans})
            except Exception as e:
                return self._send(503, {"ok": False, "error": str(e)})
        return self._send(404, {"error": "not found", "path": u.path})

    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0") or 0)
        raw = self.rfile.read(length).decode("utf-8", "replace") if length else "{}"
        try:
            j = json.loads(raw) if raw else {}
        except Exception:
            j = {}
        u = urlparse(self.path)
        if u.path == "/ask":
            text = j.get("text") or j.get("q") or "Help me install HIVE OS locally."
            try:
                ans = ollama_chat(text)
                return self._send(200, {"ok": True, "model": MODEL, "answer": ans})
            except Exception as e:
                return self._send(
                    503,
                    {
                        "ok": False,
                        "error": str(e),
                        "hint": "Start Ollama and ensure a local model is pulled (phi3:mini).",
                    },
                )
        return self._send(404, {"error": "not found"})


def main():
    h = health()
    print("=== KRACKERJACK AI LOCAL FIRST-BOOT ===")
    print(json.dumps(h, indent=2))
    if not h.get("ollama_up"):
        print("[!] Ollama not reachable at", OLLAMA)
        print("    Start Ollama, then re-run.")
    if h.get("cloud_models_present"):
        print("[!] Cloud-tagged models present — install brain will NOT use them.")
    if not h.get("local_ready"):
        print(f"[!] Local model '{MODEL}' not ready. Run: ollama pull {MODEL}")
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"[+] Open http://{HOST}:{PORT}/  (local install assistant)")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
