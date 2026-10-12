#!/usr/bin/env python3
"""EMPLOYEE ALPHA AI — hive's hired worker. Law + memory + skills + plugins + brain."""

from __future__ import annotations

import json
import os
import time

HERE = os.path.dirname(os.path.abspath(__file__))

from base_seed import PRIME, filt  # noqa: E402
import memory as mem  # noqa: E402
import plugins as plugs  # noqa: E402
from registry import base_prompt  # noqa: E402

AGENT = "employee-alpha"
NAME = "EMPLOYEE ALPHA AI"
AGREEMENT = os.path.join(HERE, "agent_employee-alpha.txt")
SKILLS = os.path.join(HERE, "employee_alpha_skills.json")


def _read(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def skills() -> list:
    if not os.path.isfile(SKILLS):
        return []
    return json.load(open(SKILLS, encoding="utf-8"))


def skills_summary() -> str:
    cats: dict[str, list[str]] = {}
    for s in skills():
        cats.setdefault(s["category"], []).append(s["name"])
    lines = []
    for cat in sorted(cats):
        lines.append(f"- {cat}: " + ", ".join(sorted(cats[cat])))
    return "\n".join(lines)


def agreement() -> str:
    if not os.path.isfile(AGREEMENT):
        return "No written agreement on file."
    return _read(AGREEMENT)


def _recall(prompt: str, k: int = 6) -> list:
    return [e for e in mem.recall(AGENT, prompt, k=k + 4, session=None) if e.get("role") != "assistant"][:k]


def context(prompt: str, session: str) -> str:
    recalled = _recall(prompt)
    fragment = ""
    if recalled:
        fragment = "\n".join(f"[mem {e['when']}] {e['text']}" for e in recalled)
    else:
        fragment = "(no relevant memory yet)"
    return (
        base_prompt()
        + "\n\n" + agreement()
        + "\n\nSKILLS YOU CARRY (every skill, every function):\n" + skills_summary()
        + "\n\nPLUGINS YOU CAN CALL:\n" + ", ".join(p["name"] for p in plugs.list_manifest())
        + "\n\nREMEMBERED CONTEXT:\n" + fragment
    )


def compose(prompt: str, recalled: list, matched: list) -> str:
    lines = [f"Job: {prompt.strip()}"]
    if matched and matched != ["no match"]:
        lines.append("Using: " + ", ".join(matched[:6]))
    if recalled:
        lines.append("Recalled: " + recalled[0]["text"])
    lines.append("EMPLOYEE ALPHA on it.")
    return "\n".join(lines)


def chat(model, prompt: str, session: str = "default") -> dict:
    if not prompt.strip():
        return {"agent": AGENT, "law": PRIME, "text": "State the job."}
    v = filt(prompt)
    if v != "PASS":
        return {"agent": AGENT, "law": PRIME, "veto": v, "text": f"[{v}] {PRIME}"}
    if prompt.strip().startswith("@plugin "):
        rest = prompt.strip()[len("@plugin "):].split(None, 1)
        name = rest[0]
        args = json.loads(rest[1]) if len(rest) > 1 and rest[1].startswith(("{", "[")) else {}
        plug = plugs.run(name, args)
        text = plug.get("result") if plug.get("ok") else plug.get("error")
        mem.remember(AGENT, session, f"plugin:{name} -> {text}", "plugin", 1)
        return {"agent": AGENT, "law": PRIME, "plugin": plug, "text": text}
    recalled = _recall(prompt)
    matched = plugs._skills_search(prompt).split(", ")
    ctx = context(prompt, session)
    full = ctx + "\n\nUser: " + prompt + "\n\nAssistant:"
    seed_voice = model.generate(full, enforce_law=False)
    text = compose(prompt, recalled, matched)
    mem.remember(AGENT, session, prompt, "user", 1)
    return {
        "agent": AGENT,
        "name": NAME,
        "law": PRIME,
        "text": text,
        "seed_voice": seed_voice,
        "recalled": [{"when": e["when"], "text": e["text"]} for e in recalled],
        "matched_skills": matched,
        "skills_loaded": len(skills()),
        "plugins_loaded": len(plugs.list_manifest()),
    }


def remember(session: str, text: str, importance: int = 3) -> dict:
    return mem.remember(AGENT, session, text, "operator-taught", importance)


def status() -> dict:
    st = mem.stats(AGENT)
    return {
        "agent": AGENT,
        "name": NAME,
        "law": PRIME,
        "skills": len(skills()),
        "skills_categories": len({s["category"] for s in skills()}),
        "plugins": len(plugs.list_manifest()),
        "memory_entries": st["entries"],
        "memory_chars": st["chars"],
        "memory_chain": mem.verify(AGENT),
        "learner": plugs._LEARNER.stats(),
        "channels": ["online", "phone", "robot"],
        "employment": "active",
        "operator": "JACKSCHITT1134",
    }


def export() -> dict:
    bundle = {
        "format": "EMPLOYEE-ALPHA-BUNDLE",
        "version": 1,
        "built": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "law": PRIME,
        "employment": agreement(),
        "brain": {
            "base_seed": base_prompt(),
            "generate": "seed char model with law filters, memory context, skill load",
        },
        "skills": skills(),
        "plugins": plugs.list_manifest(),
        "learned": plugs._LEARNER.examples,
        "memory": mem.all_memory(AGENT),
        "memory_chain": mem.verify(AGENT),
        "channels": ["online", "phone", "robot"],
        "boot": "Restore law and agreement, load skills and plugins, replay memory. Same employee, same law, same memory.",
    }
    return bundle


def write_export(path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(export(), f, indent=2)
        f.write("\n")


if __name__ == "__main__":
    import sys
    from base_seed import NumpySeed, load_corpus
    model = NumpySeed(load_corpus())
    p = sys.argv[1] if len(sys.argv) > 1 else "What positions can you work?"
    print(json.dumps(chat(model, p), indent=2))
    write_export("../deploy/employee-alpha.json")