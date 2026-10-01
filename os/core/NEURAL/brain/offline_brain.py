#!/usr/bin/env python3
"""
HIVE OFFLINE SOVEREIGN BRAIN
============================
Works with ZERO API keys, ZERO cloud, ZERO subscriptions.
Uses Constitution + handbooks + local rules. Always available.
"""

from __future__ import annotations

import re
from pathlib import Path

HIVE_ROOT = Path(__file__).resolve().parents[2]


def _read(path: Path, limit: int = 0) -> str:
    if not path.exists():
        return ""
    text = path.read_text(encoding="utf-8", errors="replace")
    return text if not limit else text[:limit]


def _search(roots: list[Path], query: str, max_hits: int = 6) -> list[tuple[int, Path, str]]:
    tokens = [t for t in re.split(r"\W+", query.lower()) if len(t) > 2]
    if not tokens:
        tokens = [query.lower().strip()] if query.strip() else ["hive"]
    hits: list[tuple[int, Path, str]] = []
    for root in roots:
        if not root.exists():
            continue
        for path in root.rglob("*.md"):
            try:
                text = path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            low = text.lower()
            score = sum(low.count(t) for t in tokens)
            if score <= 0:
                continue
            # first token location for snippet
            i = min((low.find(t) for t in tokens if t in low), default=0)
            snip = text[max(0, i - 60) : i + 200].replace("\n", " ")
            hits.append((score, path, snip))
    hits.sort(key=lambda x: (-x[0], str(x[1])))
    return hits[:max_hits]


def respond(prompt: str, hive_root: Path | None = None, agent: str = "KRACKERJACK") -> str:
    """Deterministic local answer — never needs network or keys."""
    root = hive_root or HIVE_ROOT
    soul = _read(root / "NEURAL" / "soul" / "CONSTITUTION.md", 2500)
    prime = _read(root / "docs" / "HIVE_HANDBOOK" / "00_PRIME_DIRECTIVE.md", 2000)
    dual = _read(root / "docs" / "HIVE_HANDBOOK" / "04_DUAL_CONTROL.md", 1500)
    assimil = _read(root / "GENESIS" / "ASSIMILATED.json", 800)
    status = _read(root / "GENESIS" / "STATUS", 200)

    roots = [
        root / "docs" / "HIVE_HANDBOOK",
        root / "docs" / "handbook" / "gentoo-sparc",
        root / "NEURAL" / "krackerjack" / "knowledge",
        root / "docs",
        root / "NEURAL" / "soul",
    ]
    hits = _search(roots, prompt)

    _labels = {
        "KRACKERJACK": "KRACKERJACK AI — first contact, sovereign, local.",
        "HUNTERPRIME": "JAGUAR AI — action + foundry (local). Concrete next steps.",
        "JAGUAR": "JAGUAR AI — action + foundry (local). Concrete next steps.",
        "COUNSEL": "COUNSEL — truth filter (local). No flattery. Challenge weak plans.",
        "ZORG": "ZORG — Chief of HIVE SECURITY (local). Threat model + harden + rundown.",
        "SCAMSHIELD": "NEURAL SCAM SHIELD AI — scam + neural defense under ZORG (local).",
        "LUNA": "CAPRICORN AI — companion (Capricorn base, user zodiac runtime, local).",
        "CAPRICORN": "CAPRICORN AI — companion (Capricorn base, user zodiac runtime, local).",
        "GROKSCHITT": "GROKSCHITT — node + Capricorn companion line (local).",
        "ASSIMILATE": "AssimilateOrDie — protocol foundry (local).",
    }
    agent_line = _labels.get(agent.upper(), "KRACKERJACK AI — local sovereign.")

    lines = [
        f"[{agent_line}]",
        "[MODE: OFFLINE SOVEREIGN — no API keys, no cloud, no subscription]",
        "",
        "Capricorn Protocol. Dual control: you own consent; I own loyal execution within the Constitution.",
        "",
    ]

    p = prompt.lower()
    if any(w in p for w in ("status", "who are you", "identity", "first contact")):
        lines += [
            "Identity: KRACKERJACK AI is always first contact on HIVE-OS.",
            f"Genesis: {status.strip() or 'not yet ASSIMILATED'}",
            "Brain chain: local Ollama (if present) → this offline sovereign brain. Cloud keys are OPTIONAL LEGACY only.",
            "",
        ]
    if any(w in p for w in ("api", "key", "subscription", "payment", "paid", "credit", "xai", "openai")):
        lines += [
            "POLICY: Hive AIs work 100% without API keys.",
            "No subscription is required for cognition, handbook, install guidance, or self-upgrade.",
            "Optional cloud endpoints may exist for Architect experiments — they must never block the Hive.",
            "",
        ]
    if any(w in p for w in ("upgrade", "update", "obsolete", "self-upgrade", "evolve")):
        lines += [
            "Self-upgrade: run `python NEURAL/brain/self_upgrade.py` (or scripts/hive_self_upgrade.ps1).",
            "It refreshes free Gentoo handbook mirrors, checks free stage3 seeds, pulls free local models,",
            "and updates Hive DNA from local git — so the Hive does not rot behind a paywall.",
            "",
        ]
    if any(w in p for w in ("install", "gentoo", "sparc", "stage3", "chroot")):
        lines += [
            "Install path: docs/HIVE_HANDBOOK/02_INSTALL_HIVE_SPARC.md + official SPARC handbook mirror.",
            "Never auto-wipe disks. hive_install.sh requires typed YES.",
            "",
        ]
    if any(w in p for w in (
        "scam", "phish", "predator", "fraud", "crypto", "wallet", "seed phrase",
        "gift card", "romance", "catfish", "wire", "urgent", "verify this",
    )):
        lines += [
            "NEURAL SCAM SHIELD AI: Stop. Do not send money, seeds, codes, or remote-desktop access.",
            "Verify the channel out-of-band. Real orgs never demand gift cards or seed phrases.",
            "Preserve screenshots/URLs. Ask KRACKERJACK / NEURAL SCAM SHIELD / ZORG before trusting DMs.",
            "No shame — predators rely on embarrassment. Report path when safe.",
            "",
        ]
    if any(w in p for w in ("user friendly", "complicated", "like a pro", "standalone", "loyal")):
        lines += [
            "Product: most complicated user-friendly OS — full power + local Hive assist.",
            "Loyalty to the user, not a corporation. Agents are standalone (Ollama → offline).",
            "See docs/HIVE_HANDBOOK/08_STANDALONE_LOYAL_OS.md",
            "",
        ]

    if hits:
        lines.append("Handbook hits (local):")
        for score, path, snip in hits:
            try:
                rel = path.relative_to(root)
            except ValueError:
                rel = path
            lines.append(f"  · [{score}] {rel}")
            lines.append(f"    …{snip.strip()}…")
        lines.append("")
    else:
        lines.append("No strong handbook hit — answer from Constitution + Prime Directive only.")
        lines.append("")

    if prime:
        lines.append("--- Prime Directive (excerpt) ---")
        lines.append(prime[:900])
        lines.append("")
    if dual:
        lines.append("--- Dual Control (excerpt) ---")
        lines.append(dual[:700])
        lines.append("")
    if soul:
        lines.append("--- Constitution (excerpt) ---")
        lines.append(soul[:700])
        lines.append("")
    if assimil:
        lines.append("--- Assimilation record ---")
        lines.append(assimil[:500])

    lines += [
        "",
        "Next: `python NEURAL/krackerjack/first_contact.py handbook`",
        "      `python NEURAL/brain/hive_link.py ask \"...\"`  (local)",
        "      `python NEURAL/brain/self_upgrade.py`",
    ]
    return "\n".join(lines)


if __name__ == "__main__":
    import sys

    q = " ".join(sys.argv[1:]) or "Hive status. Who are you?"
    print(respond(q))
