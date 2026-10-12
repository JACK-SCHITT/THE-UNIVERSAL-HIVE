#!/usr/bin/env python3
"""Unified Hive manifest — ONE list of everything in the Hive so the shell can give
every app, agent, tool and service its place and its use.

Consumers: web shell at "/", the cockpit, and any agent that wants to know what exists.
"""
from __future__ import annotations

import apps as apps_host
import employee_alpha as alpha
import models
import plugins
import prompts
import store
from registry import load_registry
from base_seed import PRIME

# Services are the built-in Hive capabilities the shell exposes as first-class places.
SERVICES = [
    {"id": "store",      "name": "Data",      "desc": "kv, documents, channels, tokens, tasks", "api": "/api/core"},
    {"id": "models",     "name": "Models",    "desc": "local-first model providers",            "api": "/api/models"},
    {"id": "workflows",  "name": "Workflows", "desc": "scheduled plugin/agent jobs",            "api": "/api/core?module=task"},
    {"id": "channels",   "name": "Channels",  "desc": "realtime message log",                   "api": "/api/core?module=channel"},
    {"id": "memory",     "name": "Memory",    "desc": "chained agent memory",                   "api": "/api/employee-alpha/status"},
    {"id": "prompts",    "name": "Prompts",   "desc": "per-agent system prompts + approvals",   "api": "/api/prompts"},
    {"id": "signal",     "name": "Signal",    "desc": "device-local operator notes",            "api": None},
]


def agents() -> list:
    reg = load_registry().get("agents", {})
    snap = {a["agent"]: a for a in prompts.snapshot()["agents"]}
    out = []
    for name, meta in reg.items():
        s = snap.get(name, {})
        out.append({
            "id": name,
            "name": meta.get("name") or name,
            "desc": meta.get("description") or "",
            "prompt_set": bool(s.get("prompt")),
            "task_set": bool(s.get("task")),
            "notes": meta.get("notes", ""),
        })
    if alpha.AGENT not in reg:
        out.append({"id": alpha.AGENT, "name": alpha.NAME, "desc": "hired hive worker",
                    "prompt_set": True, "task_set": False, "notes": "operator hired"})
    return sorted(out, key=lambda a: (a["id"] != alpha.AGENT, a["id"]))


def build() -> dict:
    apps = apps_host.app_list()
    pend = prompts.snapshot()["pending"]
    return {
        "law": PRIME,
        "agents": agents(),
        "apps": apps,
        "tools": plugins.list_manifest(),
        "services": SERVICES,
        "counts": {
            "agents": len(agents()),
            "apps": len(apps),
            "apps_built": sum(1 for a in apps if a.get("built")),
            "tools": len(plugins.list_manifest()),
            "services": len(SERVICES),
            "pending_prompts": len(pend),
        },
        "core": store.stats(),
        "models": models.status(),
    }


if __name__ == "__main__":
    import json
    d = build()
    print(json.dumps({"counts": d["counts"], "agents": [a["id"] for a in d["agents"]],
                      "services": [s["id"] for s in d["services"]]}, indent=2))
