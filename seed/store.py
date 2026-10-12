#!/usr/bin/env python3
"""HIVE CORE store — the Hive's own self-contained data layer (no outside services).

Gives the ecosystem the pieces it otherwise rents from SaaS, all in one SQLite file:

  kv          key/value settings per scope            (config, like Supabase tables)
  coll        document collections                    (app data, like Supabase rows)
  channel     message log per named channel           (like Slack)
  token       scoped bearer tokens                    (like a tiny auth layer)
  task        durable jobs with schedule + history     (like a workflow runner)

Nothing here phones home. Local-only by default; the model router decides if a
remote model is ever used, and that is opt-in per provider.
"""
from __future__ import annotations

import json
import os
import secrets
import sqlite3
import time

HERE = os.path.dirname(os.path.abspath(__file__))
DB = os.environ.get("HIVE_DB") or os.path.join(HERE, "hive.db")

_SCHEMA = """
CREATE TABLE IF NOT EXISTS kv (scope TEXT, key TEXT, val TEXT, updated TEXT,
  PRIMARY KEY (scope, key));
CREATE TABLE IF NOT EXISTS coll (id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, doc TEXT, created TEXT);
CREATE TABLE IF NOT EXISTS channel (id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, author TEXT, msg TEXT, created TEXT);
CREATE TABLE IF NOT EXISTS token (id TEXT PRIMARY KEY, scope TEXT, label TEXT,
  created TEXT, revoked INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS task (id TEXT PRIMARY KEY, name TEXT, kind TEXT,
  spec TEXT, enabled INTEGER DEFAULT 1, last TEXT, created TEXT);
CREATE TABLE IF NOT EXISTS run (id INTEGER PRIMARY KEY AUTOINCREMENT, task TEXT,
  status TEXT, output TEXT, created TEXT);
"""


def _now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(DB)
    c.executescript(_SCHEMA)
    return c


# ---- key/value -------------------------------------------------------------

def kv_set(scope: str, key: str, val) -> dict:
    with _conn() as c:
        c.execute("INSERT INTO kv(scope,key,val,updated) VALUES(?,?,?,?) "
                  "ON CONFLICT(scope,key) DO UPDATE SET val=excluded.val, updated=excluded.updated",
                  (scope, key, json.dumps(val), _now()))
    return {"scope": scope, "key": key, "val": val, "updated": _now()}


def kv_get(scope: str, key: str, default=None):
    with _conn() as c:
        row = c.execute("SELECT val FROM kv WHERE scope=? AND key=?", (scope, key)).fetchone()
    return json.loads(row[0]) if row else default


def kv_all(scope: str) -> dict:
    with _conn() as c:
        rows = c.execute("SELECT key,val FROM kv WHERE scope=?", (scope,)).fetchall()
    return {k: json.loads(v) for k, v in rows}


# ---- collections -----------------------------------------------------------

def coll_add(name: str, doc) -> dict:
    with _conn() as c:
        cur = c.execute("INSERT INTO coll(name,doc,created) VALUES(?,?,?)",
                        (name, json.dumps(doc), _now()))
        rid = cur.lastrowid
    return {"id": rid, "name": name, "doc": doc}


def coll_list(name: str, limit: int = 100, newest: bool = True) -> list:
    order = "DESC" if newest else "ASC"
    with _conn() as c:
        rows = c.execute(f"SELECT id,doc,created FROM coll WHERE name=? ORDER BY id {order} LIMIT ?",
                         (name, int(limit))).fetchall()
    return [{"id": r[0], "doc": json.loads(r[1]), "created": r[2]} for r in rows]


def coll_count(name: str) -> int:
    with _conn() as c:
        return c.execute("SELECT COUNT(*) FROM coll WHERE name=?", (name,)).fetchone()[0]


# ---- channels (Slack-ish) --------------------------------------------------

def chan_post(name: str, author: str, msg: str) -> dict:
    with _conn() as c:
        cur = c.execute("INSERT INTO channel(name,author,msg,created) VALUES(?,?,?,?)",
                        (name, author, msg, _now()))
    return {"id": cur.lastrowid, "channel": name, "author": author, "msg": msg, "created": _now()}


def chan_list(name: str, limit: int = 50) -> list:
    with _conn() as c:
        rows = c.execute("SELECT id,author,msg,created FROM channel WHERE name=? ORDER BY id DESC LIMIT ?",
                         (name, int(limit))).fetchall()
    return [{"id": r[0], "author": r[1], "msg": r[2], "created": r[3]} for r in reversed(rows)]


def chan_names() -> list:
    with _conn() as c:
        return [r[0] for r in c.execute("SELECT DISTINCT name FROM channel ORDER BY name").fetchall()]


# ---- tokens ----------------------------------------------------------------

def token_make(scope: str, label: str = "") -> dict:
    tid = secrets.token_hex(16)
    with _conn() as c:
        c.execute("INSERT INTO token(id,scope,label,created) VALUES(?,?,?,?)",
                  (tid, scope, label, _now()))
    return {"id": tid, "scope": scope, "label": label, "created": _now()}


def token_check(tid: str, scope: str | None = None) -> bool:
    with _conn() as c:
        row = c.execute("SELECT scope,revoked FROM token WHERE id=?", (tid,)).fetchone()
    if not row or row[1]:
        return False
    return scope is None or row[0] == scope


def token_revoke(tid: str) -> bool:
    with _conn() as c:
        c.execute("UPDATE token SET revoked=1 WHERE id=?", (tid,))
    return True


# ---- tasks / workflows -----------------------------------------------------

def task_add(name: str, kind: str, spec: dict | None = None) -> dict:
    tid = secrets.token_hex(8)
    with _conn() as c:
        c.execute("INSERT INTO task(id,name,kind,spec,enabled,created) VALUES(?,?,?,?,1,?)",
                  (tid, name, kind, json.dumps(spec or {}), _now()))
    return {"id": tid, "name": name, "kind": kind, "spec": spec or {}, "enabled": True}


def task_list() -> list:
    with _conn() as c:
        rows = c.execute("SELECT id,name,kind,spec,enabled,last FROM task ORDER BY created").fetchall()
    return [{"id": r[0], "name": r[1], "kind": r[2], "spec": json.loads(r[3]),
             "enabled": bool(r[4]), "last": r[5]} for r in rows]


def run_log(task: str, status: str, output) -> dict:
    with _conn() as c:
        c.execute("INSERT INTO run(task,status,output,created) VALUES(?,?,?,?)",
                  (task, status, json.dumps(output), _now()))
        c.execute("UPDATE task SET last=? WHERE id=?", (_now(), task))
    return {"task": task, "status": status, "output": output}


def run_history(task: str | None = None, limit: int = 50) -> list:
    with _conn() as c:
        if task:
            rows = c.execute("SELECT id,task,status,output,created FROM run WHERE task=? ORDER BY id DESC LIMIT ?",
                             (task, int(limit))).fetchall()
        else:
            rows = c.execute("SELECT id,task,status,output,created FROM run ORDER BY id DESC LIMIT ?",
                             (int(limit),)).fetchall()
    return [{"id": r[0], "task": r[1], "status": r[2], "output": json.loads(r[3]), "created": r[4]}
            for r in rows]


def stats() -> dict:
    with _conn() as c:
        g = lambda q: c.execute(q).fetchone()[0]
        return {
            "db": os.path.relpath(DB, HERE),
            "kv": g("SELECT COUNT(*) FROM kv"),
            "documents": g("SELECT COUNT(*) FROM coll"),
            "messages": g("SELECT COUNT(*) FROM channel"),
            "tokens": g("SELECT COUNT(*) FROM token WHERE revoked=0"),
            "tasks": g("SELECT COUNT(*) FROM task"),
            "runs": g("SELECT COUNT(*) FROM run"),
        }


if __name__ == "__main__":
    print(json.dumps(stats(), indent=2))
