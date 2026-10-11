#!/usr/bin/env python3
"""Build absorbed apps into servable output. Installs deps, builds, strips node_modules.

Usage:
  python3 seed/build_apps.py --only agents/krackerjack-ai
  python3 seed/build_apps.py --all
  python3 seed/build_apps.py --all --keep-node-modules
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import apps as host  # noqa: E402


def sh(cmd, cwd, timeout=900, env=None):
    e = dict(os.environ)
    e.update({"CI": "1", "NODE_ENV": e.get("NODE_ENV", "production")})
    if env:
        e.update(env)
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout, env=e)
    return r


def kind(d):
    pj = os.path.join(d, "package.json")
    if os.path.isfile(pj):
        try:
            p = json.load(open(pj))
        except Exception:
            return "broken"
        deps = {**(p.get("dependencies") or {}), **(p.get("devDependencies") or {})}
        scripts = p.get("scripts") or {}
        if "expo" in deps:
            return "expo"
        if "next" in deps:
            return "next"
        if "build" in scripts:
            return "vite"
        return "node"
    if os.path.isfile(os.path.join(d, "index.html")):
        return "static"
    return "stub"


def build_app(lane, appid, keep_nm=False):
    d = host.app_dir(lane, appid)
    name = f"{lane}/{appid}"
    k = kind(d)
    started = time.time()
    result = {"path": name, "kind": k, "status": "", "serve_dir": None}

    if host.serve_dir(lane, appid):
        result["status"] = "already-built"
        result["serve_dir"] = os.path.relpath(host.serve_dir(lane, appid), ROOT)
        return result

    if k == "static":
        result["status"] = "static"
        result["serve_dir"] = os.path.relpath(d, ROOT)
        return result
    if k in ("stub", "broken"):
        result["status"] = "stub"
        return result

    nm = os.path.join(d, "node_modules")
    if not os.path.isdir(nm):
        for lock in ("package-lock.json", "npm-shrinkwrap.json"):
            lp = os.path.join(d, lock)
            if os.path.isfile(lp):
                os.remove(lp)
        r = sh(["npm", "install", "--no-audit", "--no-fund", "--loglevel=error",
                "--registry=https://registry.npmjs.org/",
                "--fetch-retries=5", "--fetch-timeout=600000"], d)
        if r.returncode != 0:
            result["status"] = "install-failed"
            result["err"] = (r.stderr or r.stdout)[-400:]
            return result

    if k == "expo":
        r = sh(["npx", "--yes", "expo", "export", "--platform", "web", "--output-dir", "dist"], d)
    elif k == "next":
        r = sh(["npm", "run", "build"], d)
    else:
        r = sh(["npm", "run", "build"], d)

    ok = r.returncode == 0
    sd = host.serve_dir(lane, appid)
    if ok and sd:
        result["status"] = "built"
        result["serve_dir"] = os.path.relpath(sd, ROOT)
    else:
        result["status"] = "build-failed"
        result["err"] = ((r.stderr or r.stdout) or "")[-600:]

    if not keep_nm:
        shutil.rmtree(nm, ignore_errors=True)
    result["secs"] = round(time.time() - started, 1)
    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="lane/id")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--keep-node-modules", action="store_true")
    ap.add_argument("--limit", type=int, default=0, help="max apps to build")
    args = ap.parse_args()

    rows = host.load_manifest()
    targets = []
    if args.only:
        lane, appid = args.only.split("/", 1)
        targets = [(lane, appid)]
    elif args.all:
        targets = [(a["lane"], a["id"]) for a in rows]
    else:
        print("need --only lane/id or --all"); return

    log = []
    for i, (lane, appid) in enumerate(targets):
        if args.limit and i >= args.limit:
            break
        res = build_app(lane, appid, args.keep_node_modules)
        print(f"{res['status']:14} {res['path']:30} kind={res['kind']:6} {res.get('secs','')}s")
        if res.get("err"):
            print("   ", res["err"].replace("\n", " ")[:300])
        log.append(res)

    # persist serve_dir/built into APPS.json
    by_path = {f"{r['lane']}/{r['id']}": r for r in rows}
    for res in log:
        lane, appid = res["path"].split("/", 1)
        e = by_path.get(res["path"])
        if e is not None:
            e["build_status"] = res["status"]
            e["serve_dir"] = res["serve_dir"]
    host.save_manifest(rows)

    print("\n--- summary ---")
    from collections import Counter
    c = Counter(r["status"] for r in log)
    for k, v in c.most_common():
        print(f"  {v:2}  {k}")


if __name__ == "__main__":
    main()
