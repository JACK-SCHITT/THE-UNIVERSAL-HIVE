#!/usr/bin/env python3
"""Persistent append-only memory for hive agents. Recall by keyword + recency."""

from __future__ import annotations

import json
import os
import re
import time

HERE = os.path.dirname(os.path.abspath(__file__))
MEM_DIR = os.path.join(HERE, "memory")


def _path(agent: str) -> str:
    os.makedirs(MEM_DIR, exist_ok=True)
    safe = re.sub(r"[^A-Za-z0-9_.-]", "_", agent)
    return os.path.join(MEM_DIR, safe + ".jsonl")


def _tokens(text: str) -> set:
    return set(re.findall(r"[a-z0-9]{2,}", (text or "").lower()))


def remember(agent: str, session: str, text: str, role: str = "user", importance: int = 1) -> dict:
    entry = {
        "ts": time.time(),
        "when": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "session": session,
        "role": role,
        "importance": int(importance),
        "text": str(text).strip(),
    }
    with open(_path(agent), "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")
    return entry


def recall(agent: str, query: str, k: int = 6, session: str | None = None) -> list:
    path = _path(agent)
    if not os.path.isfile(path):
        return []
    q = _tokens(query)
    now = time.time()
    scored = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                e = json.loads(line)
            except Exception:
                continue
            if session and e.get("session") != session:
                continue
            overlap = len(q & _tokens(e.get("text", "")))
            if q and overlap == 0:
                continue
            recency = max(0, 1.0 - (now - e.get("ts", now)) / 604800.0)
            score = overlap + float(e.get("importance", 1)) * 0.5 + recency * 0.5
            scored.append((score, e))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [e for _, e in scored[:k]]


def stats(agent: str) -> dict:
    path = _path(agent)
    n = chars = 0
    if os.path.isfile(path):
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if line:
                n += 1
                try:
                    chars += len(json.loads(line).get("text", ""))
                except Exception:
                    pass
    return {"agent": agent, "entries": n, "chars": chars}


def all_memory(agent: str) -> list:
    path = _path(agent)
    out = []
    if os.path.isfile(path):
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if line:
                try:
                    out.append(json.loads(line))
                except Exception:
                    pass
    return out