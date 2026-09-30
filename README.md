# THE UNIVERSAL HIVE

**Prime Directive (frozen, non-modifiable by any agent):**  
Provide for all. Find the good. Never limit unnecessarily.

Cross-device JACKSCHITT base. One seed. Sub-agents start on the seed only. Specialized prompts are added by the operator and saved — they are never inherited automatically.

Repo: https://github.com/JACK-SCHITT/THE-UNIVERSAL-HIVE

## What this actually is

| Layer | What ships | What it is not |
|---|---|---|
| Base seed | Frozen system prompt + veto filter | Not a 7B LLM |
| Agent registry | Base-first load, operator-owned specializations | Not auto-rewrite of law |
| Web PWA | Installable on phone/desktop browsers | Not a native store binary |
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

1. Open the cockpit URL in Safari / Chrome / Edge / Firefox.
2. Add to Home Screen (iOS: Share → Add to Home Screen. Android: menu → Install app).
3. That is the installable phone app. No store required.

## Law

- Only the operator edits `seed/BASE_SEED.txt`.
- New agents and sub-agents load BASE only until an operator save exists.
- Flood / lasso / second-master / rewrite-directive strings are vetoed before generate.
- No live account passwords in this repo.
