"""
Multi-drive path map for JACKSCHITT / HIVE war rooms.
Discovers C–F at runtime so unplugged drives do not crash the AI.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any


def _exists(p: str | Path) -> bool:
    try:
        return Path(p).exists()
    except OSError:
        return False


def _first_existing(*candidates: str | Path) -> Path | None:
    for c in candidates:
        if c and _exists(c):
            return Path(c)
    return None


@dataclass
class DriveMap:
    """Resolved roots across C–F (None if offline)."""

    # C — live PC
    c_war_room: Path | None = None
    c_hive: Path | None = None
    c_programdata: Path | None = None
    c_hive_computer: Path | None = None

    # D — Gentoo / large volume
    d_root: Path | None = None
    d_gentoo_live: bool = False

    # E — USB installer / payload
    e_root: Path | None = None
    e_hive: Path | None = None

    # F — bulk / cold / local AI
    f_root: Path | None = None
    f_war_room: Path | None = None
    f_local_ai: Path | None = None
    f_bootlab: Path | None = None
    f_iso_stage: Path | None = None
    f_bulk: Path | None = None

    # Preferred working roots
    jackschitt_home: Path | None = None
    hive_root: Path | None = None
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        for k, v in list(d.items()):
            if isinstance(v, Path):
                d[k] = str(v)
        return d


def discover_drives() -> DriveMap:
    m = DriveMap()

    # --- C ---
    m.c_war_room = _first_existing(
        os.environ.get("HIVE_ROOT"),
        r"C:\Users\ARCHITECT\THE_HIVE",
        r"C:\HIVE",
    )
    m.c_hive = _first_existing(r"C:\HIVE")
    m.c_programdata = _first_existing(r"C:\ProgramData\THE_HIVE")
    m.c_hive_computer = _first_existing(r"C:\HIVE_COMPUTER")

    # --- D ---
    if _exists("D:\\"):
        m.d_root = Path("D:\\")
        # Gentoo live markers
        if _exists(r"D:\boot\gentoo") or _exists(r"D:\gentoo.efimg") or _exists(r"D:\grub"):
            m.d_gentoo_live = True
            m.notes.append("D: looks like Gentoo live/media volume")
        m.notes.append("D: mounted")
    else:
        m.notes.append("D: not mounted")

    # --- E ---
    if _exists("E:\\"):
        m.e_root = Path("E:\\")
        m.e_hive = _first_existing(r"E:\HIVE")
        m.notes.append("E: mounted (USB/setup likely)")
    else:
        m.notes.append("E: not mounted")

    # --- F ---
    if _exists("F:\\"):
        m.f_root = Path("F:\\")
        m.f_war_room = _first_existing(r"F:\THE_HIVE")
        m.f_local_ai = _first_existing(r"F:\HIVE_LOCAL_AI")
        m.f_bootlab = _first_existing(r"F:\HIVE_BOOTLAB")
        m.f_iso_stage = _first_existing(r"F:\HIVE_ISO_STAGE")
        m.f_bulk = _first_existing(r"F:\BULK_OFFLOAD")
        m.notes.append("F: mounted (bulk/cold war room)")
    else:
        m.notes.append("F: not mounted")

    # Preferred HIVE root: env > C war room > C:\HIVE > F war room > E:\HIVE
    m.hive_root = _first_existing(
        os.environ.get("HIVE_ROOT"),
        m.c_war_room,
        m.c_hive,
        m.f_war_room,
        m.e_hive,
    )

    # JACKSCHITT home under preferred hive, else create under C war room path
    if m.hive_root:
        candidate = m.hive_root / "JACKSCHITT"
        m.jackschitt_home = candidate if candidate.exists() else candidate
    else:
        m.jackschitt_home = Path(r"C:\Users\ARCHITECT\THE_HIVE\JACKSCHITT")
        m.notes.append("No HIVE root found — defaulting JACKSCHITT under C user war room path")

    return m


def ensure_jackschitt_dirs(m: DriveMap | None = None) -> DriveMap:
    m = m or discover_drives()
    home = m.jackschitt_home or Path(r"C:\Users\ARCHITECT\THE_HIVE\JACKSCHITT")
    for sub in ("logs", "state", "parts", "ui"):
        (home / sub).mkdir(parents=True, exist_ok=True)
    # Mirror light pointer on ProgramData when possible
    pd = Path(r"C:\ProgramData\THE_HIVE\jackschitt")
    try:
        pd.mkdir(parents=True, exist_ok=True)
        pointer = pd / "HOME.txt"
        pointer.write_text(str(home), encoding="utf-8")
    except OSError:
        pass
    m.jackschitt_home = home
    return m


def print_paths(m: DriveMap | None = None) -> str:
    m = m or discover_drives()
    lines = ["=== JACKSCHITT / HIVE DRIVE MAP ===", ""]
    d = m.to_dict()
    for k, v in d.items():
        if k == "notes":
            continue
        lines.append(f"  {k}: {v}")
    lines.append("")
    lines.append("Notes:")
    for n in m.notes:
        lines.append(f"  - {n}")
    return "\n".join(lines)
