#!/usr/bin/env bash
# Build every absorbed app in apps/<lane>/<id>/ into site/apps/<lane>/<id>/.
# Runs in GitHub Actions (fast network). Never fails the job on a single app.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="$ROOT/site"
APPS="$ROOT/apps"
export CI=1
export NODE_OPTIONS="--max-old-space-size=4096"

rm -rf "$SITE"
mkdir -p "$SITE/apps"

copy_out() {
  local appdir="$1" dest="$2"
  for cand in dist out build .output/public; do
    if [ -f "$appdir/$cand/index.html" ]; then
      mkdir -p "$dest"
      cp -a "$appdir/$cand/." "$dest/"
      return 0
    fi
  done
  return 1
}

built=0; skipped=0; failed=0

for appdir in "$APPS"/*/*/; do
  [ -d "$appdir" ] || continue
  id="$(basename "$appdir")"
  lane="$(basename "$(dirname "$appdir")")"
  dest="$SITE/apps/$lane/$id"
  echo "=== $lane/$id ==="

  if [ -f "$appdir/package.json" ]; then
    kind="node"
    grep -q '"expo"' "$appdir/package.json" && kind="expo"
    if [ "$kind" = "node" ] && grep -q '"next"' "$appdir/package.json"; then kind="next"; fi
    if [ "$kind" = "node" ] && ! grep -q '"build"' "$appdir/package.json"; then
      echo "  no build script -> skip"; skipped=$((skipped+1)); continue
    fi

    ( cd "$appdir" || exit 1
      npm install --no-audit --no-fund --loglevel=error --registry=https://registry.npmjs.org/ >/tmp/npm.log 2>&1 || npm install --no-audit --no-fund --loglevel=error >>/tmp/npm.log 2>&1
      case "$kind" in
        expo) npx --yes expo export --platform web --output-dir dist >/tmp/build.log 2>&1 ;;
        next) npm run build >/tmp/build.log 2>&1 ;;
        *)    npm run build >/tmp/build.log 2>&1 ;;
      esac
    )

    if copy_out "$appdir" "$dest"; then
      echo "  built -> $lane/$id"; built=$((built+1))
    else
      echo "  build produced no static output"; tail -5 /tmp/build.log 2>/dev/null; failed=$((failed+1))
    fi
  elif [ -f "$appdir/index.html" ]; then
    mkdir -p "$dest"; cp -a "$appdir/." "$dest/"
    echo "  static -> $lane/$id"; built=$((built+1))
  else
    echo "  stub (no package.json/index.html) -> skip"; skipped=$((skipped+1))
  fi
done

# cockpit + static index
cp -a "$ROOT/web/." "$SITE/"
python3 "$ROOT/seed/ci_site.py" "$APPS" "$SITE" || true

echo "-----------------------------------------"
echo "built=$built skipped=$skipped failed=$failed"
echo "site contents:"; find "$SITE" -maxdepth 3 -name index.html | sed "s#$SITE#  #"
