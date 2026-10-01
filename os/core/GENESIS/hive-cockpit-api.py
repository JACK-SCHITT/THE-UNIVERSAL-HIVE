#!/usr/bin/env python3
"""
hive-cockpit-api.py
Local Flask-less API for the HIVE cockpit.
Listens on 127.0.0.1:8787 by default.
Dispatches to the Node HIVE_CORE modules.
Architect: KRACKERJACK1134
"""
import json, os, subprocess, sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

HIVE_CORE = os.environ.get("HIVE_CORE") or os.path.join(os.path.expanduser("~"), ".hive", "core")
PORT = int(os.environ.get("HIVE_PORT", "8787"))
HOST = os.environ.get("HIVE_HOST", "127.0.0.1")

def node_run(args, timeout=15):
    try:
        out = subprocess.check_output(
            ["node"] + args,
            cwd=HIVE_CORE, timeout=timeout, stderr=subprocess.STDOUT
        )
        return out.decode("utf-8", "replace")
    except subprocess.CalledProcessError as e:
        return f"[node exited {e.returncode}]\n" + e.output.decode("utf-8", "replace")
    except Exception as e:
        return f"[error] {e}\n"

ROUTES = {
    ("GET",  "/status"):       ["hive-init.js", "status"],
    ("GET",  "/identity"):     ["identity.js",   "show"],
    ("GET",  "/teach/list"):   ["teaching-module.js", "list"],
    ("GET",  "/teach/eyes"):   ["teaching-module.js", "eyes"],
    ("GET",  "/teach/random"): ["teaching-module.js", "random"],
    ("GET",  "/role/list"):    ["role-engine.js", "list"],
    ("GET",  "/zorg/scan"):    ["zorg-core.js", "scan", "127.0.0.1", "full"],
    ("GET",  "/refinery"):     ["refinery.js", "run"],
    ("GET",  "/claude/promise"): ["claude-subagent.js", "promise"],
}

class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="application/json"):
        b = body.encode("utf-8") if isinstance(body, str) else body
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(b)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(b)

    def log_message(self, fmt, *args):
        sys.stderr.write("[cockpit] " + (fmt % args) + "\n")

    def do_GET(self):
        u = urlparse(self.path)
        path = u.path
        # /ask?text=...
        if path == "/ask":
            qs = parse_qs(u.query)
            text = (qs.get("text", ["status"])[0]) or "status"
            out = node_run(["simplification-engine.js", "--execute", text], timeout=30)
            return self._send(200, out)
        if path == "/teach/say":
            qs = parse_qs(u.query)
            key = qs.get("key", [""])[0]
            out = node_run(["teaching-module.js", "say", key])
            return self._send(200, out)
        if path == "/zorg/scan":
            qs = parse_qs(u.query)
            target = qs.get("target", ["127.0.0.1"])[0]
            type_  = qs.get("type",  ["full"])[0]
            out = node_run(["zorg-core.js", "scan", target, type_], timeout=60)
            return self._send(200, out)
        if path == "/refinery":
            qs = parse_qs(u.query)
            sources = qs.get("sources", ["https://distfiles.gentoo.org"])[0].split(",")
            out = node_run(["refinery.js", "run"] + sources, timeout=30)
            return self._send(200, out)
        route = ("GET", path)
        if route in ROUTES:
            out = node_run(ROUTES[route])
            return self._send(200, out)
        return self._send(404, json.dumps({"error": "not found", "path": path}))

    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length).decode("utf-8", "replace") if length else ""
        try:
            j = json.loads(body) if body else {}
        except Exception:
            j = {}
        u = urlparse(self.path)
        if u.path == "/ask":
            text = j.get("text", "status")
            out = node_run(["simplification-engine.js", "--execute", text], timeout=30)
            return self._send(200, out)
        if u.path == "/zorg/scan":
            target = j.get("target", "127.0.0.1")
            type_  = j.get("type",  "full")
            out = node_run(["zorg-core.js", "scan", target, type_], timeout=60)
            return self._send(200, out)
        return self._send(404, json.dumps({"error": "not found", "path": u.path}))

def main():
    if not os.path.isdir(HIVE_CORE):
        sys.stderr.write(f"[cockpit] HIVE_CORE not found at {HIVE_CORE}\n")
    srv = HTTPServer((HOST, PORT), Handler)
    print(f"[cockpit] HIVE cockpit API listening on http://{HOST}:{PORT}/")
    print(f"[cockpit] HIVE_CORE = {HIVE_CORE}")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n[cockpit] shutting down")
        srv.shutdown()

if __name__ == "__main__":
    main()
