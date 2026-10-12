#!/usr/bin/env python3
"""One dispatcher for the Hive's self-contained services (store, models, workflows).

Used by serve.py as a compact API surface:
    GET  /api/core?module=stats
    GET  /api/core?module=coll&action=list&name=notes
    POST /api/core   {"module":"kv","action":"set","scope":"app","key":"theme","val":"dark"}
"""
from __future__ import annotations

import store
import models


def dispatch(module: str, action: str, p: dict, model=None, operator: bool = False):
    m, a = (module or "").lower(), (action or "list").lower()

    if m == "stats":
        return 200, store.stats()

    if m == "kv":
        if a == "set":
            if not operator:
                return 403, {"error": "operator only"}
            return 200, store.kv_set(p.get("scope", "default"), p.get("key", ""), p.get("val"))
        if a == "get":
            return 200, {"scope": p.get("scope", "default"), "key": p.get("key", ""),
                         "val": store.kv_get(p.get("scope", "default"), p.get("key", ""), p.get("default"))}
        if a == "all":
            return 200, {"scope": p.get("scope", "default"), "kv": store.kv_all(p.get("scope", "default"))}
        return 400, {"error": "kv action?"}

    if m == "coll":
        if a == "add":
            return 200, store.coll_add(p.get("name", "default"), p.get("doc"))
        if a == "count":
            return 200, {"name": p.get("name", "default"), "count": store.coll_count(p.get("name", "default"))}
        return 200, {"name": p.get("name", "default"),
                     "docs": store.coll_list(p.get("name", "default"), int(p.get("limit", 100)))}

    if m == "channel":
        if a == "post":
            return 200, store.chan_post(p.get("name", "general"), p.get("author", "anon"), p.get("msg", ""))
        if a == "names":
            return 200, {"channels": store.chan_names()}
        return 200, {"name": p.get("name", "general"),
                     "messages": store.chan_list(p.get("name", "general"), int(p.get("limit", 50)))}

    if m == "token":
        if not operator:
            return 403, {"error": "operator only"}
        if a == "make":
            return 200, store.token_make(p.get("scope", "read"), p.get("label", ""))
        if a == "revoke":
            return 200, {"revoked": store.token_revoke(p.get("id", ""))}
        return 200, {"valid": store.token_check(p.get("id", ""), p.get("scope"))}

    if m == "task":
        if a == "add":
            return 200, store.task_add(p.get("name", "job"), p.get("kind", "note"), p.get("spec"))
        if a == "run":
            return 200, run_task(p.get("id", ""), model)
        if a == "history":
            return 200, {"runs": store.run_history(p.get("id"), int(p.get("limit", 50)))}
        return 200, {"tasks": store.task_list()}

    if m == "model":
        if a == "route":
            if model is None:
                return 400, {"error": "no model bound"}
            return 200, models.route(model, p.get("prompt", ""), p.get("provider", "seed"))
        return 200, models.status()

    return 400, {"error": f"unknown module '{module}'",
                 "modules": ["stats", "kv", "coll", "channel", "token", "task", "model"]}


def run_task(tid: str, model=None):
    task = next((t for t in store.task_list() if t["id"] == tid), None)
    if not task:
        return {"error": f"no task {tid}"}
    kind, spec = task["kind"], task.get("spec") or {}
    try:
        if kind == "plugin":
            import plugins as plugs
            out = plugs.run(spec.get("name", ""), spec.get("args"))
        elif kind == "agent":
            if model is None:
                out = {"error": "no model bound"}
            else:
                import plugins as plugs
                out = {"text": model.generate(spec.get("prompt", "")),
                       "matched": plugs._skills_search(spec.get("prompt", ""))}
        else:
            out = {"note": spec.get("note", "no-op")}
        store.run_log(tid, "ok", out)
        return {"task": tid, "name": task["name"], "status": "ok", "output": out}
    except Exception as e:  # noqa: BLE001
        store.run_log(tid, "error", {"error": str(e)})
        return {"task": tid, "name": task["name"], "status": "error", "output": str(e)}
