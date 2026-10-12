#!/usr/bin/env python3
"""HIVE SUPABASE GATEWAY — the Hive speaks the Supabase client protocol so every
absorbed app uses the Hive for auth, data, edge functions and storage instead of a
rented Supabase project. Nothing here leaves the device.

Routes (mounted by serve.py):
  /auth/v1/*        GoTrue subset   (signup, token, user, logout, otp, verify, settings)
  /rest/v1/{table}  PostgREST subset (select/insert/update/delete, filters, order, limit)
  /functions/v1/{name}  edge functions -> Hive plugins / model
  /storage/v1/*     object storage  (upload/download/list)
  /realtime/v1/*    minimal stub (apps degrade gracefully)
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
import uuid

import store

SECRET = os.environ.get("HIVE_JWT_SECRET") or store.kv_get("auth", "jwt_secret")
if not SECRET:
    import secrets as _s
    SECRET = _s.token_hex(32)
    store.kv_set("auth", "jwt_secret", SECRET)

ANON_KEY = os.environ.get("HIVE_ANON_KEY") or "hive-anon-key"
TOKEN_TTL = int(os.environ.get("HIVE_TOKEN_TTL") or 3600)


# ---- jwt (HS256, stdlib) ---------------------------------------------------

def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")


def _unb64(s: str) -> bytes:
    pad = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)


def jwt_make(payload: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    h = _b64(json.dumps(header, separators=(",", ":")).encode())
    p = _b64(json.dumps(payload, separators=(",", ":")).encode())
    sig = _b64(hmac.new(SECRET.encode(), f"{h}.{p}".encode(), hashlib.sha256).digest())
    return f"{h}.{p}.{sig}"


def jwt_decode(token: str):
    try:
        h, p, s = token.split(".")
        want = _b64(hmac.new(SECRET.encode(), f"{h}.{p}".encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(want, s):
            return None
        data = json.loads(_unb64(p))
        if data.get("exp") and data["exp"] < int(time.time()):
            return None
        return data
    except Exception:
        return None


# ---- user / session shaping ------------------------------------------------

def _user(acct: dict, last_sign_in: str | None = None) -> dict:
    return {
        "id": acct["id"],
        "aud": "authenticated",
        "role": "authenticated",
        "email": acct["email"],
        "email_confirmed_at": acct["created"],
        "phone": "",
        "confirmed_at": acct["created"],
        "last_sign_in_at": last_sign_in or acct["created"],
        "app_metadata": {"provider": "email", "providers": ["email"]},
        "user_metadata": acct.get("meta", {}),
        "identities": [],
        "created_at": acct["created"],
        "updated_at": acct["created"],
    }


def _session(acct: dict) -> dict:
    s = store.session_create(acct["id"], ttl=TOKEN_TTL)
    now = int(time.time())
    tok = jwt_make({
        "sub": acct["id"], "email": acct["email"], "role": "authenticated",
        "aud": "authenticated", "iat": now, "exp": s["expires"],
        "session_id": s["access"], "app_metadata": {"provider": "email"},
        "user_metadata": acct.get("meta", {}),
    })
    return {
        "access_token": tok, "token_type": "bearer", "expires_in": TOKEN_TTL,
        "expires_at": s["expires"], "refresh_token": s["refresh"],
        "user": _user(acct),
    }


def _bearer(headers: dict) -> str | None:
    auth = headers.get("authorization") or ""
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return None


def _current_user(headers: dict):
    tok = _bearer(headers)
    if not tok:
        return None
    data = jwt_decode(tok)
    if data and data.get("sub"):
        return store.account_by_id(data["sub"])
    # fall back to opaque access tokens
    sess = store.session_get(tok)
    return store.account_by_id(sess["user_id"]) if sess else None


# ---- query helpers ---------------------------------------------------------

def _q1(query: dict, key: str, default=None):
    v = query.get(key)
    if isinstance(v, list):
        return v[0] if v else default
    return v if v is not None else default


RESERVED = {"select", "order", "limit", "offset", "on_conflict", "columns", "apikey"}


def _filters(query: dict) -> list:
    out = []
    for k, v in query.items():
        if k in RESERVED:
            continue
        val = v[0] if isinstance(v, list) else v
        if "." in val:
            op, _, rest = val.partition(".")
            out.append((k, op.lower(), rest))
    return out


def _wants_object(headers: dict) -> bool:
    acc = (headers.get("accept") or "")
    return "vnd.pgrst.object" in acc


# ---- route handlers --------------------------------------------------------

def _auth(method: str, sub: str, query: dict, headers: dict, body: dict):
    if sub == "settings":
        return 200, {"external": {}, "disable_signup": False, "mailer_autoconfirm": True,
                     "providers": ["email"], "autoconfirm": True}

    if sub in ("signup", "admin/users"):
        email = body.get("email")
        password = body.get("password") or ""
        if not email:
            return 400, {"error": "missing_email", "error_description": "email required"}
        if store.account_get(email):
            return 422, {"error": "user_already_exists", "error_description": "User already registered"}
        meta = body.get("data") if isinstance(body.get("data"), dict) else {}
        acct = store.account_create(email, password, meta)
        return 200, _session(acct)

    if sub == "token":
        grant = _q1(query, "grant_type") or "password"
        if grant == "refresh_token":
            sess = store.session_by_refresh(body.get("refresh_token") or "")
            acct = store.account_by_id(sess["user_id"]) if sess else None
            if not acct:
                return 400, {"error": "invalid_grant", "error_description": "Invalid Refresh Token"}
            if sess:
                store.session_delete(sess["access"])
            return 200, _session(acct)
        if grant == "password":
            acct = store.account_check(body.get("email") or "", body.get("password") or "")
            if not acct:
                return 400, {"error": "invalid_grant", "error_description": "Invalid login credentials"}
            return 200, _session(acct)
        return 400, {"error": "unsupported_grant_type", "error_description": grant}

    if sub == "user":
        acct = _current_user(headers)
        if not acct:
            return 401, {"error": "invalid claim: missing sub claim", "error_description": "invalid token"}
        if method == "PUT":
            meta = body.get("data")
            acct = store.account_update(acct["id"], meta=meta if isinstance(meta, dict) else None,
                                        password=body.get("password"))
            return 200, _user(acct)
        return 200, _user(acct)

    if sub == "logout":
        tok = _bearer(headers)
        if tok:
            store.session_delete(tok)
        return 204, None

    if sub == "otp":
        return 200, {}

    if sub == "verify":
        # email OTP verify -> treat any token as accepted for local use
        email = body.get("email")
        acct = store.account_get(email) if email else None
        if not acct:
            return 400, {"error": "otp_expired", "error_description": "Token has expired or is invalid"}
        return 200, _session(acct)

    if sub == "health":
        return 200, {"name": "hive-auth", "version": "1.0.0"}

    return 404, {"error": "not_found", "error_description": sub}


def _rest(method: str, table: str, query: dict, headers: dict, body):
    pref = (headers.get("prefer") or "")
    rep = "return=representation" in pref
    filters = _filters(query)
    limit = _q1(query, "limit")
    offset = _q1(query, "offset") or 0
    order = _q1(query, "order")
    single = _wants_object(headers)

    def respond(rows):
        if single:
            if len(rows) == 1:
                return 200, rows[0]
            if len(rows) == 0:
                return 406, {"code": "PGRST116", "details": "Results contain 0 rows",
                             "hint": None, "message": "JSON object requested, multiple (or no) rows returned"}
            return 406, {"code": "PGRST116", "details": "Results contain %d rows" % len(rows),
                         "message": "JSON object requested, multiple (or no) rows returned"}
        return 200, rows

    if method == "GET":
        return respond(store.row_select(table, filters, int(limit) if limit else None,
                                        int(offset), order))
    if method == "POST":
        docs = body if isinstance(body, list) else [body]
        created = store.row_insert_many(table, docs)
        return respond(created) if rep else (201, None)
    if method == "PATCH":
        updated = store.row_update(table, filters, body if isinstance(body, dict) else {})
        return respond(updated) if rep else (204, None)
    if method == "DELETE":
        store.row_delete(table, filters)
        return 204, None
    return 405, {"error": "method_not_allowed"}


def _functions(name: str, body: dict, model=None):
    import plugins as plugs
    import models as model_router
    payload = body.get("body") if isinstance(body, dict) and "body" in body else body
    if not isinstance(payload, dict):
        payload = {"input": payload}
    # direct Hive plugin match
    try:
        names = {p["name"] for p in plugs.list_manifest()}
    except Exception:
        names = set()
    if name in names:
        return 200, {"result": plugs.run(name, payload)}
    # otherwise an AI edge function -> run through the Hive model router (auto)
    prompt = payload.get("prompt") or payload.get("message") or payload.get("input") or ""
    if model is not None and prompt:
        out = model_router.auto(model, str(prompt))
        return 200, {
            "function": name, "text": out.get("text", ""), "ok": bool(out.get("text")),
            "provider": out.get("provider"), "note": "served by Hive edge function router",
        }
    return 200, {"function": name, "text": "", "ok": False, "note": "no model/prompt bound"}


def _storage(method: str, parts: list, query: dict, headers: dict, body) -> tuple:
    # supabase-js storage URLs are /object/{bucket}/{path...} and /object/list/{bucket}
    if parts[:1] == ["object"]:
        sub = parts[1] if len(parts) > 1 else "public"
        path = "/".join(parts[2:])
        if method == "POST" and sub == "list":
            prefix = ""
            if isinstance(body, dict):
                prefix = body.get("prefix") or ""
            rows = [o for o in store.obj_list(parts[2] if len(parts) > 2 else "public")
                    if o["name"].startswith(prefix)]
            return 200, [{"name": o["name"], "id": str(uuid.uuid4()),
                          "updated_at": o["created"], "metadata": {"size": 0}} for o in rows], {}
        if sub != "list" and method == "POST" and not path:
            # create bucket (no-op persist hook)
            return 200, {"name": sub}, {}
        data = body if isinstance(body, (bytes, bytearray)) else b""
        if method in ("POST", "PUT"):
            meta = store.obj_put(sub, path or str(uuid.uuid4()),
                                 headers.get("content-type") or "application/octet-stream", bytes(data))
            return 200, {"Key": f"{sub}/{meta['name']}", **meta}, {}
        if method == "DELETE":
            return 200, {"message": "removed"}, {}
        if path:
            obj = store.obj_get(sub, path)
            if not obj:
                return 404, {"error": "not_found"}, {}
            return 200, obj["data"], {"content-type": obj["mime"]}
        return 200, store.obj_list(sub), {}

    # legacy /storage/v1/{bucket}/{path...}
    bucket = parts[0] if parts else "public"
    path = "/".join(parts[1:])
    if method == "POST":
        data = body if isinstance(body, (bytes, bytearray)) else b""
        meta = store.obj_put(bucket, path or str(uuid.uuid4()),
                             headers.get("content-type") or "application/octet-stream", bytes(data))
        return 200, {"Key": f"{bucket}/{meta['name']}", **meta}, {}
    if method == "DELETE":
        return 200, {"message": "removed"}, {}
    if path:
        obj = store.obj_get(bucket, path)
        if not obj:
            return 404, {"error": "not_found"}, {}
        return 200, obj["data"], {"content-type": obj["mime"]}
    return 200, store.obj_list(bucket), {}


def handle(method: str, path: str, query: dict, headers: dict, body, model=None) -> tuple:
    """Dispatch one request. Returns (status, payload, extra_headers).

    payload is a JSON-serializable object, or bytes for binary storage downloads.
    """
    headers = {k.lower(): v for k, v in (headers or {}).items()}
    query = query or {}
    segment = path.strip("/").split("/")
    if not segment:
        return 404, {"error": "not_found"}, {}
    root, rest = segment[0], segment[1:]
    if rest and rest[0].startswith("v"):
        rest = rest[1:]

    if root == "auth":
        code, obj = _auth(method, rest[0] if rest else "", query, headers, body or {})
        return code, obj, {}

    if root == "rest":
        table = rest[0] if rest else ""
        return (*_rest(method, table, query, headers, body), {})

    if root == "functions":
        name = rest[0] if rest else ""
        return (*_functions(name, body or {}, model), {})

    if root == "storage":
        return _storage(method, rest, query, headers, body)

    if root == "realtime":
        return 200, {"ok": True, "note": "realtime stub"}, {}

    return 404, {"error": "not_found", "path": path}, {}


if __name__ == "__main__":
    print(json.dumps({"anon_key": ANON_KEY, "ttl": TOKEN_TTL,
                      "routes": ["/auth/v1", "/rest/v1", "/functions/v1", "/storage/v1"]}, indent=2))
