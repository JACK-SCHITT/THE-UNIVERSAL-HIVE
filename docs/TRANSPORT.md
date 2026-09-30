# Transport truth table

| Channel | Browser / PWA | Python node | Native wrapper later |
|---|---|---|---|
| HTTPS / LAN Wi-Fi | yes | serve.py 0.0.0.0 | — |
| Add to Home Screen | yes | — | store wrappers optional |
| QR / tap-to-open URL | yes | prints URL | — |
| USB tethering then LAN | yes (OS does the cable) | yes | — |
| WebUSB | permission + hook | serial optional | yes |
| Web Bluetooth GATT | permission + hook | bleak optional | yes |
| AirDrop | no web API | no | iOS share sheet only |
| Wi-Fi Direct | no reliable web API | OS tools | Android nearby |
| NFC tap | Web NFC on some Android Chrome only | no | yes |

Do not store account passwords in this repo to keep a session alive forever.
