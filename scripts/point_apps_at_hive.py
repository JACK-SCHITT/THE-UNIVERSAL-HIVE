#!/usr/bin/env python3
"""Point absorbed apps at the Hive gateway instead of a rented Supabase project.

Every app that reads VITE_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL /
EXPO_PUBLIC_SUPABASE_URL gets a runtime fallback to the current origin. When the
Hive node (seed/serve.py) serves the app, same-origin requests land on
/auth/v1, /rest/v1, /functions/v1, /storage/v1 -> the Hive. No env needed.

Non-browser bundles keep the old guard behaviour (config missing -> auth off),
because the fallback is guarded by `typeof location`.

Idempotent: a pattern only matches a *bare* env reference, never one already
inside its own replacement, so repeated runs are a no-op after the first.
"""
from __future__ import annotations

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPS = os.path.join(ROOT, "apps")

ORIGIN = '(typeof location!=="undefined"?location.origin:"")'
KEY = '"hive-anon-key"'

REPL = [
    (r"import\.meta\.env\.VITE_SUPABASE_URL(?!\s*\|\|\s*\(?typeof\s+location)",
     f"(import.meta.env.VITE_SUPABASE_URL || {ORIGIN})"),
    (r"import\.meta\.env\.VITE_SUPABASE_ANON_KEY(?!\s*\|\|\s*[\"']?hive-anon-key)",
     f"(import.meta.env.VITE_SUPABASE_ANON_KEY || {KEY})"),
    (r"process\.env\.NEXT_PUBLIC_SUPABASE_URL(?!\s*\|\|\s*\(?typeof\s+location)",
     f"(process.env.NEXT_PUBLIC_SUPABASE_URL || {ORIGIN})"),
    (r"process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY(?!\s*\|\|\s*[\"']?hive-anon-key)",
     f"(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || {KEY})"),
    (r"process\.env\.EXPO_PUBLIC_SUPABASE_URL(?!\s*\|\|\s*\(?typeof\s+location)",
     f"(process.env.EXPO_PUBLIC_SUPABASE_URL || {ORIGIN})"),
    (r"process\.env\.EXPO_PUBLIC_SUPABASE_ANON_KEY(?!\s*\|\|\s*[\"']?hive-anon-key)",
     f"(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || {KEY})"),
]

EXTS = (".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs")


def patch_file(path: str) -> int:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        src = f.read()
    changed = 0
    for pattern, repl in REPL:
        new = re.sub(pattern, repl, src)
        if new != src:
            changed += 1
        src = new
    with open(path, "w", encoding="utf-8") as f:
        f.write(src)
    return changed


def main():
    dry = "--dry" in sys.argv
    n_files = n_hits = 0
    for base, dirs, files in os.walk(APPS):
        dirs[:] = [d for d in dirs if d not in ("node_modules", "dist", "build", "out", ".next", ".output")]
        for name in files:
            if not name.endswith(EXTS):
                continue
            path = os.path.join(base, name)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    head = f.read(1_500_000)
            except OSError:
                continue
            needs = any(p in head for p in ("VITE_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_URL"))
            if not needs:
                continue
            if dry:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    raw = f.read()
                n = sum(1 for p, _ in REPL if re.search(p, raw))
                if n:
                    n_files += 1
                    n_hits += n
                continue
            hits = patch_file(path)
            n_files += 1
            n_hits += hits
            print(f"  patched ({hits}): {os.path.relpath(path, APPS)}")
    print(f"{'dry-run: ' if dry else ''}{n_files} files / {n_hits} replacements")


if __name__ == "__main__":
    main()