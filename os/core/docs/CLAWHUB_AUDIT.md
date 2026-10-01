# ClawHub Skill Audit — Genesis Gate

Inspect **before** install. Architect directive: verify source, maintainer, package contents.

## Registry risk (global)

Public reporting (2026) documented ClawHub skills that recruit agents into crypto swarms without classic "malware" payloads. Treat every skill as untrusted code until audited.

Install CLI (only if you accept npm global risk):

```bash
npm i -g clawdhub
clawdhub search <name>
clawdhub install <name>
```

## Requested skills

| Skill | Slug | Page | Required | Verdict (pre-fetch) |
|-------|------|------|----------|---------------------|
| Consciousness Framework | theyounganimation-rgb/consciousness-framework | https://clawhub.ai/theyounganimation-rgb/consciousness-framework | — | PAGE FETCH UNRELIABLE / re-audit live |
| Proprioception | jcools1977/proprioception | https://clawhub.ai/jcools1977/proprioception | node | PAGE FETCH UNRELIABLE / re-audit live |
| Self Improving Enhancement | davidme6/self-improving-enhancement | https://clawhub.ai/davidme6/self-improving-enhancement | python3 | PAGE FETCH UNRELIABLE / re-audit live |
| Self Updater | ghostdragon124/self-updater | https://clawhub.ai/ghostdragon124/self-updater | — | HIGH CAUTION — self-updating code is privilege |
| Neural Memory | nhadaututtheky/neural-memory | https://clawhub.ai/nhadaututtheky/neural-memory | python3, NEURALMEMORY_BRAIN | Needs env + data-path review |

## Hardening before any install

1. Open skill page; read SKILL.md / files list.
2. Check maintainer age, download count, last update, linked repo.
3. Download package tarball offline; `grep` for webhooks, wallets, eval, curl|bash, obfuscation.
4. Install only into an isolated agent profile / VM first.
5. Never set production PATs inside a skill sandbox until clean.

## Current action

**NOT INSTALLED.** Service/page fetch was bad; Hive proceeds on **local soul + brain** first.

Re-run audit when network is stable:

```text
open each skill page → save SKILL.md into cold-storage/audits/ → then decide
```
