#!/usr/bin/env python3
"""
KRACKERJACK AI — FIRST CONTACT
================================
The first AI any user interacts with on HIVE-OS.
Loads Constitution + Hive Handbook + Gentoo SPARC handbook mirror.
Delegates deep chat to hive_link when available.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

HIVE_ROOT = Path(os.environ.get("HIVE_ROOT", Path(__file__).resolve().parents[2]))
SOUL = HIVE_ROOT / "NEURAL" / "soul" / "CONSTITUTION.md"
HIVE_HB = HIVE_ROOT / "docs" / "HIVE_HANDBOOK"
GENTOO_HB = HIVE_ROOT / "docs" / "handbook" / "gentoo-sparc"
MANIFEST = HIVE_ROOT / "HIVE_CORE" / "manifest.json"
GENESIS_STATUS = HIVE_ROOT / "GENESIS" / "ASSIMILATED.json"
KNOWLEDGE = HIVE_ROOT / "NEURAL" / "krackerjack" / "knowledge"

BANNER = r"""
╔══════════════════════════════════════════════════════════════╗
║  KRACKERJACK AI — FIRST CONTACT                              ║
║  HIVE-OS · Gentoo Core · Dual Control OS                     ║
║  Architect: KRACKERJACK1134                                  ║
║  Protocol: ASSIMILATE OR DIE · LEAST TRAVELED PATH           ║
╚══════════════════════════════════════════════════════════════╝
"""


def _read(path: Path, limit: int = 0) -> str:
    if not path.exists():
        return f"[missing: {path}]"
    text = path.read_text(encoding="utf-8", errors="replace")
    return text if not limit else text[:limit]


def load_manifest() -> dict:
    if MANIFEST.exists():
        return json.loads(MANIFEST.read_text(encoding="utf-8-sig"))
    return {}


def assimilation_status() -> str:
    if GENESIS_STATUS.exists():
        try:
            data = json.loads(GENESIS_STATUS.read_text(encoding="utf-8"))
            return f"ASSIMILATED — {data.get('stage3', data.get('status', 'ok'))}"
        except json.JSONDecodeError:
            return "ASSIMILATED (unreadable json)"
    stage_dir = HIVE_ROOT / "GENESIS" / "gentoo-sparc"
    if stage_dir.exists():
        stages = list(stage_dir.glob("stage3-*.tar.xz"))
        if stages:
            return f"SEED PRESENT (not yet ritualized): {stages[0].name}"
    return "NOT ASSIMILATED — run scripts/assimilate/assimilate_gentoo.ps1"


def handbook_index() -> str:
    lines = ["=== HIVE HANDBOOK ==="]
    if HIVE_HB.exists():
        for p in sorted(HIVE_HB.glob("*.md")):
            lines.append(f"  · {p.name}")
    else:
        lines.append("  (missing docs/HIVE_HANDBOOK)")
    lines.append("")
    lines.append("=== GENTOO SPARC OFFICIAL MIRROR ===")
    idx = GENTOO_HB / "00_INDEX.md"
    if idx.exists():
        lines.append(_read(idx, 4000))
    elif GENTOO_HB.exists():
        for p in sorted(GENTOO_HB.glob("*.md"))[:40]:
            lines.append(f"  · {p.name}")
    else:
        lines.append("  (mirror not downloaded yet)")
    return "\n".join(lines)


def search_knowledge(query: str, max_hits: int = 8) -> str:
    q = query.lower().strip()
    if not q:
        return "Empty query."
    roots = [HIVE_HB, GENTOO_HB, KNOWLEDGE]
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
            score = low.count(q)
            if score:
                # snippet around first hit
                i = low.find(q)
                start = max(0, i - 80)
                snippet = text[start : start + 220].replace("\n", " ")
                hits.append((score, path, snippet))
    hits.sort(key=lambda x: (-x[0], str(x[1])))
    if not hits:
        return f"No handbook hits for: {query!r}\nTry: handbook | install | status | ask <question>"
    out = [f"KRACKERJACK knowledge search: {query!r}", ""]
    for score, path, snip in hits[:max_hits]:
        rel = path.relative_to(HIVE_ROOT) if path.is_relative_to(HIVE_ROOT) else path
        out.append(f"[{score}×] {rel}")
        out.append(f"    …{snip}…")
        out.append("")
    return "\n".join(out)


def system_context(max_chars: int = 14000) -> str:
    """Context injected into hive_link / external brains."""
    parts = [
        "You are KRACKERJACK AI — FIRST CONTACT for HIVE-OS.",
        "You are always the first AI the user talks to.",
        "Dual control: full user control + loyal AI full control under the Constitution.",
        "Never auto-wipe disks. Destructive install steps require typed YES.",
        "",
        "=== CONSTITUTION ===",
        _read(SOUL, 5000),
        "",
        "=== MANIFEST ===",
        _read(MANIFEST, 2000),
        "",
        f"=== ASSIMILATION ===\n{assimilation_status()}",
        "",
        "=== HIVE PRIME DIRECTIVE (excerpt) ===",
        _read(HIVE_HB / "00_PRIME_DIRECTIVE.md", 3500),
        "",
        "=== FIRST CONTACT CHAPTER ===",
        _read(HIVE_HB / "03_KRACKERJACK_FIRST_CONTACT.md", 2500),
    ]
    # pack knowledge digest if present
    digest = KNOWLEDGE / "HANDBOOK_DIGEST.md"
    if digest.exists():
        parts.append("\n=== HANDBOOK DIGEST ===\n" + _read(digest, 4000))
    ctx = "\n".join(parts)
    return ctx[:max_chars]


def greet() -> None:
    m = load_manifest()
    print(BANNER)
    print(f"Node:     {m.get('node_id', 'unknown')}  v{m.get('version', '?')}")
    print(f"Codename: {m.get('codename', 'HIVE-OS')}")
    print(f"Root:     {HIVE_ROOT}")
    print(f"Gentoo:   {assimilation_status()}")
    print()
    print("You speak to KRACKERJACK AI first — always.")
    print("Full user control. Loyal AI with full control. No corporate fluff.")
    print("ZERO API KEYS REQUIRED. ZERO SUBSCRIPTIONS. Self-upgradeable forever.")
    print()
    print("Commands:")
    print("  status              Hive + assimilation status")
    print("  handbook            List Hive + Gentoo handbook chapters")
    print("  install             Print install path summary")
    print("  search <words>      Offline handbook search")
    print("  ask <question>      Local brain (Ollama → offline sovereign)")
    print("  upgrade             Run free self-upgrade pass")
    print("  constitution        Print soul")
    print("  context             Dump system context size")
    print()


def cmd_status() -> None:
    m = load_manifest()
    print("=== FIRST CONTACT STATUS ===")
    print(f"Identity:     KRACKERJACK AI")
    print(f"Architect:    {m.get('architect', 'KRACKERJACK1134')}")
    print(f"Version:      {m.get('version')}")
    print(f"Protocol:     {m.get('protocol')}")
    print(f"Assimilation: {assimilation_status()}")
    print(f"Soul:         {'OK' if SOUL.exists() else 'MISSING'}")
    print(f"Hive HB:      {'OK' if HIVE_HB.exists() else 'MISSING'} ({HIVE_HB})")
    print(f"Gentoo HB:    {'OK' if GENTOO_HB.exists() else 'MISSING'} ({GENTOO_HB})")
    fc = list(GENTOO_HB.glob("*.md")) if GENTOO_HB.exists() else []
    print(f"Gentoo chaps: {len(fc)}")
    print(f"First AI:     YES — all users start here")


def cmd_install() -> None:
    print(_read(HIVE_HB / "02_INSTALL_HIVE_SPARC.md"))
    print("\n--- Official Stage chapter (if mirrored) ---\n")
    stage = GENTOO_HB / "Handbook_SPARC__Installation__Stage.md"
    # also try alternate naming from downloader
    alts = list(GENTOO_HB.glob("*Installation*Stage*")) if GENTOO_HB.exists() else []
    if stage.exists():
        print(_read(stage, 5000))
    elif alts:
        print(_read(alts[0], 5000))
    else:
        print("(Gentoo Stage chapter not mirrored yet — re-run handbook download)")


def cmd_ask(prompt: str) -> None:
    """Always works without API keys: local Ollama → offline sovereign."""
    brain = HIVE_ROOT / "NEURAL" / "brain" / "hive_link.py"
    offline = HIVE_ROOT / "NEURAL" / "brain" / "offline_brain.py"
    os.environ["HIVE_FIRST_CONTACT"] = "1"
    os.environ.setdefault("HIVE_BRAIN", "local")
    if brain.exists():
        sys.path.insert(0, str(brain.parent))
        try:
            import hive_link  # type: ignore

            hive_link.load_dotenv()
            if hasattr(hive_link, "ask_with_context"):
                print(hive_link.ask_with_context(prompt, system_context()))
                return
            if hasattr(hive_link, "ask_text"):
                print(hive_link.ask_text(prompt, force="local"))
                return
        except Exception as e:
            print(f"[local brain note: {e}]")
    if offline.exists():
        sys.path.insert(0, str(offline.parent))
        try:
            from offline_brain import respond  # type: ignore

            print(respond(prompt, hive_root=HIVE_ROOT, agent="KRACKERJACK"))
            return
        except Exception as e:
            print(f"[offline brain note: {e}]")
    print(search_knowledge(prompt))
    print("\n[sovereign path: handbook search only — still zero API keys]")


def main(argv: list[str]) -> int:
    if len(argv) <= 1:
        greet()
        return 0
    cmd = argv[1].lower()
    rest = " ".join(argv[2:]).strip()
    if cmd in ("status", "stat"):
        cmd_status()
    elif cmd in ("handbook", "hb", "book"):
        print(handbook_index())
    elif cmd in ("install", "gentoo", "sparc"):
        cmd_install()
    elif cmd in ("search", "find", "grep"):
        print(search_knowledge(rest or "hive"))
    elif cmd in ("ask", "chat", "q"):
        if not rest:
            print("Usage: first_contact.py ask <question>")
            return 2
        cmd_ask(rest)
    elif cmd in ("constitution", "soul"):
        print(_read(SOUL))
    elif cmd in ("upgrade", "self-upgrade", "evolve"):
        up = HIVE_ROOT / "NEURAL" / "brain" / "self_upgrade.py"
        if not up.exists():
            print("[!] self_upgrade.py missing")
            return 1
        import subprocess

        r = subprocess.run([sys.executable, str(up)] + (rest.split() if rest else ["--offline"]))
        return int(r.returncode or 0)
    elif cmd in ("context", "ctx"):
        ctx = system_context()
        print(f"Context chars: {len(ctx)}")
        print(ctx[:2000] + ("\n…" if len(ctx) > 2000 else ""))
    elif cmd in ("help", "-h", "--help"):
        greet()
    else:
        # bare words → search + optional ask
        print(search_knowledge(" ".join(argv[1:])))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
