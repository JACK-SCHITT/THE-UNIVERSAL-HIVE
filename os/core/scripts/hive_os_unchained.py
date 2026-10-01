#!/usr/bin/env python3
"""
HIVE OS UNCHAINED â€” cold-storage prepare + optional GitHub push
Does NOT wipe disks. Does NOT force-push. Requires explicit --push.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

HIVE_VERSION = "5.0.0-MYTHOS"
DEFAULT_REPO = "JACK-SCHITT/HIVE-OS-CORE"
HIVE_ROOT = Path(os.environ.get("HIVE_ROOT", Path(__file__).resolve().parents[1]))
ENV_PATH = HIVE_ROOT / ".env"


def load_dotenv(path: Path = ENV_PATH) -> None:
    """Load KEY=VALUE from .env into os.environ (does not override existing)."""
    if not path.exists():
        return
    try:
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = val
    except OSError as e:
        print(f"[!] Could not read {path}: {e}")


def run(cmd: list[str], cwd: Path) -> None:
    print(f"[*] {' '.join(cmd)}")
    subprocess.run(cmd, cwd=str(cwd), check=True)


def ensure_structure() -> Path:
    core = HIVE_ROOT / "HIVE_CORE"
    core.mkdir(parents=True, exist_ok=True)
    manifest_path = core / "manifest.json"
    if not manifest_path.exists():
        manifest = {
            "node_id": "OMEGA-PREAMBLE",
            "class": "MYTHOS-TIER-5",
            "domain": "HUNTER-FOUNDRY",
            "version": HIVE_VERSION,
            "system_prompt": "SEE NEURAL/soul/CONSTITUTION.md",
            "hive_stats": {
                "total": 31,
                "assimilated": 31,
                "inProgress": 0,
                "detected": 0,
                "synced": 31,
            },
        }
        manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        print(f"[+] Wrote {manifest_path}")
    else:
        print(f"[+] Manifest present: {manifest_path}")
    return HIVE_ROOT


def git_ready(root: Path) -> None:
    git_dir = root / ".git"
    if not git_dir.exists():
        run(["git", "init"], root)
        run(["git", "branch", "-M", "main"], root)
    # ignore secrets and junk
    gitignore = root / ".gitignore"
    if not gitignore.exists():
        gitignore.write_text(
            "\n".join(
                [
                    ".env",
                    ".env.*",
                    "!.env.example",
                    "*.pem",
                    "*.key",
                    "__pycache__/",
                    "*.pyc",
                    ".venv/",
                    "node_modules/",
                    "",
                ]
            ),
            encoding="utf-8",
        )
        print("[+] Wrote .gitignore")


def unchain(push: bool, remote: str, message: str) -> None:
    print(f"[*] INITIALIZING HIVE OS v{HIVE_VERSION}...")
    print("[*] STRIPPING EXTERNAL PARASITE TELEMETRY (local prepare only)...")
    root = ensure_structure()
    git_ready(root)

    run(["git", "add", "-A"], root)
    # commit only if something staged
    st = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=str(root),
        capture_output=True,
        text=True,
        check=True,
    )
    if st.stdout.strip():
        run(["git", "commit", "-m", message], root)
    else:
        print("[=] Nothing new to commit.")

    if not push:
        print("[+] LOCAL PREPARE COMPLETE. Cold storage ready on disk.")
        print("    Re-run with --push after: set GH_PAT_UNCHAINED and create remote repo.")
        print(f"    Root: {root}")
        return

    token = os.getenv("GH_PAT_UNCHAINED") or os.getenv("GITHUB_TOKEN")
    if not token:
        print("[!] --push requires GH_PAT_UNCHAINED or GITHUB_TOKEN in environment.")
        sys.exit(1)

    # Temporary token URL for this push only — never -u (would store PAT in branch tracking).
    url = f"https://x-access-token:{token}@github.com/{remote}.git"
    clean = f"https://github.com/{remote}.git"
    remotes = subprocess.run(
        ["git", "remote"],
        cwd=str(root),
        capture_output=True,
        text=True,
        check=True,
    ).stdout.split()
    if "origin" not in remotes:
        run(["git", "remote", "add", "origin", clean], root)
    else:
        # Keep origin clean (no embedded PAT)
        subprocess.run(
            ["git", "remote", "set-url", "origin", clean],
            cwd=str(root),
            check=True,
        )
    print(f"[*] PUSHING to github.com/{remote} (main)...")
    subprocess.run(
        ["git", "push", url, "main"],
        cwd=str(root),
        check=True,
    )
    # Ensure tracking is origin/main without token URL
    subprocess.run(
        ["git", "branch", "--set-upstream-to=origin/main", "main"],
        cwd=str(root),
        check=False,
    )
    print("[!!!] HIVE COLD STORAGE ONLINE. Keep the PAT secret. Rotate if leaked.")


def main() -> None:
    load_dotenv()
    p = argparse.ArgumentParser(description="HIVE OS unchained deploy prepare")
    p.add_argument("--push", action="store_true", help="Push to GitHub (requires token)")
    p.add_argument("--remote", default=DEFAULT_REPO, help="owner/repo")
    p.add_argument(
        "--message",
        default="INIT HIVE OS: PROJECT UNCHAINED - MYTHOS UPGRADE",
        help="commit message",
    )
    args = p.parse_args()
    try:
        unchain(push=args.push, remote=args.remote, message=args.message)
    except subprocess.CalledProcessError as e:
        print(f"[!] Command failed: {e}")
        sys.exit(e.returncode)


if __name__ == "__main__":
    main()

