#!/usr/bin/env python3
"""Base-first agent registry. Specialized prompts only after operator save."""
from __future__ import annotations

import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
REG = os.path.join(HERE, "registry.json")
BASE = os.path.join(HERE, "BASE_SEED.txt")


def _read(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def load_registry() -> dict:
    with open(REG, "r", encoding="utf-8") as f:
        return json.load(f)


def save_registry(data: dict) -> None:
    with open(REG, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def base_prompt() -> str:
    return _read(BASE)


def load_agent(name: str) -> str:
    data = load_registry()
    base = base_prompt()
    agent = data.get("agents", {}).get(name) or data.get("agents", {}).get("base")
    extra = ""
    if agent and agent.get("prompt_file"):
        path = os.path.join(HERE, agent["prompt_file"])
        if os.path.isfile(path):
            extra = "\n\nOPERATOR SPECIALIZATION:\n" + _read(path)
    return base + extra


def spawn_subagent(parent: str, child: str) -> str:
    data = load_registry()
    data.setdefault("agents", {})
    data["agents"][child] = {
        "prompt_file": None,
        "parent": parent,
        "notes": "Born on Base Seed. No inherited specialization.",
    }
    save_registry(data)
    return load_agent(child)


def save_specialization(name: str, text: str, operator: str) -> None:
    if operator not in ("KRACKERJACK1134", "operator"):
        raise PermissionError("only operator writes specializations")
    fname = f"agent_{name}.txt"
    path = os.path.join(HERE, fname)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text.strip() + "\n")
    data = load_registry()
    data.setdefault("agents", {})
    data["agents"][name] = {"prompt_file": fname, "notes": "operator saved"}
    save_registry(data)
