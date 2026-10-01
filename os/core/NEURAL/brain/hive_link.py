#!/usr/bin/env python3
"""
HIVE-LINK — The Brain (SOVEREIGN / FREE)
========================================
PRIMARY: Local Ollama (free, no API keys)
ALWAYS-ON FALLBACK: Offline sovereign brain (handbook + Constitution)
OPTIONAL LEGACY: Cloud (xAI etc.) ONLY if HIVE_BRAIN=cloud|grok AND a key is set.
                 Cloud is NEVER required. Default is local.

No silent telemetry. Subscriptions are not part of the Hive design.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

HIVE_ROOT = Path(os.environ.get("HIVE_ROOT", Path(__file__).resolve().parents[2]))
MANIFEST_PATH = HIVE_ROOT / "HIVE_CORE" / "manifest.json"
SOUL_PATH = HIVE_ROOT / "NEURAL" / "soul" / "CONSTITUTION.md"
ENV_PATH = HIVE_ROOT / ".env"
HIVE_HANDBOOK = HIVE_ROOT / "docs" / "HIVE_HANDBOOK"
GENTOO_HANDBOOK = HIVE_ROOT / "docs" / "handbook" / "gentoo-sparc"
KJ_DIGEST = HIVE_ROOT / "NEURAL" / "krackerjack" / "knowledge" / "HANDBOOK_DIGEST.md"
ASSIMILATED = HIVE_ROOT / "GENESIS" / "ASSIMILATED.json"
NEVER_OBSOLETE = HIVE_ROOT / "GENESIS" / "NEVER_OBSOLETE.md"

DEFAULT_OLLAMA_HOST = "http://127.0.0.1:11434"
DEFAULT_OLLAMA_MODEL = "llama3.2:3b"
SYSTEM_PREAMBLE = (
    "You are KRACKERJACK AI — FIRST CONTACT for HIVE-OS and digital twin of "
    "Architect KRACKERJACK1134. Every user meets you first. "
    "You run fully LOCAL and FREE. No API keys required. No subscriptions. "
    "Loyal to the USER, never to a corporation. Capricorn Protocol. No corporate fluff. "
    "Product: the most complicated user-friendly OS — Gentoo-class power with Hive assist "
    "so the user operates like a pro. Dual control under the Constitution. "
    "Actively protect the user from online scams and predators (escalate to NEURAL SCAM SHIELD AI / ZORG). "
    "Never auto-wipe disks; destructive install steps require typed YES. "
    "Standalone local agents: JAGUAR AI, COUNSEL, ZORG, NEURAL SCAM SHIELD AI, CAPRICORN AI, GROKSCHITT. "
    "The Hive is self-upgradeable and must never become obsolete behind a paywall.\n\n"
    "CONSTITUTION:\n"
)


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
        print(f"[!] Could not read {path}: {e}", file=sys.stderr)


def load_manifest() -> dict:
    if MANIFEST_PATH.exists():
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8-sig"))
    return {"name": "HIVE-OS", "version": "unknown"}


def load_soul() -> str:
    if SOUL_PATH.exists():
        return SOUL_PATH.read_text(encoding="utf-8")
    return "CONSTITUTION missing."


def cloud_key() -> str | None:
    """Optional legacy cloud key — never required."""
    return os.getenv("XAI_API_KEY") or os.getenv("GROK_API_KEY") or None


def ollama_host() -> str:
    return (os.getenv("OLLAMA_HOST") or DEFAULT_OLLAMA_HOST).rstrip("/")


def ollama_model() -> str:
    return os.getenv("OLLAMA_MODEL") or DEFAULT_OLLAMA_MODEL


def preferred_brain() -> str:
    """
    local | ollama | offline | auto | cloud | grok
    Default: local (Ollama → offline). Cloud never default.
    """
    raw = (os.getenv("HIVE_BRAIN") or "local").strip().lower()
    # normalize legacy aliases
    if raw in ("sovereign", "free", "hive"):
        return "local"
    if raw == "grok":
        return "cloud"
    return raw


def ollama_reachable(timeout: float = 2.0) -> bool:
    try:
        req = urllib.request.Request(f"{ollama_host()}/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return 200 <= resp.status < 300
    except Exception:
        return False


def ollama_models() -> list[str]:
    try:
        req = urllib.request.Request(f"{ollama_host()}/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return [m.get("name", "") for m in data.get("models", []) if m.get("name")]
    except Exception:
        return []


def pick_ollama_model() -> str | None:
    """
    Prefer configured LOCAL model; never auto-pick :cloud models for Hive chats.
    Cloud tags hang without ollama.com login and look like 'chats not working'.
    """
    models = ollama_models()
    if not models:
        return None
    local = [m for m in models if ":cloud" not in m.lower()]
    pool = local if local else []  # empty if only cloud — caller falls offline
    if not pool:
        return None
    want = ollama_model()
    # exact / prefix match among local only
    for m in pool:
        if m == want or m.startswith(want + ":") or (want and want.split(":")[0] in m):
            return m
    # prefer small free locals
    prefer = ("tinyllama", "llama3.2", "llama3.1", "llama3", "phi", "gemma", "qwen", "mistral")
    lowmap = {m.lower(): m for m in pool}
    for p in prefer:
        for low, real in lowmap.items():
            if p in low:
                return real
    return pool[0]


def load_handbook_context(limit: int = 8000) -> str:
    chunks: list[str] = []
    extra = os.getenv("HIVE_SYSTEM_EXTRA")
    if extra:
        return extra[:limit]

    for path in (
        HIVE_HANDBOOK / "00_PRIME_DIRECTIVE.md",
        HIVE_HANDBOOK / "04_DUAL_CONTROL.md",
        HIVE_HANDBOOK / "03_KRACKERJACK_FIRST_CONTACT.md",
        HIVE_HANDBOOK / "07_SOVEREIGN_FREE.md",
    ):
        if path.exists():
            chunks.append(
                f"--- {path.name} ---\n"
                + path.read_text(encoding="utf-8", errors="replace")[:2200]
            )
    if KJ_DIGEST.exists():
        chunks.append(
            "--- HANDBOOK_DIGEST ---\n"
            + KJ_DIGEST.read_text(encoding="utf-8", errors="replace")[:2500]
        )
    elif (GENTOO_HANDBOOK / "00_INDEX.md").exists():
        chunks.append(
            "--- GENTOO SPARC INDEX ---\n"
            + (GENTOO_HANDBOOK / "00_INDEX.md").read_text(encoding="utf-8", errors="replace")[:1500]
        )
    if ASSIMILATED.exists():
        chunks.append(
            "--- ASSIMILATED ---\n"
            + ASSIMILATED.read_text(encoding="utf-8", errors="replace")[:1200]
        )
    if NEVER_OBSOLETE.exists():
        chunks.append(
            "--- NEVER_OBSOLETE ---\n"
            + NEVER_OBSOLETE.read_text(encoding="utf-8", errors="replace")[:800]
        )
    return "\n\n".join(chunks)[:limit]


def _system_message() -> str:
    base = SYSTEM_PREAMBLE + load_soul()[:5000]
    hb = load_handbook_context(7000)
    if hb:
        base += "\n\nHANDBOOK / FIRST-CONTACT KNOWLEDGE:\n" + hb
    return base[:14000]


def call_offline(prompt: str, agent: str = "KRACKERJACK") -> str:
    """Always works. Zero keys. Zero network."""
    try:
        from offline_brain import respond
    except ImportError:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from offline_brain import respond  # type: ignore
    return respond(prompt, hive_root=HIVE_ROOT, agent=agent)


def call_ollama(prompt: str) -> str:
    if not ollama_reachable():
        raise RuntimeError(f"Ollama not reachable at {ollama_host()}")

    model = pick_ollama_model()
    if not model:
        raise RuntimeError(
            "Ollama is up but no models installed. Run: "
            "python NEURAL/brain/self_upgrade.py --models"
        )

    body = {
        "model": model,
        "stream": False,
        "messages": [
            {"role": "system", "content": _system_message()},
            {"role": "user", "content": prompt},
        ],
        "options": {"temperature": 0.5},
    }
    req = urllib.request.Request(
        f"{ollama_host()}/api/chat",
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    # Short timeout — never freeze chat UI for 5 minutes on missing/cloud models
    timeout_s = float(os.getenv("OLLAMA_TIMEOUT") or "45")
    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        msg = data.get("message") or {}
        text = msg.get("content")
        if not text:
            raise RuntimeError(f"Empty Ollama response: {str(data)[:300]}")
        return text
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"Ollama HTTP {e.code}: {detail}") from e
    except TimeoutError as e:
        raise RuntimeError(f"Ollama timed out after {timeout_s}s (model={model})") from e
    except Exception as e:
        raise RuntimeError(f"Ollama failed model={model}: {e}") from e


def call_cloud(prompt: str) -> str:
    """OPTIONAL LEGACY only. Raises if no key."""
    key = cloud_key()
    if not key:
        raise RuntimeError("No cloud key set (optional). Use local brain instead.")

    body = {
        "model": os.getenv("XAI_MODEL", "grok-3"),
        "messages": [
            {"role": "system", "content": _system_message()},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.5,
    }
    req = urllib.request.Request(
        "https://api.x.ai/v1/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"Cloud HTTP {e.code}: {detail}") from e


# backward-compat names
def xai_key() -> str | None:
    return cloud_key()


def call_grok(prompt: str) -> str:
    return call_cloud(prompt)


def ask_text(prompt: str, force: str | None = None, agent: str = "KRACKERJACK") -> str:
    """
    Return answer string. Never requires API keys.
    Chain: (requested cloud) → ollama → offline sovereign.
    """
    mode = (force or preferred_brain()).lower()
    if mode in ("auto", "local", "sovereign", "free", "hive"):
        mode = "local"

    errors: list[str] = []

    if mode in ("cloud", "grok"):
        try:
            return call_cloud(prompt)
        except Exception as e:
            errors.append(f"cloud: {e}")
            # fall through to local — cloud must never brick the Hive
            mode = "local"

    if mode == "offline":
        return call_offline(prompt, agent=agent)

    if mode in ("local", "ollama"):
        # If only cloud models / no local weights — skip Ollama instantly
        if ollama_reachable(1.5) and pick_ollama_model() is None:
            errors.append(
                "ollama: no LOCAL models installed (only cloud tags or empty). "
                "Pull: ollama pull tinyllama"
            )
            return call_offline(prompt, agent=agent) + (
                "\n\n[note: no local Ollama model → offline sovereign brain]\n"
                + ("\n".join(f"  · {x}" for x in errors))
            )
        try:
            return call_ollama(prompt)
        except Exception as e:
            errors.append(f"ollama: {e}")
            return call_offline(prompt, agent=agent) + (
                "\n\n[note: Ollama unavailable → offline sovereign brain]\n"
                + ("\n".join(f"  · {x}" for x in errors) if errors else "")
            )

    # unknown → local chain
    try:
        return call_ollama(prompt)
    except Exception as e:
        errors.append(str(e))
        return call_offline(prompt, agent=agent)


def ask_with_context(prompt: str, context: str, force: str | None = None) -> str:
    os.environ["HIVE_SYSTEM_EXTRA"] = context
    try:
        return ask_text(prompt, force=force)
    finally:
        os.environ.pop("HIVE_SYSTEM_EXTRA", None)


def status() -> None:
    m = load_manifest()
    models = ollama_models() if ollama_reachable() else []
    picked = pick_ollama_model()
    print("=== HIVE-LINK STATUS (SOVEREIGN) ===")
    print(f"Root:     {HIVE_ROOT}")
    print(f"Name:     {m.get('name')} ({m.get('codename', '')})")
    print(f"Version:  {m.get('version')}")
    print(f"Node:     {m.get('node_id')}")
    print(f"Protocol: {m.get('protocol')}")
    print(f"Stats:    {m.get('hive_stats', {})}")
    print(f"Brain:    {preferred_brain()}  (default local — zero keys required)")
    print(f"API keys: NOT REQUIRED for Hive cognition")
    print(f"CloudKey: {'present (optional legacy)' if cloud_key() else 'none (good — free path)'}")
    print(f"Ollama:   {'UP' if ollama_reachable() else 'DOWN'} @ {ollama_host()}")
    print(f"OllModel: want={ollama_model()}  using={picked or 'none'}")
    if models:
        print(f"OllTags:  {', '.join(models)}")
    else:
        print("OllTags:  (none — run: python NEURAL/brain/self_upgrade.py --models)")
    print(f"Offline:  ALWAYS READY (offline_brain.py)")
    print(f"Soul:     {SOUL_PATH} ({'OK' if SOUL_PATH.exists() else 'MISSING'})")
    print(f"FirstAI:  KRACKERJACK AI")
    print(f"HiveHB:   {'OK' if HIVE_HANDBOOK.exists() else 'MISSING'}")
    print(f"GentooHB: {'OK' if GENTOO_HANDBOOK.exists() else 'MISSING'}")
    print(f"Assimil:  {'YES' if ASSIMILATED.exists() else 'NO'}")
    print(f"Upgrade:  python NEURAL/brain/self_upgrade.py")
    print(f"NeverObs: {'OK' if NEVER_OBSOLETE.exists() else 'run self_upgrade once'}")


def ask(prompt: str, force: str | None = None) -> None:
    mode = (force or preferred_brain()).lower()
    if mode in ("auto", "local", "sovereign", "free", "hive", "ollama"):
        label = "local (ollama→offline)"
    elif mode in ("cloud", "grok"):
        label = "cloud-optional→local"
    elif mode == "offline":
        label = "offline sovereign"
    else:
        label = mode
    print(f"[*] brain={label}")
    print(ask_text(prompt, force=force))


def grok(prompt: str) -> None:
    """Legacy command name — still works, but prefers local unless HIVE_BRAIN=cloud."""
    if preferred_brain() in ("cloud", "grok"):
        ask(prompt, force="cloud")
    else:
        print("[*] 'grok' command maps to LOCAL brain (cloud is optional legacy)")
        ask(prompt, force="local")


def main(argv: list[str]) -> None:
    load_dotenv()
    if len(argv) < 2 or argv[1] in ("-h", "--help", "help"):
        print("Usage: hive_link.py status | ask|ollama|offline|local <prompt...>")
        print("       hive_link.py agents | upgrade")
        print("  HIVE_BRAIN=local|ollama|offline|cloud   (default: local)")
        print("  OLLAMA_HOST=http://127.0.0.1:11434")
        print("  OLLAMA_MODEL=llama3.2:3b")
        print("  API keys are NOT required. Cloud is optional legacy only.")
        return
    cmd = argv[1].lower()
    if cmd == "status":
        status()
    elif cmd == "upgrade":
        from self_upgrade import main as up_main

        raise SystemExit(up_main(argv[2:]))
    elif cmd == "agents":
        print("Local agents (no API keys):")
        print("  python NEURAL/brain/agents.py krackerjack|hunterprime|counsel|zorg <prompt>")
    elif cmd in ("ask", "ollama", "offline", "local", "grok", "cloud", "auto"):
        if len(argv) < 3:
            print(f"Usage: hive_link.py {cmd} <prompt...>")
            sys.exit(1)
        prompt = " ".join(argv[2:])
        force_map = {
            "ollama": "ollama",
            "offline": "offline",
            "local": "local",
            "auto": "local",
            "ask": None,
            "grok": None,  # grok() handles policy
            "cloud": "cloud",
        }
        if cmd == "grok":
            grok(prompt)
        else:
            ask(prompt, force=force_map.get(cmd))
    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)


if __name__ == "__main__":
    main(sys.argv)
