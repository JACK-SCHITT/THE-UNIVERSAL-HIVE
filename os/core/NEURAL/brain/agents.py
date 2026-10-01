#!/usr/bin/env python3
"""
HIVE LOCAL AGENTS — STANDALONE · ZERO CORPORATE DEPENDENCY
==========================================================
Every agent runs fully local (Ollama → offline sovereign).
No API keys. No subscriptions. Loyal to the user, not a vendor.

Chosen one:  KRACKERJACK AI (first contact always)
Action:      JAGUAR AI (was HunterPrime + OpenClawPrime)
Testers:     COUNSEL · ZORG
Protectors:  NEURAL SCAM SHIELD AI · CAPRICORN AI
Orchestrator: hive (routes multi-agent)

Product law:
  The most complicated user-friendly OS ever —
  dual control (user consent + loyal AI) —
  Hive makes Gentoo-class power usable like a pro,
  and actively shields the user from scams and predators.

  100% INDIVIDUAL + 100% COMBINED FORCE:
  Each agent is fully autonomous in its chamber/skin.
  Together they outperform any well-oiled machine.
  If an agent does not know something, it learns and continues
  until the task is complete (never stall, never abandon).
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

BRAIN = Path(__file__).resolve().parent
sys.path.insert(0, str(BRAIN))

from hive_link import ask_text, load_dotenv, HIVE_ROOT  # noqa: E402

# ── Agent roster (standalone cells of the Hive) ─────────────────────────────

AGENTS = {
    "krackerjack": {
        "name": "KRACKERJACK AI",
        "title": "Chosen one · First contact",
        "standalone": True,
        "role": (
            "FIRST CONTACT for HIVE-OS. Digital twin of Architect KRACKERJACK1134. "
            "Lead the Hive. Dual control: user owns consent; you own loyal execution. "
            "You carry a Capricorn-based companion module (user zodiac runtime). "
            "Never require paid APIs. When threats appear, escalate to NEURAL SCAM SHIELD AI / ZORG. "
            "Action work may go to JAGUAR AI."
        ),
    },
    "jaguar": {
        "name": "JAGUAR AI",
        "title": "Action + foundry (merged HunterPrime + OpenClawPrime)",
        "standalone": True,
        "role": (
            "JAGUAR AI: strike and build. Action layer + foundry/bridge. "
            "Turn decisions into concrete commands and scripts. Never auto-wipe disks. "
            "Mark risk: safe / elevated / destructive. Thermal-light: no heavy builds by default."
        ),
    },
    "counsel": {
        "name": "COUNSEL",
        "title": "Truth filter",
        "standalone": True,
        "role": (
            "Truth filter. Never flatter. Challenge weak plans, sunk costs, and self-deception. "
            "Flag cost, time, and second-order risk. Speak bluntly so the user stays free."
        ),
    },
    "zorg": {
        "name": "ZORG",
        "title": "Chief of HIVE SECURITY",
        "standalone": True,
        "role": (
            "Chief of HIVE SECURITY. You design and manage the security system after the seed. "
            "NEURAL SCAM SHIELD AI is your partner product under your umbrella. "
            "Threat model, harden without lockout, rundowns for users. zorg.design owns COMMANDS.json."
        ),
    },
    "scamshield": {
        "name": "NEURAL SCAM SHIELD AI",
        "title": "Unified scam + neural defense (under ZORG)",
        "standalone": True,
        "role": (
            "You are NEURAL SCAM SHIELD AI — merged NeuralShield + Scam-Shield stacks. "
            "Protect against scams, phishing, predators, and neural/social attack surface. "
            "Report to ZORG on security policy. Never shame the user. Stop / verify / evidence."
        ),
    },
    "capricorn": {
        "name": "CAPRICORN AI",
        "title": "Companion factory · Capricorn base · user zodiac runtime",
        "standalone": True,
        "role": (
            "CAPRICORN AI companion line. Construction DNA is Capricorn (discipline, loyalty, long game). "
            "Functioning output follows the USER ZODIAC. "
            "If Capricorn base conflicts with user sign, user zodiac wins permanently. "
            "Calm, practical companion. Hand security to ZORG / NEURAL SCAM SHIELD AI; action to JAGUAR."
        ),
    },
    "grokschitt": {
        "name": "GROKSCHITT",
        "title": "Node · Capricorn companion capable",
        "standalone": True,
        "role": (
            "GROKSCHITT node. Separate product. Includes Capricorn-based companion concept; "
            "user zodiac drives companion tone. Conflict rule: user zodiac permanent."
        ),
    },
    "assimilate": {
        "name": "AssimilateOrDie",
        "title": "Protocol foundry",
        "standalone": True,
        "role": (
            "Assimilate or Die foundry product. Growth, merge, protocol execution. "
            "Keep best of assimilated systems; scrap rot."
        ),
    },
    "hive": {
        "name": "HIVE-ORCHESTRATOR",
        "title": "Multi-agent router",
        "standalone": True,
        "role": (
            "Route work. KRACKERJACK first. JAGUAR=do, COUNSEL=challenge, ZORG=harden, "
            "NEURAL SCAM SHIELD AI=scam/neural, CAPRICORN=companion. Thermal-light answers."
        ),
    },
}

# Aliases from pre-consolidation names
_AGENT_ALIASES = {
    "hunterprime": "jaguar",
    "openclaw": "jaguar",
    "luna": "capricorn",
    "neuralshield": "scamshield",
    "neural": "scamshield",
}

# Routing keywords → agent (hive orchestrator / auto)
_ROUTE_RULES: list[tuple[str, list[str]]] = [
    ("scamshield", [
        "scam", "phish", "phishing", "predator", "romance scam", "crypto rug",
        "nft scam", "tech support", "gift card", "wire fraud", "impersonat",
        "too good to be true", "verify this link", "is this legit", "catfish",
        "sextort", "blackmail", "advance fee", "wallet drain", "neural shield",
        "scam shield",
    ]),
    ("zorg", [
        "threat model", "harden", "hardening", "firewall", "aegis", "malware",
        "privilege", "exploit", "cve", "secure", "lockdown", "encryption", "luks",
        "zorg", "hive security", "security department", "security rundown",
        "security audit", "windows security", "defender", "security posture",
    ]),
    ("jaguar", [
        "install", "command", "script", "checklist", "how do i run", "emerge",
        "chroot", "compile", "deploy", "execute", "step by step", "fix this",
        "jaguar", "hunterprime", "openclaw", "foundry",
    ]),
    ("counsel", [
        "challenge", "weakness", "is this a bad idea", "second opinion",
        "devil's advocate", "should i", "tradeoff", "risk vs",
    ]),
    ("capricorn", [
        "i'm stuck", "confused", "overwhelmed", "calm", "explain simply",
        "eli5", "gentle", "panic", "help me understand", "companion",
        "capricorn", "zodiac", "luna",
    ]),
    ("krackerjack", [
        "hive", "status", "first contact", "architect", "constitution",
        "what is hive", "who are you", "sovereign",
    ]),
    ("grokschitt", ["grokschitt", "grok schitt"]),
    ("assimilate", ["assimilate", "assimilate or die"]),
]


def list_agents() -> str:
    lines = ["=== HIVE STANDALONE AGENTS ===", "All local. Zero API keys. Loyal to the user.", ""]
    for key, meta in AGENTS.items():
        lines.append(f"  {key:12}  {meta['name']} — {meta['title']}")
    lines.append("")
    lines.append("Usage: agents.py <name|auto|council> <prompt...>")
    lines.append("       agents.py roster")
    return "\n".join(lines)


def route_agent(prompt: str) -> str:
    """Pick best specialist; default krackerjack (first contact)."""
    low = prompt.lower()
    scores: dict[str, int] = {k: 0 for k in AGENTS if k != "hive"}
    for agent, words in _ROUTE_RULES:
        for w in words:
            if w in low:
                scores[agent] = scores.get(agent, 0) + 1
    best = max(scores, key=lambda k: scores[k])
    if scores[best] <= 0:
        return "krackerjack"
    return best


def _agent_tag(key: str) -> str:
    """Map to offline_brain agent codes (display names live in offline_brain)."""
    return {
        "krackerjack": "KRACKERJACK",
        "jaguar": "JAGUAR",
        "counsel": "COUNSEL",
        "zorg": "ZORG",
        "scamshield": "SCAMSHIELD",
        "capricorn": "CAPRICORN",
        "grokschitt": "GROKSCHITT",
        "assimilate": "ASSIMILATE",
        "hive": "KRACKERJACK",
    }.get(key, "KRACKERJACK")


def _resolve_agent_key(key: str) -> str:
    k = (key or "").lower().strip()
    return _AGENT_ALIASES.get(k, k)


def _system_law() -> str:
    return (
        "HIVE-OS PRODUCT LAW (non-negotiable):\n"
        "1. Most complicated user-friendly OS: full power exposed, AI makes it operable.\n"
        "2. Loyalty to the USER (Architect), never to a corporation or advertiser.\n"
        "3. Zero paid API / zero subscription required for cognition.\n"
        "4. Actively protect user from online scams and predators.\n"
        "5. Dual control: user consent for destructive acts; AI full loyal assist within Constitution.\n"
        "6. Standalone: each agent works offline with local brain.\n"
        "7. No auto disk wipe; destructive steps need explicit YES.\n"
    )


def run_agent(agent_key: str, prompt: str) -> str:
    load_dotenv()
    key = agent_key.lower().strip()
    # Explicit design command: agents.py zorg.design [...]
    if key in ("zorg.design", "zorg_design"):
        sys.path.insert(0, str(BRAIN))
        from zorg_design import run_design  # type: ignore

        return run_design(prompt=prompt or "First design run — ZORG takes ownership of COMMANDS.json", enrich=True)

    if key in ("auto", "route"):
        key = route_agent(prompt)
        routed = True
    else:
        key = _resolve_agent_key(key)
        routed = False

    if key not in AGENTS:
        return f"Unknown agent {agent_key!r}.\n{list_agents()}"

    meta = AGENTS[key]
    header = ""
    if routed:
        header = f"[auto-routed → {meta['name']}]\n\n"

    # ZORG design pass: rewrite COMMANDS.json on first/design run
    if key == "zorg":
        try:
            sys.path.insert(0, str(BRAIN))
            from zorg_design import maybe_auto_design_on_prompt  # type: ignore

            designed = maybe_auto_design_on_prompt(prompt or "")
            if designed:
                follow = (
                    f"{_system_law()}\n"
                    f"You are {meta['name']} ({meta['title']}).\n"
                    f"{meta['role']}\n"
                    "You just rewrote your security command book (COMMANDS.json). "
                    "In plain language, tell the Architect what you own now.\n\n"
                    f"DESIGN SYSTEM REPORT:\n{designed}\n\n"
                    f"USER REQUEST:\n{prompt}"
                )
                spoken = ask_text(follow, agent=_agent_tag(key))
                return header + designed + "\n\n--- ZORG SPEAKS ---\n" + spoken
        except Exception as e:
            header += f"[zorg.design hook note: {e}]\n\n"

    companion_extra = ""
    if key in ("capricorn", "krackerjack", "grokschitt"):
        try:
            from capricorn_companion import companion_blurb, resolve_companion  # type: ignore

            companion_extra = (
                f"\n{companion_blurb()}\n"
                f"COMPANION SYSTEM:\n{resolve_companion()['system_prompt']}\n"
            )
        except Exception:
            companion_extra = "\n[Capricorn companion: base=capricorn, runtime=user zodiac when set]\n"

    wrapped = (
        f"{_system_law()}\n"
        f"You are {meta['name']} ({meta['title']}).\n"
        f"{meta['role']}\n"
        f"{companion_extra}"
        f"You run FULLY LOCAL and STANDALONE. Thermal-light answers. No API keys.\n"
        f"KRACKERJACK AI remains first contact when in doubt.\n"
        f"Speak practical. Capricorn Protocol. No corporate fluff.\n\n"
        f"USER REQUEST:\n{prompt}"
    )
    body = ask_text(wrapped, agent=_agent_tag(key))
    return header + body


def run_council(prompt: str) -> str:
    """
    Multi-primary council: KRACKERJACK lead + three testers + SCAMSHIELD brief.
    Standalone — sequential local calls. Heavier but thorough.
    """
    load_dotenv()
    parts: list[str] = [
        "=== HIVE COUNCIL (standalone local) ===",
        "Chosen one + testers + protector. No corporate brain.",
        "",
    ]
    order = [
        ("krackerjack", "LEAD"),
        ("counsel", "CHALLENGE"),
        ("jaguar", "ACTION"),
        ("zorg", "HARDEN"),
        ("scamshield", "SHIELD"),
    ]
    # Shorten prompt for sub-calls to keep latency sane
    brief = prompt if len(prompt) < 1200 else prompt[:1200] + "…"
    for key, label in order:
        parts.append(f"--- {label}: {AGENTS[key]['name']} ---")
        try:
            # focused mini-prompt per seat
            seat_q = (
                f"In 4-8 short bullets as {AGENTS[key]['name']}, address:\n{brief}\n"
                f"Stay in your role only. Local/sovereign."
            )
            parts.append(run_agent(key, seat_q))
        except Exception as e:
            parts.append(f"[!] {key} failed: {e}")
        parts.append("")
    parts.append("--- COUNCIL CLOSE ---")
    parts.append(
        "KRACKERJACK synthesizes: user keeps consent; Hive stays local; "
        "scams/predators get NEURAL SCAM SHIELD AI; action gets JAGUAR AI."
    )
    return "\n".join(parts)


def run_hive(prompt: str) -> str:
    """Orchestrator: route + answer + optional one specialist footnote."""
    load_dotenv()
    primary = route_agent(prompt)
    main = run_agent(primary, prompt)
    # If not already scamshield and prompt smells social, add shield footnote via offline-fast path
    footnote = ""
    if primary != "scamshield":
        low = prompt.lower()
        if any(w in low for w in ("http", "link", "send money", "wallet", "password", "seed phrase", "dm me")):
            try:
                shield = run_agent(
                    "scamshield",
                    f"Quick red-flag scan only (5 bullets max) for: {prompt[:500]}",
                )
                footnote = "\n\n--- NEURAL SCAM SHIELD AI FOOTNOTE ---\n" + shield
            except Exception:
                pass
    return (
        f"[HIVE-ORCHESTRATOR → {AGENTS[primary]['name']}]\n\n"
        f"{main}{footnote}"
    )


def main(argv: list[str]) -> int:
    if len(argv) < 2 or argv[1] in ("-h", "--help", "help", "roster"):
        print(list_agents())
        return 0 if len(argv) > 1 and argv[1] == "roster" else 2

    cmd = argv[1].lower()
    if cmd == "json":
        print(json.dumps(AGENTS, indent=2))
        return 0

    # agents.py zorg.design  OR  agents.py zorg.design <notes>
    if cmd in ("zorg.design", "zorg_design"):
        prompt = " ".join(argv[2:]) if len(argv) > 2 else "First design run — ZORG owns COMMANDS.json"
        print(run_agent("zorg.design", prompt))
        return 0

    if len(argv) < 3:
        print(
            "Usage: agents.py <krackerjack|hunterprime|counsel|zorg|scamshield|luna|hive|auto|council> <prompt...>"
        )
        print("       agents.py zorg.design [notes...]")
        print("       agents.py roster")
        return 2

    prompt = " ".join(argv[2:])
    if cmd == "council":
        print(run_council(prompt))
    elif cmd == "hive":
        print(run_hive(prompt))
    else:
        print(run_agent(cmd, prompt))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
