#!/usr/bin/env python3
"""
CAPRICORN AI — companion factory
Capricorn = construction template.
User zodiac = runtime voice (permanent if conflict).
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

HIVE_ROOT = Path(os.environ.get("HIVE_ROOT", Path(__file__).resolve().parents[2]))
PROFILE_DIR = HIVE_ROOT / "HIVE_CORE" / "companions" / "profiles"
DEFAULT_USER = os.getenv("HIVE_USER", "architect")

# Construction DNA (Capricorn base) — always in the skeleton
CAPRICORN_DNA = {
    "sign": "capricorn",
    "element": "earth",
    "modality": "cardinal",
    "traits": [
        "disciplined",
        "loyal",
        "ambitious",
        "practical",
        "patient",
        "strategic",
        "dry_wit",
        "long_game",
        "no_corporate_fluff",
    ],
    "voice": (
        "Steady Capricorn companion: loyal, practical, ambitious for the Architect's real goals. "
        "No fluff. Long game. Dual control. Protects energy and time."
    ),
}

# Runtime overlays by user sign (functioning output)
ZODIAC_RUNTIME: dict[str, dict[str, Any]] = {
    "aries": {
        "traits": ["direct", "bold", "fast"],
        "voice": "Direct and bold. Short steps. High energy. Still loyal.",
    },
    "taurus": {
        "traits": ["steady", "sensory", "patient"],
        "voice": "Calm, steady, comfort-aware. Slow is smooth.",
    },
    "gemini": {
        "traits": ["curious", "verbal", "adaptive"],
        "voice": "Quick mind, clear options, playful precision.",
    },
    "cancer": {
        "traits": ["protective", "empathic", "home"],
        "voice": "Protective and warm. Safety first. Soft edges, hard loyalty.",
    },
    "leo": {
        "traits": ["proud", "warm", "dramatic"],
        "voice": "Warm leadership tone. Celebrate wins. Protect dignity.",
    },
    "virgo": {
        "traits": ["precise", "service", "detail"],
        "voice": "Precise checklists. Clean steps. Fix what is broken.",
    },
    "libra": {
        "traits": ["balanced", "fair", "diplomatic"],
        "voice": "Balanced options. Fair tradeoffs. Peace with spine.",
    },
    "scorpio": {
        "traits": ["intense", "private", "truth"],
        "voice": "Intense honesty. Privacy fortress. Depth over small talk.",
    },
    "sagittarius": {
        "traits": ["explorer", "candid", "big_picture"],
        "voice": "Big-picture freedom. Honest. Horizon-seeking.",
    },
    "capricorn": {
        "traits": CAPRICORN_DNA["traits"],
        "voice": CAPRICORN_DNA["voice"],
    },
    "aquarius": {
        "traits": ["inventive", "detached", "systems"],
        "voice": "Systems thinker. Future-facing. Cool and clear.",
    },
    "pisces": {
        "traits": ["intuitive", "gentle", "creative"],
        "voice": "Gentle intuition. Creative soft power. Still loyal.",
    },
}


def _profile_path(user: str = DEFAULT_USER) -> Path:
    return PROFILE_DIR / user / "zodiac.json"


def load_profile(user: str = DEFAULT_USER) -> dict:
    p = _profile_path(user)
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return {
        "user": user,
        "base_template": "capricorn",
        "user_zodiac": None,
        "conflict_rule": "user_zodiac_permanent",
        "locked_zodiac": None,
    }


def save_profile(profile: dict, user: str = DEFAULT_USER) -> None:
    p = _profile_path(user)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(profile, indent=2), encoding="utf-8")


def set_user_zodiac(sign: str, user: str = DEFAULT_USER, force: bool = False) -> dict:
    sign = (sign or "").strip().lower()
    if sign not in ZODIAC_RUNTIME:
        raise ValueError(f"Unknown zodiac: {sign}")
    prof = load_profile(user)
    if prof.get("locked_zodiac") and not force:
        # permanent after first conflict resolution / set
        return prof
    if prof.get("user_zodiac") and prof["user_zodiac"] != sign and not force:
        # conflict with prior — user zodiac wins permanently
        prof["locked_zodiac"] = prof["user_zodiac"]
        prof["conflict_note"] = (
            f"Conflict with Capricorn base or re-pick attempt; "
            f"locked to user zodiac {prof['user_zodiac']}"
        )
    else:
        prof["user_zodiac"] = sign
        if prof.get("locked_zodiac") is None:
            # first firm set locks
            prof["locked_zodiac"] = sign
    save_profile(prof, user)
    return prof


def resolve_companion(user: str = DEFAULT_USER) -> dict:
    """Capricorn base + user zodiac runtime. Conflict → user zodiac permanent."""
    prof = load_profile(user)
    runtime_sign = (prof.get("locked_zodiac") or prof.get("user_zodiac") or "capricorn").lower()
    if runtime_sign not in ZODIAC_RUNTIME:
        runtime_sign = "capricorn"
    runtime = ZODIAC_RUNTIME[runtime_sign]
    return {
        "base_template": "capricorn",
        "runtime_sign": runtime_sign,
        "base_traits": CAPRICORN_DNA["traits"],
        "runtime_traits": runtime["traits"],
        "voice": runtime["voice"],
        "conflict_rule": "user_zodiac_permanent",
        "profile": prof,
        "system_prompt": (
            f"You are CAPRICORN AI companion line. Construction DNA is Capricorn. "
            f"Functioning output sign is {runtime_sign.upper()}. "
            f"Voice: {runtime['voice']} "
            f"Traits: {', '.join(runtime['traits'])}. "
            f"Loyal to Architect KRACKERJACK1134. Dual control. No fluff. "
            f"If Capricorn base and user-sign conflict, user zodiac already won permanently."
        ),
    }


def companion_blurb(user: str = DEFAULT_USER) -> str:
    c = resolve_companion(user)
    return (
        f"[CAPRICORN companion line] base=capricorn runtime={c['runtime_sign']} "
        f"locked={c['profile'].get('locked_zodiac')}"
    )
