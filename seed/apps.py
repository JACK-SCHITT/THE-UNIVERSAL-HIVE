#!/usr/bin/env python3
"""Hive app host — resolve absorbed apps and their servable build output."""
from __future__ import annotations

import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
APPS_DIR = os.path.join(ROOT, "apps")
MANIFEST = os.path.join(APPS_DIR, "APPS.json")
EXTERNAL = os.path.join(APPS_DIR, "EXTERNAL.json")

BUILD_CANDIDATES = ("dist", "out", "build", ".output/public")


def load_manifest() -> list:
    if not os.path.isfile(MANIFEST):
        return []
    with open(MANIFEST, "r", encoding="utf-8") as f:
        return json.load(f)


def load_external() -> list:
    if not os.path.isfile(EXTERNAL):
        return []
    with open(EXTERNAL, "r", encoding="utf-8") as f:
        return json.load(f)


def save_manifest(rows: list) -> None:
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(rows, f, indent=2)
        f.write("\n")


def app_dir(lane: str, appid: str) -> str:
    return os.path.join(APPS_DIR, lane, appid)


def serve_dir(lane: str, appid: str):
    """Return the directory to serve for an app, or None if not runnable.

    Only real build output counts for framework apps. A plain HTML file at the
    app root counts only when there is no package.json (genuinely static).
    """
    d = app_dir(lane, appid)
    if not os.path.isdir(d):
        return None
    for cand in BUILD_CANDIDATES:
        p = os.path.join(d, cand)
        if os.path.isfile(os.path.join(p, "index.html")):
            return p
    if not os.path.isfile(os.path.join(d, "package.json")) and os.path.isfile(os.path.join(d, "index.html")):
        return d
    return None


def app_list() -> list:
    out = []
    for a in load_manifest():
        sd = serve_dir(a["lane"], a["id"])
        out.append({
            "lane": a["lane"],
            "id": a["id"],
            "name": a.get("name") or a["id"],
            "kind": "app",
            "stack": a.get("stack", []),
            "source_repo": a.get("source_repo"),
            "built": bool(sd),
            "serve_dir": os.path.relpath(sd, ROOT) if sd else None,
            "url": f"/apps/{a['lane']}/{a['id']}/" if sd else None,
            "web": None,
            "embed": False,
        })
    for a in load_external():
        out.append({
            "lane": a.get("lane", "host"),
            "id": a["id"],
            "name": a.get("name") or a["id"],
            "kind": a.get("kind", "external"),
            "stack": a.get("stack", []),
            "source_repo": a.get("source_repo"),
            "built": bool(a.get("url")),
            "serve_dir": None,
            "url": None,
            "web": a.get("url"),
            "embed": bool(a.get("embed")),
            "blurb": a.get("blurb", ""),
        })
    return out


if __name__ == "__main__":
    for a in app_list():
        mark = "LIVE" if a["built"] else "    "
        print(f"{mark} {a['lane']:8} {a['id']:26} {a['url'] or '-'}")
