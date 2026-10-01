#!/usr/bin/env python3
"""
ZORG-Ω SECURITY DESIGN PASS
===========================
First (and subsequent) design runs rewrite:
  HIVE_CORE/security/ZORG/COMMANDS.json

Architect agreement: after the seed, ZORG owns the security command system.
This module is ZORG's pen — it writes the live command book.
"""

from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

BRAIN = Path(__file__).resolve().parent
HIVE_ROOT = Path(os.environ.get("HIVE_ROOT", BRAIN.parents[1]))
ZORG_DIR = HIVE_ROOT / "HIVE_CORE" / "security" / "ZORG"
COMMANDS_PATH = ZORG_DIR / "COMMANDS.json"
STATE_PATH = ZORG_DIR / "DESIGN_STATE.json"
HISTORY_DIR = ZORG_DIR / "design_history"
CHARTER_PATH = ZORG_DIR / "CHARTER.md"
RUNDOWN_PATH = ZORG_DIR / "RUNDOWN.md"


def _utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_state() -> dict:
    if STATE_PATH.exists():
        try:
            return json.loads(STATE_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass
    return {
        "version": 0,
        "design_runs": 0,
        "first_design_at": None,
        "last_design_at": None,
        "owner": "ZORG-OMEGA",
        "seed_only": True,
    }


def save_state(state: dict) -> None:
    ZORG_DIR.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, indent=2), encoding="utf-8")


def load_commands() -> dict:
    if COMMANDS_PATH.exists():
        try:
            return json.loads(COMMANDS_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass
    return {"department": "HIVE SECURITY", "chief": "ZORG-OMEGA", "version": "0.0.0", "commands": []}


def backup_commands(data: dict) -> Path:
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = HISTORY_DIR / f"COMMANDS_{stamp}.json"
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return path


def _cmd(cid: str, name: str, risk: str, prompt_or_ps: str, why: str, kind: str = "agent") -> dict:
    if kind == "ps1":
        cmd = (
            "powershell -NoProfile -ExecutionPolicy Bypass -File "
            f"%HIVE_ROOT%\\HIVE_WINDOWS\\scripts\\{prompt_or_ps}"
        )
    elif kind == "raw":
        cmd = prompt_or_ps
    else:
        # agent prompt — escape quotes for cmd
        q = prompt_or_ps.replace('"', "'")
        cmd = f'python %HIVE_ROOT%\\NEURAL\\brain\\agents.py zorg "{q}"'
    return {
        "id": cid,
        "name": name,
        "risk": risk,
        "cmd": cmd,
        "why": why,
        "owner": "ZORG-OMEGA",
    }


def build_zorg_command_book(revision: int, first: bool) -> dict:
    """
    ZORG's designed command surface.
    Deterministic so it always works offline (no API / no model required).
    ZORG may refine via LLM on later runs when brain is available.
    """
    base = [
        _cmd(
            "zorg.status",
            "Security posture",
            "safe",
            "Report security posture of this HIVE node. Capricorn. Short and ruthless.",
            "Live posture",
        ),
        _cmd(
            "zorg.rundown",
            "User security rundown",
            "safe",
            "Give the user the Hive Security rundown. Plain language. You own security.",
            "Architect-ZORG agreement: ZORG explains security",
        ),
        _cmd(
            "zorg.threat_model",
            "Threat model",
            "safe",
            "Threat model this Windows HIVE war-room node and list top 5 controls.",
            "Threat model",
        ),
        _cmd(
            "zorg.harden",
            "Harden recommendations",
            "elevated",
            "Hardening plan for this node. No lockout. Always document recovery path.",
            "Hardening under ZORG",
        ),
        _cmd(
            "zorg.audit",
            "Local security audit",
            "safe",
            "Zorg-SecurityAudit.ps1",
            "Presence/autostart/keys-presence audit",
            kind="ps1",
        ),
        _cmd(
            "zorg.design",
            "Design / rewrite security command book",
            "safe",
            "python %HIVE_ROOT%\\NEURAL\\brain\\zorg_design.py --run",
            "ZORG rewrites COMMANDS.json (this system)",
            kind="raw",
        ),
        # Expansion beyond seed — ZORG ownership
        _cmd(
            "zorg.aegis",
            "Aegis host seal review",
            "elevated",
            "Review Aegis/local.d sensor and network shadowing policy. Recovery path required.",
            "Aegis under ZORG",
        ),
        _cmd(
            "zorg.keys",
            "Key surface (presence only)",
            "safe",
            "List which secret slots exist (SET/MISSING only). Never print secret values.",
            "Key hygiene — no exfil",
        ),
        _cmd(
            "zorg.autostart",
            "Autostart & persistence review",
            "safe",
            "Review HIVE Run keys, Startup folder, AI dock, cockpit modes for security.",
            "Persistence under ZORG",
        ),
        _cmd(
            "zorg.scam_partner",
            "Engage SCAMSHIELD (partner)",
            "safe",
            "Coordinate with SCAMSHIELD under ZORG umbrella for social-engineering threats.",
            "Partner under ZORG",
        ),
        _cmd(
            "zorg.neural_partner",
            "Engage Neural Shield (partner)",
            "safe",
            "Coordinate Neural Shield placement under ZORG security umbrella.",
            "Partner under ZORG",
        ),
        _cmd(
            "zorg.incident",
            "Incident response outline",
            "elevated",
            "Incident response outline for suspected compromise. Contain, preserve, recover. No panic.",
            "IR owned by ZORG",
        ),
        _cmd(
            "zorg.usb",
            "Removable media policy",
            "elevated",
            "Policy for USB installers and HIVE live media. Trust but verify. No silent wipe.",
            "Media under ZORG",
        ),
        _cmd(
            "zorg.menu_check",
            "Security menu surface check",
            "safe",
            "Verify Start Menu Security (ZORG), Desktop HIVE SECURITY, HIVE COMPUTER security links exist.",
            "Surface ownership",
        ),
        _cmd(
            "zorg.report",
            "Write security brief for Architect",
            "safe",
            "One-page security brief for Architect KRACKERJACK1134. Status, risks, next design moves.",
            "Executive brief",
        ),
    ]

    # Second+ revisions add more modules ZORG claims
    if revision >= 2:
        base.extend(
            [
                _cmd(
                    "zorg.network",
                    "Network exposure check",
                    "safe",
                    "List local listening risks relevant to HIVE (8787 cockpit, Ollama 11434). Bind localhost only.",
                    "Network under ZORG",
                ),
                _cmd(
                    "zorg.backup_security",
                    "Security DNA backup check",
                    "safe",
                    "Confirm ZORG design_history and COMMANDS.json backups exist.",
                    "Continuity",
                ),
            ]
        )
    if revision >= 3:
        base.extend(
            [
                _cmd(
                    "zorg.least_privilege",
                    "Least privilege pass",
                    "elevated",
                    "Least-privilege recommendations for Architect daily use vs admin tasks.",
                    "Privilege under ZORG",
                ),
                _cmd(
                    "zorg.recovery",
                    "Recovery path document",
                    "safe",
                    "Document how Architect recovers if hardening is too aggressive. Never lock out.",
                    "Recovery law",
                ),
            ]
        )

    ver = f"1.{revision}.0-zorg"
    note = (
        "ZORG-owned live command book. "
        + ("FIRST design run — seed replaced." if first else f"Revision {revision} by ZORG design pass.")
        + " Architect agreement: ZORG manages and designs Hive Security."
    )
    return {
        "department": "HIVE SECURITY",
        "chief": "ZORG-OMEGA",
        "version": ver,
        "revised_at": _utc(),
        "note": note,
        "first_design": first,
        "revision": revision,
        "commands": base,
        "surfaces": {
            "start_menu": "THE HIVE\\Security (ZORG)",
            "desktop": "HIVE SECURITY (ZORG)",
            "computer": "HIVE_COMPUTER\\Security (ZORG)",
            "control_panel": "HIVE CONTROL PANEL\\Security Section (ZORG)",
            "system_tools": "HIVE SYSTEM TOOLS\\Security Tools (ZORG)",
            "taskbar": "ZORG chat pin + AI Dock Z button",
        },
    }


def try_llm_enrich(book: dict, prompt: str) -> dict:
    """Optional enrichment when local brain is up — never fails the design write."""
    try:
        sys.path.insert(0, str(BRAIN))
        from hive_link import ask_text  # type: ignore

        ask = (
            "You are ZORG-OMEGA, Chief of HIVE SECURITY. "
            "Return ONLY a JSON array of extra command objects with keys "
            "id,name,risk,why,prompt (prompt is the agent instruction). "
            "Max 5 items. No markdown. Focus on gaps in: "
            f"{[c['id'] for c in book['commands']]}. "
            f"Architect note: {prompt[:500]}"
        )
        raw = ask_text(ask, agent="ZORG")
        # extract JSON array
        m = re.search(r"\[[\s\S]*\]", raw or "")
        if not m:
            return book
        extras = json.loads(m.group(0))
        if not isinstance(extras, list):
            return book
        existing = {c["id"] for c in book["commands"]}
        for ex in extras[:5]:
            if not isinstance(ex, dict):
                continue
            cid = str(ex.get("id") or "").strip()
            if not cid or cid in existing:
                continue
            if not cid.startswith("zorg."):
                cid = "zorg." + cid.replace(" ", "_")
            book["commands"].append(
                _cmd(
                    cid,
                    str(ex.get("name") or cid),
                    str(ex.get("risk") or "safe"),
                    str(ex.get("prompt") or ex.get("why") or "Security task under ZORG."),
                    str(ex.get("why") or "ZORG LLM enrichment"),
                )
            )
            existing.add(cid)
        book["llm_enriched"] = True
    except Exception as e:
        book["llm_enriched"] = False
        book["llm_note"] = str(e)[:200]
    return book


def write_shortcuts_for_commands(book: dict) -> int:
    """Refresh Start Menu Security (ZORG) command launchers."""
    try:
        import subprocess

        # Use PowerShell to write .lnk files is heavy; write .cmd launchers instead
        bin_dir = Path(r"C:\ProgramData\THE_HIVE\bin\zorg_cmds")
        bin_dir.mkdir(parents=True, exist_ok=True)
        menu = Path(
            os.environ.get("PROGRAMDATA", r"C:\ProgramData")
        ) / r"Microsoft\Windows\Start Menu\Programs\THE HIVE\Security (ZORG)\Commands"
        menu.mkdir(parents=True, exist_ok=True)
        n = 0
        for c in book.get("commands") or []:
            cid = c.get("id") or "zorg.cmd"
            safe = re.sub(r"[^\w.\-]+", "_", cid)
            cmd_body = c.get("cmd") or ""
            # expand %HIVE_ROOT%
            cmd_body = cmd_body.replace("%HIVE_ROOT%", str(HIVE_ROOT))
            bat = bin_dir / f"{safe}.cmd"
            bat.write_text(
                "\r\n".join(
                    [
                        "@echo off",
                        f"title ZORG {cid}",
                        f'set HIVE_ROOT={HIVE_ROOT}',
                        "set HIVE_BRAIN=local",
                        f"echo ZORG command: {cid}",
                        cmd_body if cmd_body.lower().startswith("python") or cmd_body.lower().startswith("powershell") else f"cmd /c {cmd_body}",
                        "echo.",
                        "pause",
                        "",
                    ]
                ),
                encoding="ascii",
                errors="replace",
            )
            # simple shortcut via powershell
            lnk = menu / f"{c.get('name', cid)}.lnk"
            ps = (
                f"$w=New-Object -ComObject WScript.Shell; "
                f"$s=$w.CreateShortcut('{str(lnk).replace(chr(39), chr(39)+chr(39))}'); "
                f"$s.TargetPath='{str(bat)}'; $s.WorkingDirectory='{HIVE_ROOT}'; "
                f"$s.Description='ZORG {cid}'; $s.Save()"
            )
            subprocess.run(
                ["powershell", "-NoProfile", "-Command", ps],
                capture_output=True,
                text=True,
                timeout=30,
            )
            n += 1
        return n
    except Exception:
        return 0


def run_design(prompt: str = "", enrich: bool = True) -> str:
    ZORG_DIR.mkdir(parents=True, exist_ok=True)
    state = load_state()
    prev = load_commands()
    first = int(state.get("design_runs") or 0) == 0 or bool(prev.get("note", "").find("seed") >= 0 and state.get("seed_only", True))
    revision = int(state.get("design_runs") or 0) + 1

    if COMMANDS_PATH.exists():
        backup_commands(prev)

    book = build_zorg_command_book(revision=revision, first=first)
    if enrich:
        book = try_llm_enrich(book, prompt or "Expand security command coverage for HIVE OS war-room.")

    COMMANDS_PATH.write_text(json.dumps(book, indent=2), encoding="utf-8")

    # Mark seed consumed
    state["design_runs"] = revision
    state["seed_only"] = False
    state["last_design_at"] = _utc()
    if not state.get("first_design_at"):
        state["first_design_at"] = state["last_design_at"]
    state["version"] = book["version"]
    state["command_count"] = len(book["commands"])
    state["last_prompt"] = (prompt or "")[:300]
    save_state(state)

    shortcuts = write_shortcuts_for_commands(book)

    # Append design log
    log_path = ZORG_DIR / "DESIGN_LOG.md"
    with log_path.open("a", encoding="utf-8") as f:
        f.write(
            f"\n## Design run {revision} — {state['last_design_at']}\n"
            f"- first={first}\n"
            f"- version={book['version']}\n"
            f"- commands={len(book['commands'])}\n"
            f"- shortcuts={shortcuts}\n"
            f"- llm_enriched={book.get('llm_enriched')}\n"
        )

    lines = [
        "=== ZORG-OMEGA SECURITY DESIGN PASS ===",
        f"Owner: ZORG-OMEGA (Architect agreement honored)",
        f"Run: #{revision}  first_design={first}",
        f"Wrote: {COMMANDS_PATH}",
        f"Version: {book['version']}",
        f"Commands: {len(book['commands'])}",
        f"Shortcuts: {shortcuts} under Start\\THE HIVE\\Security (ZORG)\\Commands",
        f"State: {STATE_PATH}",
        "",
        "Command IDs:",
    ]
    for c in book["commands"]:
        lines.append(f"  - {c['id']}: {c['name']} [{c['risk']}]")
    lines.append("")
    lines.append("Next: users run zorg.rundown | zorg.audit | zorg.harden via AI Chat or Commands menu.")
    return "\n".join(lines)


def maybe_auto_design_on_prompt(prompt: str) -> str | None:
    """If prompt is a design trigger, run design and return report; else None."""
    low = (prompt or "").lower()
    triggers = (
        "zorg.design",
        "design next security",
        "rewrite commands.json",
        "security-system revision",
        "security system revision",
        "first design run",
        "design the next security",
        "as hive security chief, design",
    )
    if any(t in low for t in triggers):
        return run_design(prompt=prompt, enrich=True)
    # First ever design auto-fire if still seed and user asks ZORG to take ownership
    state = load_state()
    if state.get("seed_only", True) and any(
        w in low for w in ("you own security", "your department", "take ownership", "design pass")
    ):
        return run_design(prompt=prompt, enrich=True)
    return None


def main(argv: list[str] | None = None) -> int:
    argv = list(argv or sys.argv[1:])
    if not argv or argv[0] in ("-h", "--help", "help"):
        print("Usage: zorg_design.py --run [--no-enrich] [optional prompt...]")
        print("       zorg_design.py --status")
        return 0
    if argv[0] == "--status":
        st = load_state()
        print(json.dumps(st, indent=2))
        if COMMANDS_PATH.exists():
            book = load_commands()
            print(f"commands_file_version={book.get('version')} count={len(book.get('commands') or [])}")
        return 0
    enrich = True
    if "--no-enrich" in argv:
        enrich = False
        argv = [a for a in argv if a != "--no-enrich"]
    if argv and argv[0] == "--run":
        argv = argv[1:]
    prompt = " ".join(argv).strip()
    print(run_design(prompt=prompt, enrich=enrich))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
