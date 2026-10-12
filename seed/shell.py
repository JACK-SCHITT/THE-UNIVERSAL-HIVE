#!/usr/bin/env python3
"""Device + shell bridge — the Hive's own hands on the machine it runs on.

The Operit-class ability to run Linux commands/scripts/dev-tools locally, plus
device facts. Safe by default:

  * commands run without a shell (no pipes/redirects -> no metacharacter injection)
  * argv[0] must be on the allowlist unless HIVE_SHELL_OPEN=1
  * working dir is confined to the Hive tree unless HIVE_SHELL_ROOT is set
  * hard timeout

Expand intentionally, not by accident.
"""
from __future__ import annotations

import os
import platform
import shlex
import shutil
import subprocess
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DEFAULT_ALLOW = {
    "ls", "cat", "pwd", "echo", "uname", "df", "free", "whoami", "date", "id",
    "git", "python3", "pip3", "grep", "find", "head", "tail", "wc", "sort",
    "uniq", "env", "which", "file", "du", "stat", "tree", "sed", "awk", "cut",
    "basename", "dirname", "realpath", "printf", "tr", "tee", "true", "false",
}


def _allow() -> set:
    extra = os.environ.get("HIVE_SHELL_ALLOW", "")
    return DEFAULT_ALLOW | {c.strip() for c in extra.split(",") if c.strip()}


def _open() -> bool:
    return os.environ.get("HIVE_SHELL_OPEN") == "1"


def _root() -> str:
    return os.environ.get("HIVE_SHELL_ROOT") or ROOT


def run(cmd: str, cwd: str | None = None, timeout: int = 30) -> dict:
    if not cmd or not cmd.strip():
        return {"error": "empty command"}
    try:
        argv = shlex.split(cmd)
    except ValueError as e:
        return {"error": f"bad command: {e}"}
    if not argv:
        return {"error": "empty command"}
    base = os.path.basename(argv[0])
    if not _open() and base not in _allow():
        return {"error": f"'{base}' not allowed (allowlist). set HIVE_SHELL_OPEN=1 to open.",
                "allowed": sorted(_allow())}
    root = os.path.realpath(_root())
    workdir = os.path.realpath(os.path.join(root, cwd or "."))
    if os.path.commonpath([root, workdir]) != root:
        return {"error": "cwd outside hive root"}
    if not os.path.isdir(workdir):
        return {"error": f"no such dir: {cwd}"}
    t0 = time.time()
    try:
        p = subprocess.run(argv, cwd=workdir, capture_output=True, text=True, timeout=timeout)
        return {"code": p.returncode, "cmd": cmd, "cwd": os.path.relpath(workdir, root),
                "stdout": p.stdout[-8000:], "stderr": p.stderr[-4000:],
                "seconds": round(time.time() - t0, 3)}
    except subprocess.TimeoutExpired:
        return {"error": f"timed out after {timeout}s", "cmd": cmd}
    except FileNotFoundError:
        return {"error": f"command not found: {base}"}
    except Exception as e:  # noqa: BLE001
        return {"error": str(e)}


def device_info() -> dict:
    total = None
    try:
        with open("/proc/meminfo") as f:
            for line in f:
                if line.startswith("MemTotal"):
                    total = int(line.split()[1]) // 1024
                    break
    except OSError:
        total = None
    du = shutil.disk_usage("/")
    return {
        "system": platform.system(),
        "release": platform.release(),
        "machine": platform.machine(),
        "hostname": platform.node(),
        "python": platform.python_version(),
        "cpu_count": os.cpu_count(),
        "mem_mb": total,
        "disk_gb": {"total": round(du.total / 1e9, 1), "free": round(du.free / 1e9, 1)},
        "hive_root": ROOT,
        "shell_open": _open(),
        "shell_allow": sorted(_allow()),
    }


if __name__ == "__main__":
    import json
    print(json.dumps(device_info(), indent=2))
