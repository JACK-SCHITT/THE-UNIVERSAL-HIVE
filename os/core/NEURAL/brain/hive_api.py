#!/usr/bin/env python3
"""
HIVE COCKPIT API + UI SERVER
============================
Localhost ONLY. No shell exec from the browser.
Serves command catalog, status, multi-primary agents, offline/local brain.

Hardening:
- Bind 127.0.0.1 only (never 0.0.0.0 by default)
- No arbitrary command execution endpoint
- No secret leakage (status shows SET/MISSING only)
- Stdlib only
"""

from __future__ import annotations

import json
import os
import sys
import threading
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

BRAIN = Path(__file__).resolve().parent
HIVE_ROOT = Path(os.environ.get("HIVE_ROOT", BRAIN.parents[1]))
sys.path.insert(0, str(BRAIN))

from hive_link import (  # noqa: E402
    HIVE_ROOT as LINK_ROOT,
    load_dotenv,
    load_manifest,
    ollama_models,
    ollama_reachable,
    preferred_brain,
    cloud_key,
    ask_text,
    call_offline,
    pick_ollama_model,
)
from agents import AGENTS, run_agent  # noqa: E402

COMMANDS_PATH = HIVE_ROOT / "HIVE_CORE" / "commands" / "COMMANDS.json"
FLEET_REGISTRY = HIVE_ROOT / "HIVE_CORE" / "fleet" / "FLEET_REGISTRY.json"
FLEET_DIR = HIVE_ROOT / "FLEET"
UI_PATH = HIVE_ROOT / "cold-storage" / "hive-cockpit.html"
HOST = os.getenv("HIVE_UI_HOST", "127.0.0.1")
PORT = int(os.getenv("HIVE_UI_PORT", "8787"))


def _json_bytes(obj: object, code: int = 200) -> tuple[int, bytes, str]:
    raw = json.dumps(obj, indent=2, ensure_ascii=False).encode("utf-8")
    return code, raw, "application/json; charset=utf-8"


def build_status() -> dict:
    load_dotenv()
    m = load_manifest()
    models = ollama_models() if ollama_reachable() else []
    return {
        "ok": True,
        "hive_root": str(HIVE_ROOT),
        "beachheads": {
            "war_room": str(HIVE_ROOT),
            "c_hive": r"C:\Hive",
            "programdata": r"C:\ProgramData\THE_HIVE\war-room",
            "program_trap": r"C:\Program is an empty FILE (not a directory) — do not treat as beachhead",
        },
        "manifest": m,
        "brain": preferred_brain(),
        "xai_key": "SET" if cloud_key() else "MISSING",
        "gh_pat": "SET"
        if os.getenv("GH_PAT_UNCHAINED") or os.getenv("GITHUB_TOKEN")
        else "MISSING",
        "ollama": {
            "up": ollama_reachable(),
            "models": models,
            "picked": pick_ollama_model(),
        },
        "soul_ok": (HIVE_ROOT / "NEURAL" / "soul" / "CONSTITUTION.md").exists(),
        "commands_ok": COMMANDS_PATH.exists(),
        "ui_ok": UI_PATH.exists(),
        "multi_primary": {
            "chosen_one": "KRACKERJACK AI",
            "testers": ["JAGUAR AI", "COUNSEL", "ZORG"],
        },
        "bind": f"http://{HOST}:{PORT}/",
        "hardening": [
            "localhost bind only",
            "no arbitrary shell from UI",
            "no auto disk wipe",
            "secrets never returned in status",
        ],
        "fleet": {
            "registry": FLEET_REGISTRY.exists(),
            "dir": FLEET_DIR.exists(),
            "endpoint": "/api/fleet",
        },
    }


def load_commands() -> dict:
    if not COMMANDS_PATH.exists():
        return {"error": "COMMANDS.json missing", "platforms": {}}
    return json.loads(COMMANDS_PATH.read_text(encoding="utf-8"))


def load_fleet_registry() -> dict:
    if not FLEET_REGISTRY.exists():
        return {"error": "FLEET_REGISTRY.json missing", "core_fleet": []}
    return json.loads(FLEET_REGISTRY.read_text(encoding="utf-8"))


def build_fleet_status() -> dict:
    """Registry + local FLEET/ mirror presence (no secrets)."""
    reg = load_fleet_registry()
    items = []
    for entry in reg.get("core_fleet") or []:
        repo = entry.get("repo") or ""
        name = repo.split("/")[-1] if repo else entry.get("id")
        local_path = FLEET_DIR / name if name else None
        # HIVE-OS-CORE war room is THE_HIVE itself
        if entry.get("id") == "hive-os-core":
            present = True
            sha = None
            path = str(HIVE_ROOT)
            try:
                import subprocess

                r = subprocess.run(
                    ["git", "rev-parse", "--short", "HEAD"],
                    cwd=str(HIVE_ROOT),
                    capture_output=True,
                    text=True,
                    timeout=5,
                )
                if r.returncode == 0:
                    sha = r.stdout.strip()
            except Exception:
                pass
        else:
            present = bool(local_path and local_path.exists() and (local_path / ".git").exists())
            path = str(local_path) if local_path else None
            sha = None
            if present and local_path:
                try:
                    import subprocess

                    r = subprocess.run(
                        ["git", "rev-parse", "--short", "HEAD"],
                        cwd=str(local_path),
                        capture_output=True,
                        text=True,
                        timeout=5,
                    )
                    if r.returncode == 0:
                        sha = r.stdout.strip()
                except Exception:
                    pass
        items.append(
            {
                "id": entry.get("id"),
                "repo": repo,
                "role": entry.get("role"),
                "tags": entry.get("tags") or [],
                "private": entry.get("private"),
                "local_present": present,
                "local_path": path,
                "sha": sha,
            }
        )
    mirrored = sum(1 for i in items if i.get("local_present"))
    return {
        "ok": True,
        "github_account": reg.get("github_account", "JACK-SCHITT"),
        "fleet_dir": str(FLEET_DIR),
        "registry": str(FLEET_REGISTRY),
        "mirrored": mirrored,
        "total_core": len(items),
        "items": items,
        "extended_count": len(reg.get("extended_inventory") or []),
        "operation": reg.get("operation"),
    }


class HiveHandler(BaseHTTPRequestHandler):
    server_version = "HiveCockpit/5.2"

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("[hive-ui] " + (fmt % args) + "\n")

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", f"http://{HOST}:{PORT}")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("X-Hive-Hardening", "localhost-only;no-shell-exec")
        self.send_header("Cache-Control", "no-store")

    def _send(self, code: int, body: bytes, ctype: str) -> None:
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        try:
            parsed = urlparse(self.path)
            path = parsed.path.rstrip("/") or "/"

            if path in ("/", "/ui", "/cockpit"):
                if not UI_PATH.exists():
                    self._send(404, b"cockpit missing", "text/plain")
                    return
                html = UI_PATH.read_bytes()
                self._send(200, html, "text/html; charset=utf-8")
                return

            if path == "/api/status":
                code, body, ctype = _json_bytes(build_status())
                self._send(code, body, ctype)
                return

            if path == "/api/manifest":
                code, body, ctype = _json_bytes(load_manifest())
                self._send(code, body, ctype)
                return

            if path == "/api/commands":
                code, body, ctype = _json_bytes(load_commands())
                self._send(code, body, ctype)
                return

            if path.startswith("/api/commands/"):
                plat = path.split("/")[-1].lower()
                data = load_commands()
                platforms = data.get("platforms") or {}
                if plat not in platforms:
                    code, body, ctype = _json_bytes(
                        {"error": f"unknown platform {plat}", "have": list(platforms)},
                        404,
                    )
                else:
                    code, body, ctype = _json_bytes(platforms[plat])
                self._send(code, body, ctype)
                return

            if path == "/api/agents":
                code, body, ctype = _json_bytes(
                    {
                        "chosen_one": "krackerjack",
                        "testers": ["hunterprime", "counsel", "zorg"],
                        "protectors": ["scamshield", "luna"],
                        "orchestrator": "hive",
                        "product": "most complicated user-friendly OS · loyal to user · scam/predator shield",
                        "standalone": True,
                        "agents": AGENTS,
                    }
                )
                self._send(code, body, ctype)
                return

            if path == "/api/fleet":
                code, body, ctype = _json_bytes(build_fleet_status())
                self._send(code, body, ctype)
                return

            if path == "/api/fleet/registry":
                code, body, ctype = _json_bytes(load_fleet_registry())
                self._send(code, body, ctype)
                return

            if path == "/api/health":
                self._send(200, b'{"ok":true}', "application/json")
                return

            self._send(404, b'{"error":"not found"}', "application/json")
        except Exception as e:
            err = {"error": str(e), "trace": traceback.format_exc()[:800]}
            code, body, ctype = _json_bytes(err, 500)
            self._send(code, body, ctype)

    def do_POST(self) -> None:  # noqa: N802
        try:
            parsed = urlparse(self.path)
            path = parsed.path.rstrip("/") or "/"
            length = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(length) if length else b"{}"
            try:
                payload = json.loads(raw.decode("utf-8") or "{}")
            except json.JSONDecodeError:
                self._send(400, b'{"error":"bad json"}', "application/json")
                return

            if path == "/api/ask":
                prompt = (payload.get("prompt") or "").strip()
                agent = (payload.get("agent") or "krackerjack").strip().lower()
                force = payload.get("force")  # optional brain mode
                if not prompt:
                    self._send(400, b'{"error":"prompt required"}', "application/json")
                    return
                # Cap prompt size — no DOS via megabyte paste
                if len(prompt) > 8000:
                    prompt = prompt[:8000]
                load_dotenv()
                if agent in AGENTS:
                    text = run_agent(agent, prompt)
                    used = agent
                else:
                    text = ask_text(prompt, force=force)
                    used = "hive_link"
                code, body, ctype = _json_bytes(
                    {"ok": True, "agent": used, "reply": text}
                )
                self._send(code, body, ctype)
                return

            if path == "/api/offline":
                prompt = (payload.get("prompt") or "status").strip()[:8000]
                agent = (payload.get("agent") or "KRACKERJACK").strip()
                text = call_offline(prompt, agent=agent)
                code, body, ctype = _json_bytes(
                    {"ok": True, "agent": agent, "reply": text, "mode": "offline"}
                )
                self._send(code, body, ctype)
                return

            # Explicitly refuse shell execution forever
            if path in ("/api/exec", "/api/shell", "/api/run"):
                code, body, ctype = _json_bytes(
                    {
                        "error": "shell execution disabled",
                        "reason": "Hardening order: UI must not create remote code kill-paths",
                        "hint": "Copy commands from /api/commands and run in your own terminal",
                    },
                    403,
                )
                self._send(code, body, ctype)
                return

            self._send(404, b'{"error":"not found"}', "application/json")
        except Exception as e:
            err = {"error": str(e), "trace": traceback.format_exc()[:800]}
            code, body, ctype = _json_bytes(err, 500)
            self._send(code, body, ctype)


def main() -> int:
    load_dotenv()
    # Refuse non-loopback unless Architect forces (hard to kill remotely)
    if HOST not in ("127.0.0.1", "localhost", "::1") and os.getenv(
        "HIVE_UI_ALLOW_REMOTE"
    ) != "YES":
        print(
            f"[!] Refusing bind host {HOST!r}. Use 127.0.0.1 or set HIVE_UI_ALLOW_REMOTE=YES"
        )
        return 2

    httpd = ThreadingHTTPServer((HOST, PORT), HiveHandler)
    url = f"http://{HOST}:{PORT}/"
    print("=== HIVE COCKPIT API ===")
    print(f"Root:  {HIVE_ROOT}")
    print(f"UI:    {url}")
    print(f"API:   {url}api/status")
    print("Bind:  localhost only | no shell exec | multi-primary ready")
    print("Ctrl+C to stop")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[+] Hive UI stopped")
    finally:
        httpd.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
