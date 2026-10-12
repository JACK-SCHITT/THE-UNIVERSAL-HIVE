#!/usr/bin/env python3
"""Persistent memory for hive agents. Tamper-evident digest chain + keyword recall.

Chain format mirrors HIVE_CORE/refinery.js (prev digest + sha256), so the bigger
forensics Memory Refinery can share or replace this backend without migration.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import time

HERE = os.path.dirname(os.path.abspath(__file__))
MEM_DIR = os.environ.get("HIVE_MEMORY_DIR") or os.path.join(HERE, "memory")
GENESIS = "GENESIS"


def _path(agent: str) -> str:
    os.makedirs(MEM_DIR, exist_ok=True)
    safe = re.sub(r"[^A-Za-z0-9_.-]", "_", agent)
    return os.path.join(MEM_DIR, safe + ".jsonl")


def _tokens(text: str) -> set:
    return set(re.findall(r"[a-z0-9]{2,}", (text or "").lower()))


def _digest(prev: str, entry: dict) -> str:
    payload = {k: v for k, v in entry.items() if k != "digest"}
    blob = json.dumps({"prev": prev, **payload}, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()


def _tail(path: str):
    last = None
    if os.path.isfile(path):
        with open(path, encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    last = line
    if not last:
        return GENESIS, None
    try:
        parsed = json.loads(last)
        return parsed.get("digest", GENESIS), parsed
    except Exception:
        return GENESIS, None


def remember(agent: str, session: str, text: str, role: str = "user", importance: int = 1) -> dict:
    path = _path(agent)
    prev, _ = _tail(path)
    entry = {
        "ts": time.time(),
        "when": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "session": session,
        "role": role,
        "importance": int(importance),
        "text": str(text).strip(),
        "prev": prev,
    }
    entry["digest"] = _digest(prev, entry)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")
    return entry


def recall(agent: str, query: str, k: int = 6, session: str = None) -> list:
    path = _path(agent)
    entries = all_memory(agent)
    if not entries:
        return []
    qt = _tokens(query)
    now = time.time()
    scored = []
    for e in entries:
        if session and e.get("session") != session:
            continue
        overlap = len(qt & _tokens(e.get("text", "")))
        if qt and overlap == 0:
            continue
        recency = max(0.0, 1.0 - (now - e.get("ts", 0)) / (90 * 86400))
        score = overlap + 0.3 * e.get("importance", 1) + recency
        scored.append((score, e))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [e for _, e in scored[:k]]


def verify(agent: str) -> dict:
    entries = all_memory(agent)
    prev = GENESIS
    for i, e in enumerate(entries):
        if "digest" not in e:
            return {"ok": True, "entries": len(entries), "verified": i, "legacy_from": i}
        expected = _digest(e.get("prev", GENESIS), e)
        if e.get("prev") != prev or e["digest"] != expected:
            return {"ok": False, "entries": len(entries), "broken_at": i, "when": e.get("when")}
        prev = e["digest"]
    return {"ok": True, "entries": len(entries), "verified": len(entries), "head": prev[:12]}


def chain(agent: str, n: int = 20) -> list:
    return all_memory(agent)[-n:]


def stats(agent: str) -> dict:
    entries = all_memory(agent)
    return {"agent": agent, "entries": len(entries),
            "chars": sum(len(e.get("text", "")) for e in entries)}


def all_memory(agent: str) -> list:
    path = _path(agent)
    out = []
    if os.path.isfile(path):
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        out.append(json.loads(line))
                    except Exception:
                        pass
    return out