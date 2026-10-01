#!/usr/bin/env python3
"""
HIVE AI OS Runtime â€” single local process that powers the full OS shell.

Ports:
  8790  OS shell + live action bridge (THIS)
  8787  GENESIS cockpit API (spawned)
  8788  Local KRACKERJACK install AI (spawned)
  11434 Ollama (must already be running)

Architect: KRACKERJACK1134
Policy: local-first; cloud optional toys only
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
HIVE = Path(r"C:\Users\ARCHITECT\THE_HIVE")
GENESIS = HIVE / "GENESIS"
LOCAL_OS = HIVE / "LOCAL_OS"
BOOTLAB = Path(r"D:\HIVE_BOOTLAB")
ISO = BOOTLAB / "Linux" / "ISO_amd64"
APPS = BOOTLAB / "Apps" / "Source"
HOST = "127.0.0.1"
PORT = 8790
OLLAMA = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
MODEL = os.environ.get("HIVE_LOCAL_MODEL", "phi3:mini")
PYTHON = sys.executable
NODE = r"C:\Users\ARCHITECT\AppData\Local\hermes\node\node.exe"
RUFUS = str(BOOTLAB / "Tools" / "rufus-4.15.exe")

CHILDREN: list[subprocess.Popen] = []


def log(msg: str) -> None:
    print(f"[hive-os] {msg}", flush=True)


def http_json(url: str, method: str = "GET", body: dict | None = None, timeout: int = 60):
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"Content-Type": "application/json"} if body is not None else {},
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read().decode("utf-8", "replace")
        try:
            return json.loads(raw)
        except Exception:
            return {"raw": raw}


def http_text(url: str, timeout: int = 60) -> str:
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def spawn(cmd: list[str], cwd: Path | None = None, env: dict | None = None) -> subprocess.Popen:
    e = os.environ.copy()
    if env:
        e.update(env)
    p = subprocess.Popen(
        cmd,
        cwd=str(cwd) if cwd else None,
        env=e,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    CHILDREN.append(p)
    log(f"spawn pid={p.pid} {' '.join(cmd[:3])}...")
    return p


def ensure_services() -> None:
    # GENESIS API
    try:
        urllib.request.urlopen("http://127.0.0.1:8787/status", timeout=2)
        log("GENESIS API already up")
    except Exception:
        api = GENESIS / "hive-cockpit-api.py"
        if api.exists():
            spawn([PYTHON, str(api)], cwd=GENESIS)
            time.sleep(1)

    # Local AI assistant
    try:
        urllib.request.urlopen("http://127.0.0.1:8788/health", timeout=2)
        log("Local AI already up")
    except Exception:
        assist = LOCAL_OS / "firstboot" / "krackerjack_local_assistant.py"
        if assist.exists():
            spawn(
                [PYTHON, str(assist)],
                cwd=assist.parent,
                env={
                    "HIVE_LOCAL_MODEL": MODEL,
                    "OLLAMA_MODELS": r"D:\HIVE_LOCAL_AI\ollama\models",
                },
            )
            time.sleep(1)


def media_inventory() -> dict:
    out = {"root": str(ISO), "items": []}
    if ISO.exists():
        for p in ISO.rglob("*"):
            if p.is_file() and p.suffix.lower() in {".iso", ".zip", ".partial", ".part"}:
                out["items"].append(
                    {
                        "path": str(p),
                        "name": p.name,
                        "mb": round(p.stat().st_size / (1024 * 1024), 2),
                        "ready": p.suffix.lower() in {".iso", ".zip"}
                        and p.stat().st_size > 50 * 1024 * 1024,
                    }
                )
    return out


def ollama_health() -> dict:
    try:
        tags = http_json(f"{OLLAMA}/api/tags")
        models = [m.get("name") for m in tags.get("models", [])]
        local_ready = any(
            m == MODEL or (m and m.startswith(MODEL.split(":")[0])) for m in models
        ) and not any("cloud" in (m or "").lower() and m == MODEL for m in models)
        # prefer any non-cloud model matching base name
        local_ready = any(
            m and "cloud" not in m.lower() and m.startswith(MODEL.split(":")[0])
            for m in models
        )
        return {
            "ok": True,
            "models": models,
            "model": MODEL,
            "local_ready": local_ready,
        }
    except Exception as e:
        return {"ok": False, "error": str(e), "local_ready": False, "models": []}


def ollama_chat(text: str) -> str:
    payload = {
        "model": MODEL,
        "stream": False,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are KRACKERJACK AI on HIVE AI OS Desktop. Local only. "
                    "Capricorn protocol. Help operate the federation OS."
                ),
            },
            {"role": "user", "content": text},
        ],
    }
    try:
        out = http_json(f"{OLLAMA}/api/chat", "POST", payload, timeout=300)
        return out.get("message", {}).get("content") or json.dumps(out)
    except Exception as e:
        # fallback to install assistant if up
        try:
            out = http_json(
                "http://127.0.0.1:8788/ask", "POST", {"text": text}, timeout=300
            )
            if out.get("ok"):
                return out.get("answer", "")
            return out.get("error", str(e))
        except Exception as e2:
            return f"Local AI unavailable: {e} | {e2}"


# Whitelisted live actions
def run_action(action: str, args: dict | None = None) -> dict:
    args = args or {}
    a = (action or "").strip().lower()

    def ok(msg, **extra):
        d = {"ok": True, "action": a, "message": msg}
        d.update(extra)
        return d

    def fail(msg):
        return {"ok": False, "action": a, "message": msg}

    # --- open paths / tools ---
    if a in ("open_iso_folder", "open_media"):
        subprocess.Popen(["explorer", str(ISO)])
        return ok(f"Opened {ISO}")
    if a == "open_hive":
        subprocess.Popen(["explorer", str(HIVE)])
        return ok(f"Opened {HIVE}")
    if a == "open_genesis":
        subprocess.Popen(["explorer", str(GENESIS)])
        return ok(f"Opened {GENESIS}")
    if a == "open_apps":
        subprocess.Popen(["explorer", str(APPS)])
        return ok(f"Opened {APPS}")
    if a == "open_bootlab":
        subprocess.Popen(["explorer", str(BOOTLAB)])
        return ok(f"Opened {BOOTLAB}")
    if a == "rufus":
        if Path(RUFUS).exists():
            subprocess.Popen([RUFUS])
            return ok("Rufus launched")
        return fail(f"Rufus missing: {RUFUS}")
    if a == "open_cockpit_html":
        webbrowser.open(GENESIS.joinpath("hive-cockpit.html").as_uri())
        return ok("GENESIS cockpit HTML opened")
    if a == "open_local_ai_ui":
        webbrowser.open("http://127.0.0.1:8788/")
        return ok("Local AI UI opened")
    if a == "open_desktop":
        webbrowser.open(f"http://{HOST}:{PORT}/hive-desktop.html")
        return ok("Desktop shell opened")

    # --- wsl / kali ---
    if a in ("wsl_kali", "open_kali", "terminal_kali"):
        subprocess.Popen(["wsl", "-d", "kali-linux"])
        return ok("WSL Kali started")
    if a == "hive_status_wsl":
        try:
            out = subprocess.check_output(
                ["wsl", "-d", "kali-linux", "--", "bash", "-lc", "uname -a; whoami"],
                timeout=30,
                stderr=subprocess.STDOUT,
            ).decode("utf-8", "replace")
            return ok("kali status", output=out)
        except Exception as e:
            return fail(str(e))

    # --- genesis API ---
    if a == "genesis_status":
        try:
            return ok("status", data=http_json("http://127.0.0.1:8787/status"))
        except Exception as e:
            return fail(f"GENESIS API down: {e}")
    if a == "genesis_eyes":
        try:
            return ok("eyes", data=http_text("http://127.0.0.1:8787/teach/eyes"))
        except Exception as e:
            return fail(str(e))
    if a == "genesis_saying":
        try:
            return ok("saying", data=http_text("http://127.0.0.1:8787/teach/random"))
        except Exception as e:
            return fail(str(e))
    if a == "genesis_zorg":
        target = args.get("target", "127.0.0.1")
        try:
            return ok(
                "zorg",
                data=http_text(
                    f"http://127.0.0.1:8787/zorg/scan?target={target}&type=full"
                ),
            )
        except Exception as e:
            return fail(str(e))
    if a == "genesis_ask":
        text = args.get("text", "status")
        try:
            from urllib.parse import quote

            return ok(
                "ask",
                data=http_text(f"http://127.0.0.1:8787/ask?text={quote(text)}"),
            )
        except Exception as e:
            return fail(str(e))
    if a == "genesis_refinery":
        try:
            return ok("refinery", data=http_json("http://127.0.0.1:8787/refinery"))
        except Exception as e:
            return fail(str(e))

    # --- local AI ---
    if a == "ai_health":
        return ok("ai", data=ollama_health())
    if a == "ai_chat":
        text = args.get("text", "Hive status report.")
        return ok("chat", answer=ollama_chat(text))
    if a == "ai_pull_model":
        # non-blocking pull
        spawn(
            [
                r"C:\Users\ARCHITECT\AppData\Local\Programs\Ollama\ollama.exe",
                "pull",
                MODEL,
            ],
            env={"OLLAMA_MODELS": r"D:\HIVE_LOCAL_AI\ollama\models"},
        )
        return ok(f"Pull started for {MODEL}")

    # --- app launches (npm) ---
    if a.startswith("launch_app:"):
        name = action.split(":", 1)[1]
        app_dir = APPS / name
        if not app_dir.exists():
            return fail(f"App not found: {app_dir}")
        pkg = app_dir / "package.json"
        if not pkg.exists():
            subprocess.Popen(["explorer", str(app_dir)])
            return ok(f"Opened folder {name} (no package.json)")
        # pick script
        try:
            scripts = json.loads(pkg.read_text(encoding="utf-8")).get("scripts", {})
        except Exception:
            scripts = {}
        script = "dev" if "dev" in scripts else ("start" if "start" in scripts else None)
        if not script:
            subprocess.Popen(["explorer", str(app_dir)])
            return ok(f"Opened folder {name}")
        node_dir = str(Path(NODE).parent)
        env = os.environ.copy()
        env["Path"] = node_dir + ";" + env.get("Path", "")
        subprocess.Popen(
            f'cmd /c "cd /d {app_dir} && npm run {script}"',
            shell=True,
            env=env,
        )
        return ok(f"npm run {script} in {name}")

    # --- media inventory ---
    if a == "media_inventory":
        return ok("media", data=media_inventory())

    # --- install script ---
    if a == "run_windows_autoinstall":
        ps1 = LOCAL_OS / "autoinstall" / "Install-HiveLocal.ps1"
        subprocess.Popen(
            [
                "powershell",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(ps1),
            ]
        )
        return ok("Install-HiveLocal.ps1 started")

    return fail(f"Unknown action: {action}")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *a):
        sys.stderr.write("[8790] " + (fmt % a) + "\n")

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, code: int, obj):
        raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self._cors()
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/api/health":
            gen_ok = False
            ai_ok = False
            try:
                urllib.request.urlopen("http://127.0.0.1:8787/status", timeout=2)
                gen_ok = True
            except Exception:
                pass
            try:
                urllib.request.urlopen("http://127.0.0.1:8788/health", timeout=2)
                ai_ok = True
            except Exception:
                pass
            oh = ollama_health()
            return self._json(
                200,
                {
                    "ok": True,
                    "os": "HIVE AI OS",
                    "runtime": f"http://{HOST}:{PORT}",
                    "genesis_api": gen_ok,
                    "local_ai_ui": ai_ok,
                    "ollama": oh,
                    "media": media_inventory(),
                },
            )
        if u.path == "/api/media":
            return self._json(200, media_inventory())
        if u.path == "/api/action":
            qs = parse_qs(u.query)
            action = (qs.get("name") or qs.get("action") or [""])[0]
            return self._json(200, run_action(action))
        # default static
        if u.path in ("/", ""):
            self.path = "/hive-desktop.html"
        return super().do_GET()

    def do_POST(self):
        u = urlparse(self.path)
        length = int(self.headers.get("Content-Length", "0") or 0)
        raw = self.rfile.read(length).decode("utf-8", "replace") if length else "{}"
        try:
            body = json.loads(raw) if raw else {}
        except Exception:
            body = {}
        if u.path == "/api/action":
            action = body.get("action") or body.get("name") or ""
            args = body.get("args") or {}
            # also allow flat fields
            for k, v in body.items():
                if k not in ("action", "name", "args"):
                    args[k] = v
            return self._json(200, run_action(action, args))
        if u.path == "/api/chat":
            text = body.get("text") or body.get("q") or "status"
            return self._json(200, {"ok": True, "answer": ollama_chat(text)})
        return self._json(404, {"ok": False, "error": "not found"})


def main():
    os.environ.setdefault("OLLAMA_MODELS", r"D:\HIVE_LOCAL_AI\ollama\models")
    log("Ensuring GENESIS + Local AI services...")
    ensure_services()
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    url = f"http://{HOST}:{PORT}/hive-desktop.html"
    log(f"HIVE AI OS RUNTIME online â†’ {url}")
    if os.environ.get('HIVE_NO_BROWSER') != '1':
        threading.Timer(1.2, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    finally:
        for p in CHILDREN:
            try:
                p.terminate()
            except Exception:
                pass


if __name__ == "__main__":
    main()

