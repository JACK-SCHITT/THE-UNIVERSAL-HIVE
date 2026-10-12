#!/usr/bin/env bash
# Build every absorbed app in apps/<lane>/<id>/ into site/apps/<lane>/<id>/ and
# write site/apps/_build_report.json (per-app truth). Runs in GitHub Actions
# (fast network). Never fails the job on a single app, unless HIVE_STRICT_BUILD=1.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="$ROOT/site"
APPS="$ROOT/apps"
export CI=1
export NODE_OPTIONS="--max-old-space-size=4096"
export EXPO_NO_TELEMETRY=1

rm -rf "$SITE"
mkdir -p "$SITE/apps"

REPORT="$SITE/apps/_build_report.json"
: > "$REPORT.txt"

copy_out() {
  local appdir="$1" dest="$2"
  for cand in dist out build .output/public .vercel/output/static dist/client; do
    if [ -f "$appdir/$cand/index.html" ]; then
      mkdir -p "$dest"
      cp -a "$appdir/$cand/." "$dest/"
      return 0
    fi
  done
  return 1
}

# Absorbed apps frequently disagree on peer versions (React 19 vs. RN peers,
# etc.), which makes a plain `npm install` bail out with ERESOLVE. Relax peer
# resolution so the dependency tree actually lands, then retry on the public
# registry as a fallback.
npm_install() {
  npm install --legacy-peer-deps --no-audit --no-fund --loglevel=error \
    --registry=https://registry.npmjs.org/ >/tmp/npm.log 2>&1 \
    || npm install --legacy-peer-deps --no-audit --no-fund --loglevel=error >>/tmp/npm.log 2>&1
}

# blindman-ai ships a tsconfig.json whose "references" point at a
# tsconfig.node.json that was never committed. Vite's esbuild plugin follows
# the reference and dies with ENOENT before bundling. Generate the missing file
# in the work tree (never committed) and build normally.
build_blindman() {
  local appdir="$1"
  if [ ! -f "$appdir/tsconfig.node.json" ]; then
    printf '%s\n' '{"compilerOptions":{"composite":false,"skipLibCheck":true,"module":"ESNext","moduleResolution":"Bundler","allowSyntheticDefaultImports":true}}' > "$appdir/tsconfig.node.json"
  fi
  ( cd "$appdir" && ./node_modules/.bin/vite build ) >/tmp/build.log 2>&1
}

# Expo SDK apps build to a static site with `expo export`. Prefer the app's own
# local CLI (version-matched to the app's Expo SDK); only fall back to a global
# npx fetch if the local bin is missing.
build_expo() {
  local appdir="$1"
  if [ -x "$appdir/node_modules/.bin/expo" ]; then
    ( cd "$appdir" && ./node_modules/.bin/expo export --platform web --output-dir dist ) >/tmp/build.log 2>&1
  else
    ( cd "$appdir" && npx --yes expo export --platform web --output-dir dist ) >/tmp/build.log 2>&1
  fi
}

# record per-app result; error text = first meaningful build error line
record() {
  local id="$1" status="$2" logfile="$3"
  local err=""
  if [ -n "$logfile" ] && [ -s "$logfile" ]; then
    # cause usually sits near the top of the build log (vite/esbuild print the
    # offending module first, then the faiure summary); grab the error line and
    # the next few (stack/at-file line), fall back to last line
    err="$(head -60 "$logfile" | grep -aA3 -m1 -E "error during build|Error:|Cannot find|error TS|SyntaxError|ReferenceError|Unexpected|✘|Resolution error" 2>/dev/null | head -4 | tr '\n' ' ' | cut -c1-600)"
    [ -n "$err" ] || err="$(tail -4 "$logfile" 2>/dev/null | tr '\n' ' ' | cut -c1-600)"
    [ -n "$err" ] || err="$(grep -aE "Error:|Cannot find|failed" "$logfile" 2>/dev/null | head -1)"
  fi
  printf '%s\t%s\t%s\n' "$id" "$status" "$err" >> "$REPORT.txt"
}

built=0; skipped=0; failed=0

for appdir in "$APPS"/*/*/; do
  [ -d "$appdir" ] || continue
  id="$(basename "$appdir")"
  lane="$(basename "$(dirname "$appdir")")"
  dest="$SITE/apps/$lane/$id"
  echo "=== $lane/$id ==="

  # Per-app overrides.
  case "$lane/$id" in
    # TanStack Start SSR app: Nitro (preset vercel) emits a portable *server*
    # bundle under .output/ + .vercel/, not a static site, and the app needs its
    # auth/Postgres server. It cannot be hosted on Pages -> skip, don't fail.
    field/dragonfly)
      echo "  server-rendered (Nitro/Vercel SSR, no static output) -> skip"
      record "$lane/$id" skipped ""
      skipped=$((skipped+1)); continue
      ;;
  esac

  if [ -f "$appdir/package.json" ]; then
    kind="node"
    grep -q '"expo"' "$appdir/package.json" && kind="expo"
    if [ "$kind" = "node" ] && grep -q '"next"' "$appdir/package.json"; then kind="next"; fi
    if [ "$kind" = "node" ] && ! grep -q '"build"' "$appdir/package.json"; then
      echo "  no build script -> skip"; record "$lane/$id" skipped ""; skipped=$((skipped+1)); continue
    fi

    ( cd "$appdir" || exit 1
      npm_install
      case "$lane/$id" in
        agents/blindman-ai) build_blindman "$appdir" ;;
        *)
          case "$kind" in
            expo) build_expo "$appdir" ;;
            next) npm run build >/tmp/build.log 2>&1 ;;
            *)    npm run build >/tmp/build.log 2>&1 ;;
          esac
          ;;
      esac
    )

    if copy_out "$appdir" "$dest"; then
      echo "  built -> $lane/$id"; record "$lane/$id" built ""
      built=$((built+1))
    else
      echo "  FAILED -> $lane/$id"
      echo "  --- npm.log (last 15) ---"; tail -15 /tmp/npm.log 2>/dev/null | sed 's/^/    /'
      echo "  --- build.log errors (first 15) ---"; grep -aE "Error|error:|Cannot find|SyntaxError|TypeError|failed|Unexpected" /tmp/build.log 2>/dev/null | head -15 | sed 's/^/    /'
      echo "  --- build.log (last 12) ---"; tail -12 /tmp/build.log 2>/dev/null | sed 's/^/    /'
      record "$lane/$id" failed /tmp/build.log
      failed=$((failed+1))
    fi
  elif [ -f "$appdir/index.html" ]; then
    mkdir -p "$dest"; cp -a "$appdir/." "$dest/"
    echo "  static -> $lane/$id"; record "$lane/$id" built ""
    built=$((built+1))
  else
    echo "  stub (no package.json/index.html) -> skip"; record "$lane/$id" skipped ""
    skipped=$((skipped+1))
  fi
done

# cockpit + static index
cp -a "$ROOT/web/." "$SITE/"
[ -d "$ROOT/docs" ] && { mkdir -p "$SITE/docs"; cp -a "$ROOT/docs/." "$SITE/docs/"; }
python3 "$ROOT/seed/ci_site.py" "$APPS" "$SITE" || true

echo "-----------------------------------------"
echo "built=$built skipped=$skipped failed=$failed"
echo "site contents:"; find "$SITE" -maxdepth 3 -name index.html | sed "s#$SITE#  #"

# per-app truth report (also lands in the Pages deploy + github-pages artifact)
python3 - "$REPORT.txt" "$REPORT" "$built" "$skipped" "$failed" <<'PY'
import json, sys
rows_file, out, built, skipped, failed = sys.argv[1:6]
rows = {}
for line in open(rows_file):
    line = line.rstrip("\n")
    if not line:
        continue
    app, status, err = line.split("\t", 2)
    rows[app] = {"status": status, "error": err[:240]}
json.dump({"counts": {"built": int(built), "skipped": int(skipped), "failed": int(failed)},
           "apps": rows,
           "note": "run 'scripts/ci_build_all.sh' in Actions; HIVE_STRICT_BUILD=1 turns any failed into an exit 1"},
          open(out, "w"), indent=2, sort_keys=True)
print(f"wrote {out} ({len(rows)} apps)")
PY
echo "report:"; cat "$REPORT"

# strict mode: fail the job so Pages/#/apps shows the truth
if [ "${HIVE_STRICT_BUILD:-0}" = "1" ] && [ "$failed" -gt 0 ]; then
  echo "HIVE_STRICT_BUILD: $failed app(s) failed"
  exit 1
fi

# report back: commit the per-app truth into the repo so it is readable at
# raw.githubusercontent.com/<owner>/<repo>/main/site/apps/_build_report.json
# (the github-pages artifact is not readable through plain HTTP). The push uses
# GITHUB_TOKEN, whose commits never re-trigger workflows -> no loop.
if [ "${HIVE_REPORT_BACK:-0}" = "1" ]; then
  if git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git -C "$ROOT" add -f "$REPORT"
    if ! git -C "$ROOT" diff --cached --quiet; then
      git -C "$ROOT" config user.email "citeam@hive.local"
      git -C "$ROOT" config user.name "hive ci"
      git -C "$ROOT" commit -q -m "ci: per-app build report [skip ci]" -- "$REPORT"
      git -C "$ROOT" push -q origin HEAD:main 2>&1 | sed 's/^/    /'
      echo "reported: $REPORT"
    else
      echo "report unchanged -> no commit"
    fi
  fi
fi
exit 0
