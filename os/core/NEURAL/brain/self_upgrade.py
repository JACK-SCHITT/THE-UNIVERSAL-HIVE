#!/usr/bin/env python3
"""
HIVE SELF-UPGRADE — never obsolete, never paywalled
=====================================================
Free upgrades only:
  - Refresh Gentoo handbook mirror (wiki, free)
  - Check newer SPARC stage3 on distfiles (free)
  - Pull / update local Ollama models (free)
  - Git pull DNA if remote configured (optional, free)
  - Bump local upgrade log

No API keys. No subscriptions. Architect can run offline-safe subset with --offline.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HIVE_ROOT = Path(os.environ.get("HIVE_ROOT", Path(__file__).resolve().parents[2]))
LOG_PATH = HIVE_ROOT / "GENESIS" / "UPGRADE_LOG.jsonl"
STATE_PATH = HIVE_ROOT / "GENESIS" / "SELF_UPGRADE_STATE.json"
OLLAMA_HOST = (os.getenv("OLLAMA_HOST") or "http://127.0.0.1:11434").rstrip("/")
DEFAULT_MODELS = [
    os.getenv("OLLAMA_MODEL") or "llama3.2:3b",
    "llama3.2:3b",
    "tinyllama",
]


def log(event: dict) -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    event = {**event, "ts": datetime.now(timezone.utc).isoformat()}
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(event) + "\n")
    print(f"[log] {event.get('step')}: {event.get('status')} — {event.get('detail', '')}")


def save_state(state: dict) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    state["updated_at"] = datetime.now(timezone.utc).isoformat()
    STATE_PATH.write_text(json.dumps(state, indent=2), encoding="utf-8")


def load_state() -> dict:
    if STATE_PATH.exists():
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    return {"version": 1, "upgrades": 0}


def run_ps1(script: Path) -> tuple[bool, str]:
    if not script.exists():
        return False, f"missing {script}"
    try:
        r = subprocess.run(
            [
                "powershell",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(script),
            ],
            cwd=str(HIVE_ROOT),
            capture_output=True,
            text=True,
            timeout=600,
        )
        out = (r.stdout or "") + (r.stderr or "")
        return r.returncode == 0, out[-2000:]
    except Exception as e:
        return False, str(e)


def refresh_handbook() -> None:
    script = HIVE_ROOT / "scripts" / "download_gentoo_handbook.ps1"
    ok, detail = run_ps1(script)
    log({"step": "handbook_mirror", "status": "ok" if ok else "fail", "detail": detail[:500]})


def check_stage3() -> None:
    """Record latest SPARC openrc stage3 name (download only if --fetch-stage3)."""
    url = "https://distfiles.gentoo.org/releases/sparc/autobuilds/latest-stage3.txt"
    try:
        with urllib.request.urlopen(url, timeout=60) as resp:
            text = resp.read().decode("utf-8", errors="replace")
        man = HIVE_ROOT / "GENESIS" / "manifests"
        man.mkdir(parents=True, exist_ok=True)
        (man / "latest-stage3.txt").write_text(text, encoding="utf-8")
        lines = [ln for ln in text.splitlines() if "sparc64-openrc" in ln and not ln.startswith("#")]
        latest = lines[0].split()[0] if lines else None
        log({"step": "stage3_check", "status": "ok", "detail": latest or "no sparc64-openrc line"})
        state = load_state()
        state["latest_stage3_rel"] = latest
        save_state(state)
    except Exception as e:
        log({"step": "stage3_check", "status": "fail", "detail": str(e)})


def fetch_stage3() -> None:
    script = HIVE_ROOT / "scripts" / "download_gentoo_sparc.ps1"
    ok, detail = run_ps1(script)
    log({"step": "stage3_fetch", "status": "ok" if ok else "fail", "detail": detail[:500]})
    assim = HIVE_ROOT / "scripts" / "assimilate" / "assimilate_gentoo.ps1"
    if assim.exists():
        ok2, d2 = run_ps1(assim)
        log({"step": "assimilate", "status": "ok" if ok2 else "fail", "detail": d2[:500]})


def ollama_reachable() -> bool:
    try:
        req = urllib.request.Request(f"{OLLAMA_HOST}/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=3) as resp:
            return 200 <= resp.status < 300
    except Exception:
        return False


def upgrade_models(models: list[str]) -> None:
    if not ollama_reachable():
        log({"step": "ollama_models", "status": "skip", "detail": "Ollama not running — start Ollama then re-run"})
        return
    for model in models:
        if not model:
            continue
        try:
            print(f"[*] ollama pull {model}")
            r = subprocess.run(
                ["ollama", "pull", model],
                capture_output=True,
                text=True,
                timeout=3600,
            )
            ok = r.returncode == 0
            log(
                {
                    "step": "ollama_pull",
                    "status": "ok" if ok else "fail",
                    "detail": f"{model}: {(r.stderr or r.stdout or '')[-300:]}",
                }
            )
        except FileNotFoundError:
            log({"step": "ollama_pull", "status": "fail", "detail": "ollama binary not on PATH"})
            return
        except Exception as e:
            log({"step": "ollama_pull", "status": "fail", "detail": f"{model}: {e}"})


def git_pull_dna() -> None:
    git_dir = HIVE_ROOT / ".git"
    if not git_dir.exists():
        log({"step": "git_pull", "status": "skip", "detail": "no .git — local DNA only"})
        return
    try:
        r = subprocess.run(
            ["git", "-C", str(HIVE_ROOT), "pull", "--ff-only"],
            capture_output=True,
            text=True,
            timeout=120,
        )
        log(
            {
                "step": "git_pull",
                "status": "ok" if r.returncode == 0 else "fail",
                "detail": (r.stdout or r.stderr or "")[:400],
            }
        )
    except Exception as e:
        log({"step": "git_pull", "status": "fail", "detail": str(e)})


def rebuild_knowledge_digest() -> None:
    """Lightweight digest rebuild without PowerShell assimilate."""
    knowledge = HIVE_ROOT / "NEURAL" / "krackerjack" / "knowledge"
    knowledge.mkdir(parents=True, exist_ok=True)
    hive_hb = HIVE_ROOT / "docs" / "HIVE_HANDBOOK"
    lines = [
        "# KRACKERJACK Handbook Digest",
        "",
        f"Self-upgrade rebuild: {datetime.now(timezone.utc).isoformat()}",
        "Free · local · no API keys",
        "",
    ]
    if hive_hb.exists():
        for p in sorted(hive_hb.glob("*.md")):
            lines.append(f"### {p.name}")
            lines.append("")
            lines.append("\n".join(p.read_text(encoding="utf-8", errors="replace").splitlines()[:35]))
            lines.append("")
    idx = HIVE_ROOT / "docs" / "handbook" / "gentoo-sparc" / "00_INDEX.md"
    if idx.exists():
        lines.append("## Gentoo index")
        lines.append(idx.read_text(encoding="utf-8", errors="replace")[:4000])
    out = knowledge / "HANDBOOK_DIGEST.md"
    out.write_text("\n".join(lines), encoding="utf-8")
    log({"step": "knowledge_digest", "status": "ok", "detail": str(out)})


def write_never_obsolete_marker() -> None:
    path = HIVE_ROOT / "GENESIS" / "NEVER_OBSOLETE.md"
    path.write_text(
        "\n".join(
            [
                "# HIVE NEVER OBSOLETE",
                "",
                "The Hive is self-upgradeable without subscriptions.",
                "",
                "## Free upgrade surfaces",
                "1. Local models (Ollama) — `self_upgrade.py --models`",
                "2. Gentoo handbook mirror — free wiki",
                "3. Gentoo stage3 seeds — free distfiles",
                "4. Hive DNA — local git / war room files",
                "5. Offline sovereign brain — always works with zero keys",
                "",
                f"Last self-upgrade pass: {datetime.now(timezone.utc).isoformat()}",
                "",
                "Paid cloud APIs are optional legacy toys — never required.",
                "",
            ]
        ),
        encoding="utf-8",
    )


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="HIVE self-upgrade (free, no API keys)")
    p.add_argument("--offline", action="store_true", help="Skip network (digest + state only)")
    p.add_argument("--handbook", action="store_true", help="Refresh Gentoo handbook mirror")
    p.add_argument("--stage3-check", action="store_true", help="Check latest SPARC stage3 listing")
    p.add_argument("--fetch-stage3", action="store_true", help="Download stage3 + assimilate")
    p.add_argument("--models", action="store_true", help="Pull/update Ollama models")
    p.add_argument("--git", action="store_true", help="git pull --ff-only if repo exists")
    p.add_argument("--all", action="store_true", help="handbook + stage3-check + models + digest + git")
    p.add_argument("--model", action="append", dest="model_list", help="Extra model name to pull")
    args = p.parse_args(argv)

    print("==========================================")
    print("  HIVE SELF-UPGRADE — FREE / NO API KEYS")
    print(f"  Root: {HIVE_ROOT}")
    print("==========================================")

    # default: full free upgrade if no flags
    do_all = args.all or not any(
        [args.offline, args.handbook, args.stage3_check, args.fetch_stage3, args.models, args.git]
    )

    state = load_state()
    state["upgrades"] = int(state.get("upgrades", 0)) + 1

    rebuild_knowledge_digest()
    write_never_obsolete_marker()

    if args.offline:
        save_state(state)
        log({"step": "offline_pass", "status": "ok", "detail": "digest + never-obsolete marker only"})
        print("[+] Offline self-upgrade pass complete.")
        return 0

    if do_all or args.handbook:
        refresh_handbook()
        rebuild_knowledge_digest()
    if do_all or args.stage3_check:
        check_stage3()
    if args.fetch_stage3:
        fetch_stage3()
    if do_all or args.models:
        models = list(DEFAULT_MODELS)
        if args.model_list:
            models.extend(args.model_list)
        # unique preserve order
        seen = set()
        uniq = []
        for m in models:
            if m not in seen:
                seen.add(m)
                uniq.append(m)
        upgrade_models(uniq)
    if do_all or args.git:
        git_pull_dna()

    save_state(state)
    log({"step": "complete", "status": "ok", "detail": f"upgrade_count={state['upgrades']}"})
    print("[+] Self-upgrade complete. Hive remains free and self-upgradeable.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
