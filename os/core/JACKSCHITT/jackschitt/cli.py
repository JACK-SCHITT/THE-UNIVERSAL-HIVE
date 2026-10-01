"""
JACKSCHITT CLI — Part 1 hybrid shell
"""

from __future__ import annotations

import argparse
import json
import sys

from .hybrid_shell import HybridShellIntegration
from .paths import discover_drives, ensure_jackschitt_dirs, print_paths


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="JACKSCHITT AI — Windows hybrid shell")
    p.add_argument("message", nargs="*", help="Natural language or request")
    p.add_argument("--chat", action="store_true", help="Force hybrid_chat mode")
    p.add_argument("--exec", action="store_true", help="Allow command execution (opt-in)")
    p.add_argument("--paths", action="store_true", help="Show C–F drive map")
    p.add_argument("--json", action="store_true", help="Raw JSON out")
    args = p.parse_args(argv)

    ensure_jackschitt_dirs()

    if args.paths or (args.message and " ".join(args.message).lower() in ("paths", "show paths", "drives")):
        text = print_paths(discover_drives())
        print(text)
        return 0

    msg = " ".join(args.message).strip()
    if not msg:
        print("JACKSCHITT AI (World Changer base) — Windows hybrid shell")
        print("Usage: python -m jackschitt.cli \"show processes\"")
        print("       python -m jackschitt.cli --paths")
        print("       python -m jackschitt.cli --exec \"list disk space\"")
        print(print_paths(discover_drives()))
        return 0

    jack = HybridShellIntegration()
    result = jack.chat(msg, execute=args.exec)

    if args.json:
        print(json.dumps(result, indent=2, default=str))
        return 0

    if result.get("message"):
        print(result["message"])
    if result.get("commands"):
        print("\nSuggested PowerShell:")
        for c in result["commands"]:
            print(f"  > {c}")
    if result.get("results"):
        for r in result["results"]:
            print(f"\n[{r.get('type')}] {r.get('command') or ''}")
            print(r.get("output") or r.get("content") or "")
    if result.get("error") and not result.get("message"):
        print(result["error"])
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
