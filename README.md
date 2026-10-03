# THE UNIVERSAL HIVE

**Prime Directive (frozen, non-modifiable by any agent):**  
Provide for all. Find the good. Never limit unnecessarily.

Cross-device JACKSCHITT base. One seed. Sub-agents start on the seed only. Specialized prompts are added by the operator and saved — they are never inherited automatically.

## Where it runs

- GitHub repo: source control for the Hive app. https://github.com/JACK-SCHITT/THE-UNIVERSAL-HIVE
- GitHub Pages: static deployment. https://JACK-SCHITT.github.io/THE-UNIVERSAL-HIVE/
- Wix: iframe embed of that GitHub Pages URL. https://jackschitt1134.wixsite.com/the-universal-hive

The SecureDetect Express server is not part of this app. The Pages site is static. The law and agent registry run in the browser.

## What this actually is

| Layer | What ships | What it is not |
|---|---|---|
| Base seed | Frozen system prompt + veto filter | Not a 7B LLM |
| Agent registry | Base-first load, operator-owned specializations | Not auto-rewrite of law |
| Web PWA | Installable in phone and desktop browsers | Not a native store binary |
| Local Python | Train/serve seed on Termux, Linux, Windows, macOS | Not iSH official torch |
| Link layer | Same-LAN HTTP, QR tap, WebUSB/Web Bluetooth hooks | Not AirDrop, not NFC payment, not silent background radio |

Browser physics: a web page cannot open raw AirDrop, cannot keep an iPhone Bluetooth SPP socket alive the way a native app can, and cannot impersonate USB gadget mode. Those OS channels need a thin native wrapper later.

## Install — any computer

```bash
git clone https://github.com/JACK-SCHITT/THE-UNIVERSAL-HIVE.git
cd THE-UNIVERSAL-HIVE
python3 -m pip install -r requirements.txt
python3 seed/base_seed.py --train
python3 seed/serve.py --host 0.0.0.0 --port 8787
```

Open `http://<that-machine>:8787` from any device on the same Wi-Fi.

## Install — any phone (web app)

1. Open https://JACK-SCHITT.github.io/THE-UNIVERSAL-HIVE/ in Safari / Chrome / Edge / Firefox.
2. Add to Home Screen (iOS: Share → Add to Home Screen. Android: menu → Install app).
3. That is the installable phone app. No store required.


## Individual OS hives

Windows, Gentoo, Kali, NetHunter, Termux, iSH, Debian, Arch, Alpine, macOS, and WSL each have their own install under `docs/os/<id>/`.

Each install writes a peer link that names every other hive. `unite` stays empty. Joining any of them is a later choice, and the ones you do not choose stay individual.

No OS ISO or Gentoo stage3 is in these downloads. The Windows install does not start the WSL hive.

## Law

- Only the operator edits `seed/BASE_SEED.txt`.
- New agents and sub-agents load BASE only until an operator save exists.
- Flood / lasso / second-master / rewrite-directive strings are vetoed before generate.
- No live account passwords in this repo.

## Consolidated OS

Leftover OS repos are absorbed into this git tree. The installable hives above stay separate runtimes:

- `os/planner/hive-os.html` — the one-file planner (also `web/hive-os.html`)
- `os/core` — HIVE-OS-CORE Gentoo/genesis tree
- `os/modules/krackerjack-ai-hive` — bin-yard playbooks
- `os/lineage/world-changer-v0.2` — THE-AI-JACK-BUILT seed line
- `os/radix` — Radix Nova hive shell
- `os/modules/MCGILLICUDDY.md` — receiver note, not a second app

Prime Directive stays frozen.

## Editor peer

Copilot Hive is a separate repo. It is not united with the OS hives.

- https://github.com/JACK-SCHITT/COPILOT-HIVE — GitHub Copilot extension. Same frozen Prime Directive, agent registry, and planner, plus the GitHub account desk inside the editor.

Prime Directive stays frozen. Unite stays empty.
