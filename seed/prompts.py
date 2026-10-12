#!/usr/bin/env python3
"""Per-agent system prompts, live directives, and the prompt-change request workflow.

Every AI in the Hive has its own system prompt and its own live task directive.
The operator may set either directly on any agent (including sub-agents).
Anyone else submits a change request; it is reviewed by the operator, and on
approval the change is applied to that agent AND returned to the sender.

Store: seed/prompts.json
    {
      "prompts":  { "<agent>": {"text": "...", "by": "...", "at": "..."} },
      "tasks":    { "<agent>": {"text": "...", "by": "...", "at": "..."} },
      "requests": [ {id, agent, kind, text, requester, contact, status,
                     created, decided, by, reason, delivery} ]
    }
"""
from __future__ import annotations

import json
import os
import time
import uuid

HERE = os.path.dirname(os.path.abspath(__file__))
STORE = os.path.join(HERE, "prompts.json")

OPERATORS = {
    "KRACKERJACK1134",
    "KINGJACK1134",
    "JACKSCHITT1134",
    "JACK-SCHITT",
    "operator",
}

KINDS = ("prompt", "task")


def _now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _load() -> dict:
    if not os.path.isfile(STORE):
        return {"prompts": {}, "tasks": {}, "requests": []}
    with open(STORE, "r", encoding="utf-8") as f:
        d = json.load(f)
    d.setdefault("prompts", {})
    d.setdefault("tasks", {})
    d.setdefault("requests", [])
    return d


def _save(d: dict) -> None:
    with open(STORE, "w", encoding="utf-8") as f:
        json.dump(d, f, indent=2)
        f.write("\n")


def _text(d: dict, kind: str, agent: str) -> str:
    slot = d["prompts"] if kind == "prompt" else d["tasks"]
    return (slot.get(agent) or {}).get("text", "")


def get_prompt(agent: str) -> str:
    return _text(_load(), "prompt", agent)


def get_task(agent: str) -> str:
    return _text(_load(), "task", agent)


def overlay(agent: str) -> str:
    """Extra context appended to an agent's system prompt: its own prompt + live task."""
    d = _load()
    out = []
    p = _text(d, "prompt", agent)
    t = _text(d, "task", agent)
    if p:
        out.append("OPERATOR SYSTEM PROMPT:\n" + p)
    if t:
        out.append("CURRENT DIRECTIVE FROM OPERATOR:\n" + t)
    return ("\n\n" + "\n\n".join(out)) if out else ""


def _is_operator(by: str) -> bool:
    return (by or "").strip() in OPERATORS


def set_field(agent: str, kind: str, text: str, by: str) -> dict:
    if not _is_operator(by):
        raise PermissionError("only the operator sets system prompts and directives directly")
    if kind not in KINDS:
        raise ValueError("kind must be 'prompt' or 'task'")
    d = _load()
    slot = d["prompts"] if kind == "prompt" else d["tasks"]
    text = (text or "").strip()
    if text:
        slot[agent] = {"text": text, "by": by, "at": _now()}
    else:
        slot.pop(agent, None)
    _save(d)
    return {"agent": agent, "kind": kind, "text": text, "by": by, "at": _now()}


def set_prompt(agent: str, text: str, by: str) -> dict:
    if not _is_operator(by):
        raise PermissionError("only the operator sets system prompts")
    return _apply(agent, "prompt", text, by)


def set_task(agent: str, text: str, by: str) -> dict:
    if not _is_operator(by):
        raise PermissionError("only the operator sets agent directives")
    return _apply(agent, "task", text, by)


def _apply(agent: str, kind: str, text: str, by: str) -> dict:
    d = _load()
    slot = d["prompts"] if kind == "prompt" else d["tasks"]
    slot[agent] = {"text": text.strip(), "by": by, "at": _now()}
    _save(d)
    return {"agent": agent, kind: text.strip(), "by": by, "at": _now()}


def submit_request(agent: str, text: str, kind: str = "prompt",
                   requester: str = "friend", contact: str = "") -> dict:
    if not agent or not text.strip():
        raise ValueError("agent and text are required")
    if kind not in KINDS:
        raise ValueError(f"kind must be one of {KINDS}")
    d = _load()
    req = {
        "id": uuid.uuid4().hex[:12],
        "agent": agent,
        "kind": kind,
        "text": text.strip(),
        "requester": requester or "friend",
        "contact": contact.strip(),
        "status": "pending",
        "created": _now(),
        "decided": None,
        "by": None,
        "reason": None,
        "delivery": None,
    }
    d["requests"].append(req)
    _save(d)
    return {"ok": True, "request": req,
            "note": "Sent to the operator for review. Keep your request id to collect the answer."}


def list_requests(status: str | None = None, agent: str | None = None) -> list:
    reqs = _load()["requests"]
    if status:
        reqs = [r for r in reqs if r["status"] == status]
    if agent:
        reqs = [r for r in reqs if r["agent"] == agent]
    return list(reversed(reqs))


def get_request(rid: str) -> dict | None:
    for r in _load()["requests"]:
        if r["id"] == rid:
            return r
    return None


def _try_send(contact: str, message: str) -> str:
    """Deliver the decision back to the sender. Uses SMTP if configured, else outbox."""
    if not contact:
        return "no-contact-on-file"
    if "@" in contact and os.environ.get("HIVE_SMTP_HOST"):
        import smtplib
        from email.message import EmailMessage
        try:
            msg = message and _email(contact, message)
            host = os.environ["HIVE_SMTP_HOST"]
            port = int(os.environ.get("HIVE_SMTP_PORT", "587"))
            user = os.environ.get("HIVE_SMTP_USER", "")
            pw = os.environ.get("HIVE_SMTP_PASS", "")
            with smtplib.SMTP(contact_host(host), port, timeout=20) as s:
                s.starttls()
                if user:
                    s.login(user, pw)
                s.send_message(msg)
            return "sent"
        except Exception as e:  # noqa: BLE001
            return f"queued (send failed: {e})"
    return "outbox"


def _try_send_env(contact: str, message: str) -> str:
    return _try_send(contact, message)


def _decide(rid: str, approver: str, status: str, reason: str | None = None) -> dict:
    if not _is_operator(approver):
        raise PermissionError("only the operator can decide prompt requests")
    d = _load()
    req = next((r for r in d["requests"] if r["id"] == rid), None)
    if not req:
        raise KeyError(f"no request {rid}")
    if req["status"] != "pending":
        raise ValueError(f"request {rid} already {req['status']}")
    req["status"] = status
    req["decided"] = _now()
    req["by"] = approver
    if status == "approved":
        slot = d["prompts"] if req["kind"] == "prompt" else d["tasks"]
        slot[req["agent"]] = {"text": req["text"], "by": approver, "at": _now()}
        msg = (f"Your {req['kind']} change for {req['agent']} was APPROVED by {approver} "
               f"and is now live on that agent. Request {rid}.")
    else:
        req["reason"] = reason or "not approved"
        msg = (f"Your {req['kind']} change for {req['agent']} was not approved. "
               f"Request {rid}. Reason: {req['reason']}")
    req["delivery"] = {"message": msg, "channel": _try_send(req.get("contact", ""), msg),
                       "at": _now()}
    _save(d)
    return {"ok": True, "request": req, "applied_to": req["agent"] if status == "approved" else None}


def approve(rid: str, approver: str) -> dict:
    return _decide(rid, approver, "approved")


def deny(rid: str, approver: str, reason: str = "not approved") -> dict:
    return _decide(rid, approver, "denied", reason)


def snapshot(agents: list[str] | None = None) -> dict:
    """Everything an operator UI needs: each agent's prompt/task + pending requests."""
    d = _load()
    names = set(agents or []) | set(d["prompts"]) | set(d["tasks"])
    rows = []
    for a in sorted(names):
        rows.append({
            "agent": a,
            "prompt": _text(d, "prompt", a),
            "task": _text(d, "task", a),
            "prompt_by": (d["prompts"].get(a) or {}).get("by"),
            "task_by": (d["tasks"].get(a) or {}).get("by"),
        })
    return {"agents": rows,
            "pending": [r for r in d["requests"] if r["status"] == "pending"],
            "decided": [r for r in d["requests"] if r["status"] != "pending"][-50:]}


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "demo":
        print(json.dumps(snapshot(), indent=2))
    else:
        print(json.dumps(snapshot(), indent=2))
