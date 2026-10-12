#!/usr/bin/env python3
"""LAN cockpit + JSON generate + absorbed-app host. Bind all interfaces so phones on Wi-Fi can hit it."""
from __future__ import annotations

import argparse
import json
import mimetypes
import os
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
WEB = os.path.join(ROOT, "web")

from base_seed import NumpySeed, load_corpus, PRIME, filt  # noqa: E402
from registry import load_agent, spawn_subagent  # noqa: E402
import apps as apps_host  # noqa: E402
import employee_alpha as alpha  # noqa: E402
import plugins as plugs  # noqa: E402

MODEL = NumpySeed(load_corpus())
APP_ROUTE = re.compile(r"^/apps/([A-Za-z0-9_-]+)/([A-Za-z0-9._-]+)(/.*)?$")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=WEB, **k)

    def log_message(self, format, *args):
        pass

    def _json(self, code: int, obj):
        raw = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(raw)

    def _file(self, full: str, code: int = 200):
        if not os.path.isfile(full):
            return self._json(404, {"error": "not found"})
        ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
        if full.endswith((".js", ".mjs")):
            ctype = "text/javascript"
        with open(full, "rb") as f:
            data = f.read()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "content-type")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.end_headers()

    def _serve_app(self, lane: str, appid: str, rest: str):
        base = apps_host.serve_dir(lane, appid)
        if not base:
            return self._json(404, {"error": "app not built", "lane": lane, "app": appid,
                                    "hint": "run seed/build_apps.py to build it"})
        rel = (rest or "/").lstrip("/")
        full = os.path.join(base, rel)
        if os.path.isdir(full):
            idx = os.path.join(full, "index.html")
            if os.path.isfile(idx):
                return self._file(idx)
        if os.path.isfile(full):
            return self._file(full)
        # SPA fallback: unknown path with no file extension routes to index.html
        if "." not in os.path.basename(rel) and os.path.isfile(os.path.join(base, "index.html")):
            return self._file(os.path.join(base, "index.html"))
        return self._json(404, {"error": "not found", "path": rel})

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/health":
            return self._json(200, {"ok": True, "law": PRIME, "service": "THE-UNIVERSAL-HIVE"})
        if path == "/api/apps":
            return self._json(200, {"law": PRIME, "apps": apps_host.app_list()})
        if path == "/api/employee-alpha/status":
            return self._json(200, alpha.status())
        if path == "/api/employee-alpha/skills":
            return self._json(200, {"agent": alpha.AGENT, "name": alpha.NAME, "count": len(alpha.skills()), "skills": alpha.skills()})
        if path == "/api/employee-alpha/plugins":
            return self._json(200, {"agent": alpha.AGENT, "plugins": alpha.plugs.list_manifest()})
        if path == "/api/employee-alpha/export":
            raw = json.dumps(alpha.export(), indent=2).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Disposition", "attachment; filename=employee-alpha.json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(raw)))
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(raw)
            return
        m = APP_ROUTE.match(path)
        if m:
            return self._serve_app(m.group(1), m.group(2), m.group(3))
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        n = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(n) or b"{}")
        if path == "/api/employee-alpha/chat":
            prompt = body.get("prompt") or ""
            session = body.get("session") or "default"
            return self._json(200, alpha.chat(MODEL, prompt, session))
        if path == "/api/employee-alpha/remember":
            text = body.get("text") or ""
            session = body.get("session") or "operator-taught"
            imp = int(body.get("importance") or 3)
            if not text.strip():
                return self._json(400, {"error": "empty text"})
            entry = alpha.mem.remember(alpha.AGENT, session, text, "taught", imp)
            return self._json(200, {"ok": True, "stored": entry, "stats": alpha.mem.stats(alpha.AGENT)})
        if path == "/api/generate":
            agent = body.get("agent") or "base"
            prompt = body.get("prompt") or ""
            if agent == alpha.AGENT:
                return self._json(200, alpha.chat(MODEL, prompt, body.get("session") or "default"))
            agent_prompt = load_agent(agent)
            v = filt(prompt)
            if v != "PASS":
                return self._json(200, {"agent": agent, "law": PRIME, "veto": v, "text": f"[{v}] {PRIME}"})
            full_prompt = agent_prompt + "\n\nUser: " + prompt + "\n\nAssistant:"
            out = MODEL.generate(full_prompt)
            return self._json(200, {"agent": agent, "law": PRIME, "prefix_chars": len(agent_prompt), "text": out})
        if path == "/api/spawn":
            child = body.get("child") or "sub"
            parent = body.get("parent") or "base"
            spawn_subagent(parent, child)
            return self._json(200, {"child": child, "born_on": "BASE_SEED"})
        return self._json(404, {"error": "no"})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="0.0.0.0")
    ap.add_argument("--port", type=int, default=8787)
    args = ap.parse_args()
    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    live = sum(1 for a in apps_host.app_list() if a["built"])
    print("LAW:", PRIME)
    print(f"cockpit http://{args.host}:{args.port}/")
    print(f"apps: {live} built / {len(apps_host.app_list())} absorbed -> http://{args.host}:{args.port}/apps/")
    print("phones on same Wi-Fi: http://<this-machine-ip>:%s/" % args.port)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
