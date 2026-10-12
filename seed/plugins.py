#!/usr/bin/env python3
"""Plugin registry for hive agents. Deterministic, sandboxed tools."""

from __future__ import annotations

import ast
import datetime
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))

from base_seed import filt  # noqa: E402
from memory import recall, remember, verify, chain  # noqa: E402
import learn as learn_mod  # noqa: E402
import store as store_mod  # noqa: E402
import models as models_mod  # noqa: E402

PLUGINS: dict[str, dict] = {}
_LEARNER = learn_mod.LEARNER


def register(name: str, desc: str, category: str, fn):
    PLUGINS[name] = {"name": name, "desc": desc, "category": category, "fn": fn}


def _math_eval(expr: str):
    node = ast.parse(expr, mode="eval").body
    def _eval(n):
        if isinstance(n, ast.Constant) and isinstance(n.value, (int, float)):
            return n.value
        if isinstance(n, ast.BinOp) and isinstance(n.op, (ast.Add, ast.Sub, ast.Mult, ast.Div, ast.FloorDiv, ast.Mod, ast.Pow)):
            return _biop(n.op, _eval(n.left), _eval(n.right))
        if isinstance(n, ast.UnaryOp) and isinstance(n.op, (ast.UAdd, ast.USub)):
            v = _eval(n.operand)
            return +v if isinstance(n.op, ast.UAdd) else -v
        raise ValueError("unsupported")
    def _biop(op, a, b):
        if isinstance(op, ast.Add): return a + b
        if isinstance(op, ast.Sub): return a - b
        if isinstance(op, ast.Mult): return a * b
        if isinstance(op, ast.Div): return a / b
        if isinstance(op, ast.FloorDiv): return a // b
        if isinstance(op, ast.Mod): return a % b
        return a ** b
    try:
        val = _eval(node)
        return val if isinstance(val, (int, float)) else "unsupported expression"
    except Exception as e:
        return f"error: {e}"


def _txt_count(text: str) -> dict:
    return {"words": len(text.split()), "chars": len(text), "lines": text.count("\n") + 1}


def _data_read(path: str, max_chars: int = 2000) -> str:
    full = os.path.abspath(os.path.join(HERE, path))
    if os.path.commonpath([HERE, full]) != HERE:
        return "path outside seed/"
    if not os.path.isfile(full):
        return "file not found"
    with open(full, "r", encoding="utf-8", errors="replace") as f:
        return f.read(max_chars)


register("memory.recall", "search agent memory for anything previously learned", "memory",
         lambda q, k=6, agent="employee-alpha": recall(agent, str(q), int(k)))
register("memory.learn", "store a fact or instruction permanently into agent memory", "memory",
         lambda text, agent="employee-alpha": remember(agent, "operator-taught", str(text), "taught", 3))
register("memory.verify", "verify the tamper-evident memory digest chain (forensic)", "memory",
         lambda agent="employee-alpha": verify(agent))
register("memory.chain", "return the last N memory entries with digests", "memory",
         lambda agent="employee-alpha", n=20: chain(agent, int(n)))
register("skills.search", "find abilities in the agent skill catalog", "knowledge",
         lambda q: _skills_search(str(q)))
register("math.eval", "run safe arithmetic (+, -, *, /, //, %, **)", "tools",
         lambda expr: _math_eval(str(expr)))
register("text.count", "count words/chars/lines in text", "tools",
         lambda text: _txt_count(str(text)))
register("text.veto", "check input against hive law filters", "security",
         lambda text: filt(str(text)))
register("time.now", "current UTC timestamp", "tools", lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
register("data.read", "read a file inside seed/", "data",
         lambda path: _data_read(str(path)))
register("learn.train", "teach a labeled example: x=[numbers], y=label", "learning",
         lambda x, y: _LEARNER.add(x, y))
register("learn.predict", "classify x=[numbers] using taught examples", "learning",
         lambda x: _LEARNER.predict(x))
register("learn.classes", "list labels the agent has learned", "learning",
         lambda: _LEARNER.classes())
register("learn.stats", "learning memory size and classes", "learning",
         lambda: _LEARNER.stats())
register("core.stats", "self-contained store size (kv, docs, messages, tasks)", "core",
         lambda: store_mod.stats())
register("store.set", "write a key/value into the Hive's own store", "core",
         lambda scope, key, val, _op="operator": store_mod.kv_set(str(scope), str(key), val))
register("store.get", "read a value from the Hive store", "core",
         lambda scope, key, default=None: store_mod.kv_get(str(scope), str(key), default))
register("channel.post", "post a message to a named Hive channel", "core",
         lambda name, msg, author="employee-alpha": store_mod.chan_post(str(name), str(author), str(msg)))
register("channel.read", "read the latest messages from a channel", "core",
         lambda name, limit=50: store_mod.chan_list(str(name), int(limit)))
register("task.add", "queue a durable job (kind: note|plugin|agent)", "core",
         lambda name, kind="note", spec=None: store_mod.task_add(str(name), str(kind), spec))
register("model.list", "list local and remote model providers", "core",
         lambda: models_mod.status())
register("core.stats.pretty", "human-readable Hive-core counters", "core",
         lambda: {k: v for k, v in store_mod.stats().items()})


def _skills_search(q: str) -> str:
    import re
    tokens = set(re.findall(r"[a-z0-9]{2,}", q.lower()))
    path = os.path.join(HERE, "employee_alpha_skills.json")
    if not os.path.isfile(path):
        return "no skill catalog"
    hits = []
    for s in json.load(open(path, encoding="utf-8")):
        hay = (s["name"] + " " + s.get("category", "") + " " + s.get("desc", "")).lower()
        if tokens <= set(re.findall(r"[a-z0-9]{2,}", hay)) or any(t in hay for t in tokens):
            hits.append(s["name"])
    return ", ".join(sorted(set(hits))[:12]) or "no match"


def run(name: str, args: dict = None) -> dict:
    p = PLUGINS.get(name)
    if not p:
        return {"ok": False, "error": f"no plugin '{name}'", "plugins": [x["name"] for x in list_manifest()]}
    try:
        if args:
            result = p["fn"](**args)
        else:
            result = p["fn"]()
        return {"ok": True, "plugin": name, "result": result}
    except Exception as e:
        return {"ok": False, "plugin": name, "error": str(e)}


def list_manifest() -> list:
    return [{"name": p["name"], "desc": p["desc"], "category": p["category"]}
            for p in sorted(PLUGINS.values(), key=lambda x: x["name"])]