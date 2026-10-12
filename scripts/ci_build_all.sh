#!/usr/bin/env bash
# Build every absorbed app in apps/<lane>/<id>/ into site/apps/<lane>/<id>/.
# Runs in GitHub Actions (fast network). Never fails the job on a single app.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="$ROOT/site"
APPS="$ROOT/apps"
export CI=1
export NODE_OPTIONS="--max-old-space-size=4096"
export EXPO_NO_TELEMETRY=1

rm -rf "$SITE"
mkdir -p "$SITE/apps"

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
# the reference and dies with ENOENT before bundling. We are not allowed to
# patch the app, so build it through a temp config that pins esbuild's compiler
# options (and so never reads the broken tsconfig), reusing the app's own SWC
# plugin and "@" alias from its node_modules.
build_blindman() {
  local appdir="$1"
  local cfg
  cfg="$(mktemp --suffix=.mjs /tmp/hive-vite-XXXXXX)"
  cat >"$cfg" <<'EOF'
import { createRequire } from "node:module";
import path from "node:path";

const appDir = process.env.HIVE_APP_DIR;
const require = createRequire(path.join(appDir, "package.json"));

let react = null;
try {
  const pkg = require("@vitejs/plugin-react-swc");
  react = pkg.default ?? pkg;
} catch {
  react = null;
}

export default {
  root: appDir,
  plugins: react ? [react()] : [],
  resolve: { alias: { "@": path.resolve(appDir, "src") } },
  esbuild: {
    tsconfigRaw: JSON.stringify({
      compilerOptions: {
        jsx: "react-jsx",
        target: "ES2020",
        module: "ESNext",
        moduleResolution: "bundler",
        useDefineForClassFields: false,
        allowJs: true,
        isolatedModules: true,
        skipLibCheck: true,
        strict: false,
      },
    }),
  },
};
EOF
  HIVE_APP_DIR="$appdir" \
    ./node_modules/.bin/vite build --config "$cfg" >/tmp/build.log 2>&1
  local rc=$?
  rm -f "$cfg"
  return $rc
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
      skipped=$((skipped+1)); continue
      ;;
  esac

  if [ -f "$appdir/package.json" ]; then
    kind="node"
    grep -q '"expo"' "$appdir/package.json" && kind="expo"
    if [ "$kind" = "node" ] && grep -q '"next"' "$appdir/package.json"; then kind="next"; fi
    if [ "$kind" = "node" ] && ! grep -q '"build"' "$appdir/package.json"; then
      echo "  no build script -> skip"; skipped=$((skipped+1)); continue
    fi

    ( cd "$appdir" || exit 1
      npm_install
      case "$lane/$id" in
        agents/blindman-ai) build_blindman "$appdir" ;;
        *)
          case "$kind" in
            expo) npx --yes expo export --platform web --output-dir dist >/tmp/build.log 2>&1 ;;
            next) npm run build >/tmp/build.log 2>&1 ;;
            *)    npm run build >/tmp/build.log 2>&1 ;;
          esac
          ;;
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
[ -d "$ROOT/docs" ] && { mkdir -p "$SITE/docs"; cp -a "$ROOT/docs/." "$SITE/docs/"; }
python3 "$ROOT/seed/ci_site.py" "$APPS" "$SITE" || true

echo "-----------------------------------------"
echo "built=$built skipped=$skipped failed=$failed"
echo "site contents:"; find "$SITE" -maxdepth 3 -name index.html | sed "s#$SITE#  #"
