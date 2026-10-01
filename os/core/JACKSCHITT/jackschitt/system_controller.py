"""
Minimal system controller for JACKSCHITT hybrid shell (Part 1/2 stub).
Real sensors expand in later parts — keep thermal-light.
"""

from __future__ import annotations

import platform
import subprocess
from typing import Any


class SystemController:
    """Read-only-ish system view for conversational status."""

    def get_running_processes(self) -> list[dict[str, Any]]:
        try:
            r = subprocess.run(
                [
                    "powershell",
                    "-NoProfile",
                    "-Command",
                    "Get-Process | Select-Object -First 50 Name,Id,CPU | ConvertTo-Json -Compress",
                ],
                capture_output=True,
                text=True,
                timeout=15,
            )
            import json

            data = json.loads(r.stdout or "[]")
            if isinstance(data, dict):
                data = [data]
            return data if isinstance(data, list) else []
        except Exception:
            return []

    def brief(self) -> str:
        n = len(self.get_running_processes())
        return (
            f"Host={platform.node()} OS={platform.system()} {platform.release()} "
            f"sample_processes≈{n}"
        )
