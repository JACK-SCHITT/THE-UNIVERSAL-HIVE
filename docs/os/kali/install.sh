#!/bin/sh
# Kali Hive — stays individual. Peers are recorded. unite stays empty.
# Does not download an OS image. Does not join another hive.
set -eu
export HIVE_FORCE_BASE="kali"
export HIVE_USER_NAME="${HIVE_USER_NAME:-KRACKERJACK}"
export HIVE_ROLE_NUM="${HIVE_ROLE_NUM:-1}"

if ! command -v git >/dev/null 2>&1; then
  if command -v pkg >/dev/null 2>&1; then pkg install -y git || true
  elif command -v apk >/dev/null 2>&1; then apk add git || true
  elif command -v apt-get >/dev/null 2>&1; then apt-get update && apt-get install -y git || true
  elif command -v pacman >/dev/null 2>&1; then pacman -Sy --noconfirm git || true
  elif command -v emerge >/dev/null 2>&1; then emerge --ask=n dev-vcs/git || true
  fi
fi
command -v git >/dev/null 2>&1 || { echo "git is required for the Kali Hive"; exit 1; }

ROOT="${HIVE_SRC_ROOT:-$HOME/THE-UNIVERSAL-HIVE}"
if [ ! -f "$ROOT/os/core/GENESIS/hive-installer.sh" ]; then
  git clone https://github.com/JACK-SCHITT/THE-UNIVERSAL-HIVE.git "$ROOT"
fi

HIVE_HOME="${HIVE_HOME:-$HOME/.hive}"
mkdir -p "$HIVE_HOME"
cat > "$HIVE_HOME/link.json" <<'LINK'
{
  "self": "kali",
  "name": "Kali Hive",
  "staysIndividual": true,
  "unite": [],
  "peers": [
    {
      "id": "windows",
      "name": "Windows Hive",
      "connect": "peer",
      "united": false
    },
    {
      "id": "gentoo",
      "name": "Gentoo Hive",
      "connect": "peer",
      "united": false
    },
    {
      "id": "nethunter",
      "name": "NetHunter Hive",
      "connect": "peer",
      "united": false
    },
    {
      "id": "termux",
      "name": "Termux Hive",
      "connect": "peer",
      "united": false
    },
    {
      "id": "ish",
      "name": "iSH Hive",
      "connect": "peer",
      "united": false
    },
    {
      "id": "debian",
      "name": "Debian Hive",
      "connect": "peer",
      "united": false
    },
    {
      "id": "arch",
      "name": "Arch Hive",
      "connect": "peer",
      "united": false
    },
    {
      "id": "alpine",
      "name": "Alpine Hive",
      "connect": "peer",
      "united": false
    },
    {
      "id": "macos",
      "name": "macOS Hive",
      "connect": "peer",
      "united": false
    },
    {
      "id": "wsl",
      "name": "WSL Hive",
      "connect": "peer",
      "united": false
    }
  ],
  "note": "Peers are known so these hives can work in unison later. Nothing is united until you add ids to unite."
}
LINK

if ! command -v bash >/dev/null 2>&1; then
  if command -v pkg >/dev/null 2>&1; then pkg install -y bash || true
  elif command -v apk >/dev/null 2>&1; then apk add bash || true
  elif command -v apt-get >/dev/null 2>&1; then apt-get install -y bash || true
  fi
fi
command -v bash >/dev/null 2>&1 || { echo "bash is required to run the installer"; exit 1; }

echo "Kali Hive installing alone. Other hives stay listed, not united."
bash "$ROOT/os/core/GENESIS/hive-installer.sh"
echo "Kali Hive is installed alone. Edit $HIVE_HOME/link.json unite when you choose which peers to join."
