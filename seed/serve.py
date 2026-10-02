#!/usr/bin/env python3
"""LAN cockpit + JSON generate. Bind all interfaces so phones on Wi-Fi can hit it."""
from __future__ import annotations

import argparse
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
WEB = os.path.join(ROOT, "web")

from base_seed import NumpySeed, load_corpus, PRIME, filt  # noqa: E402
from registry import load_agent, spawn_subagent  # noqa: E402

MODEL = NumpySeed(load_corpus())


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=WEB, **k)

    def log_message(self, format, *args):
        pass

    def _json(self, code: int, obj: dict):
        raw = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "content-type")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/health":
            return self._json(200, {"ok": True, "law": PRIME, "service": "THE-UNIVERSAL-HIVE"})
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        n = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(n) or b"{}")
        if path == "/api/generate":
            agent = body.get("agent") or "base"
            prompt = body.get("prompt") or ""
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
    print("LAW:", PRIME)
    print(f"cockpit http://{args.host}:{args.port}/")
    print("phones on same Wi-Fi: http://<this-machine-ip>:%s/" % args.port)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
