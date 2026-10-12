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

import hashlib
import json
import os
import secrets
import sqlite3
import time
import uuid

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
CREATE TABLE IF NOT EXISTS account (id TEXT PRIMARY KEY, email TEXT UNIQUE,
  pass TEXT, salt TEXT, meta TEXT, created TEXT);
CREATE TABLE IF NOT EXISTS session (access TEXT PRIMARY KEY, refresh TEXT,
  user_id TEXT, created TEXT, expires INTEGER);
CREATE TABLE IF NOT EXISTS app_row (id TEXT PRIMARY KEY, tbl TEXT, doc TEXT,
  user_id TEXT, created TEXT, updated TEXT);
CREATE TABLE IF NOT EXISTS object (id TEXT PRIMARY KEY, bucket TEXT, name TEXT,
  mime TEXT, data BLOB, created TEXT);
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
            "accounts": g("SELECT COUNT(*) FROM account"),
            "rows": g("SELECT COUNT(*) FROM app_row"),
            "sessions": g("SELECT COUNT(*) FROM session"),
        }


# ---- accounts / sessions (Supabase auth layer) -----------------------------

def _hash(pw: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), salt.encode("utf-8"), 120_000).hex()


def account_create(email: str, password: str, meta: dict | None = None) -> dict:
    email = (email or "").strip().lower()
    uid = str(uuid.uuid4())
    salt = secrets.token_hex(8)
    with _conn() as c:
        c.execute("INSERT INTO account(id,email,pass,salt,meta,created) VALUES(?,?,?,?,?,?)",
                  (uid, email, _hash(password or "", salt), salt, json.dumps(meta or {}), _now()))
    return {"id": uid, "email": email, "meta": meta or {}, "created": _now()}


def account_get(email: str):
    with _conn() as c:
        r = c.execute("SELECT id,email,pass,salt,meta,created FROM account WHERE email=?",
                      ((email or "").strip().lower(),)).fetchone()
    return _acct(r) if r else None


def account_by_id(uid: str):
    with _conn() as c:
        r = c.execute("SELECT id,email,pass,salt,meta,created FROM account WHERE id=?", (uid,)).fetchone()
    return _acct(r) if r else None


def _acct(r) -> dict:
    return {"id": r[0], "email": r[1], "pass": r[2], "salt": r[3],
            "meta": json.loads(r[4]), "created": r[5]}


def account_check(email: str, password: str) -> dict | None:
    a = account_get(email)
    if not a:
        return None
    return a if _hash(password or "", a["salt"]) == a["pass"] else None


def account_update(uid: str, meta: dict | None = None, password: str | None = None) -> dict | None:
    a = account_by_id(uid)
    if not a:
        return None
    fields, vals = [], []
    if meta is not None:
        fields.append("meta=?"); vals.append(json.dumps(meta))
    if password:
        salt = secrets.token_hex(8)
        fields += ["pass=?", "salt=?"]; vals += [_hash(password, salt), salt]
    if fields:
        vals.append(uid)
        with _conn() as c:
            c.execute("UPDATE account SET " + ",".join(fields) + " WHERE id=?", vals)
    return account_by_id(uid)


def session_create(user_id: str, ttl: int = 3600, refresh_ttl: int = 2592000) -> dict:
    access = secrets.token_hex(24)
    refresh = secrets.token_hex(24)
    now = int(time.time())
    with _conn() as c:
        c.execute("INSERT INTO session(access,refresh,user_id,created,expires) VALUES(?,?,?,?,?)",
                  (access, refresh, user_id, _now(), now + ttl))
    return {"access": access, "refresh": refresh, "expires": now + ttl, "refresh_expires": now + refresh_ttl}


def session_get(access: str):
    with _conn() as c:
        r = c.execute("SELECT access,refresh,user_id,created,expires FROM session WHERE access=?",
                      (access,)).fetchone()
    if not r:
        return None
    return {"access": r[0], "refresh": r[1], "user_id": r[2], "created": r[3], "expires": r[4]}


def session_by_refresh(refresh: str):
    with _conn() as c:
        r = c.execute("SELECT access,refresh,user_id,created,expires FROM session WHERE refresh=?",
                      (refresh,)).fetchone()
    if not r:
        return None
    return {"access": r[0], "refresh": r[1], "user_id": r[2], "created": r[3], "expires": r[4]}


def session_delete(access: str) -> bool:
    with _conn() as c:
        c.execute("DELETE FROM session WHERE access=?", (access,))
    return True


# ---- table rows (Supabase PostgREST layer) ---------------------------------

def row_insert(tbl: str, doc, user_id: str | None = None) -> dict:
    rid = str(uuid.uuid4())
    if isinstance(doc, dict):
        rid = str(doc.get("id") or rid)
        if "id" not in doc:
            doc = {**doc, "id": rid}
    with _conn() as c:
        c.execute("INSERT INTO app_row(id,tbl,doc,user_id,created,updated) VALUES(?,?,?,?,?,?)",
                  (rid, tbl, json.dumps(doc), user_id, _now(), _now()))
    return doc


def row_insert_many(tbl: str, docs: list, user_id: str | None = None) -> list:
    return [row_insert(tbl, d, user_id) for d in docs]


def _match(doc: dict, filters: list) -> bool:
    for col, op, val in filters:
        dv = doc.get(col)
        if op == "eq" and str(dv) != str(val):
            return False
        if op == "neq" and str(dv) == str(val):
            return False
        if op == "in" and str(dv) not in [v for v in val.split(",")]:
            return False
        if op == "gt" and not (dv is not None and str(dv) > str(val)):
            return False
        if op == "lt" and not (dv is not None and str(dv) < str(val)):
            return False
        if op == "gte" and not (dv is not None and str(dv) >= str(val)):
            return False
        if op == "lte" and not (dv is not None and str(dv) <= str(val)):
            return False
        if op == "like" and val.strip("%") not in str(dv):
            return False
    return True


def row_select(tbl: str, filters: list | None = None, limit: int | None = None,
               offset: int = 0, order: str | None = None) -> list:
    with _conn() as c:
        rows = c.execute("SELECT id,doc,created,updated FROM app_row WHERE tbl=? ORDER BY updated DESC",
                         (tbl,)).fetchall()
    out = [{"_id": r[0], **json.loads(r[1]), "created_at": r[2], "updated_at": r[3]} for r in rows]
    if filters:
        out = [d for d in out if _match(d, filters)]
    if order:
        col, _, direction = order.partition(".")
        out.sort(key=lambda d: str(d.get(col, "")), reverse=(direction == "desc"))
    if offset:
        out = out[int(offset):]
    if limit:
        out = out[:int(limit)]
    for d in out:
        d.pop("_id", None)
    return out


def row_update(tbl: str, filters: list, patch: dict) -> list:
    hits = row_select(tbl, filters)
    out = []
    with _conn() as c:
        for h in hits:
            rid_row = c.execute("SELECT id,doc FROM app_row WHERE tbl=? AND id=?",
                                (tbl, h.get("id"))).fetchone()
            if not rid_row:
                continue
            doc = {**json.loads(rid_row[1]), **patch}
            c.execute("UPDATE app_row SET doc=?,updated=? WHERE id=?", (json.dumps(doc), _now(), rid_row[0]))
            out.append(doc)
    return out


def row_delete(tbl: str, filters: list) -> int:
    hits = row_select(tbl, filters)
    n = 0
    with _conn() as c:
        for h in hits:
            cur = c.execute("DELETE FROM app_row WHERE tbl=? AND id=?", (tbl, h.get("id")))
            n += cur.rowcount
    return n


def row_tables() -> list:
    with _conn() as c:
        return [r[0] for r in c.execute("SELECT DISTINCT tbl FROM app_row ORDER BY tbl").fetchall()]


# ---- storage objects -------------------------------------------------------

def obj_put(bucket: str, name: str, mime: str, data: bytes) -> dict:
    oid = str(uuid.uuid4())
    with _conn() as c:
        c.execute("INSERT INTO object(id,bucket,name,mime,data,created) VALUES(?,?,?,?,?,?)",
                  (oid, bucket, name, mime, sqlite3.Binary(data), _now()))
    return {"id": oid, "bucket": bucket, "name": name, "mime": mime, "size": len(data)}


def obj_get(bucket: str, name: str):
    with _conn() as c:
        r = c.execute("SELECT mime,data FROM object WHERE bucket=? AND name=? ORDER BY created DESC LIMIT 1",
                      (bucket, name)).fetchone()
    return {"mime": r[0], "data": bytes(r[1])} if r else None


def obj_list(bucket: str) -> list:
    with _conn() as c:
        rows = c.execute("SELECT id,name,mime,created FROM object WHERE bucket=? ORDER BY created DESC",
                         (bucket,)).fetchall()
    return [{"id": r[0], "name": r[1], "mime": r[2], "created": r[3]} for r in rows]


if __name__ == "__main__":
    print(json.dumps(stats(), indent=2))
