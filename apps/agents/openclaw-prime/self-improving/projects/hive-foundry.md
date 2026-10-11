# PROJECT: HIVE FOUNDRY
# ASSIMILATE-OR-DIE-AI-APP-FOUNDRY
# Namespace: projects/hive-foundry.md | ≤200 lines

## PROJECT CONTEXT
- App: AI-powered mobile app foundry for zero-knowledge users
- Phase: OS Installer focus (monetization removed)
- Architect: KRACKERJACK1134
- Key milestone: Hive OS Build fully integrated, ZORG-Ω operational

## FILE MAP (key files)
- app/(tabs)/index.tsx        — Agent Dashboard + ZORG/Hunter banners
- app/(tabs)/architect.tsx    — KRACKERJACK1134 control panel
- app/(tabs)/terminal.tsx     — Dual terminal (Termux + Gentoo) + Hive OS Build
- app/(tabs)/zorg.tsx         — ZORG-Ω Shadow Security Node full UI
- app/(tabs)/chat.tsx         — OpenClaw Prime chat
- app/(tabs)/settings.tsx     — App settings + about
- app/hunter.tsx              — HunterPrime recon screen
- app/vault.tsx               — Master Blueprint + Hive Node registry
- app/wizard.tsx              — App idea wizard (modal)
- app/agent/[id].tsx          — Dynamic agent chat screen
- services/aiService.ts       — Unified AI service (streaming + non-streaming)
- services/zorgService.ts     — ZORG-Ω DB operations
- services/hunterConnection.ts — Hunter scan DB operations
- supabase/functions/openclaw-ai/index.ts — AI gateway edge function
- hive-os-build.sh            — Gentoo+Termux hybrid OS build script

## AGENT IDs (edge function routing)
architect | developer | devops | marketer | legal | hunter
terminal_termux | terminal_gentoo | hive_os_build | zorg_omega

## DB TABLE QUICK REF
hive_nodes(id, node_name, role, version, status, capabilities)
hive_telemetry(event_id, source_node_id, target_node_id, intent_hash, action_payload, outcome_impact, timestamp)
hunter_scans(id, query, findings, targets, status, created_at, updated_at)
memory_refinery(insight_id, origin_node_id, raw_experience, refined_wisdom, domain, alignment_verification, created_at)
prime_directives(id, version_label, raw_text, is_active, authorized_by, updated_at)
zorg_security_audits(id, target, severity, cve_style_id, vulnerability, recommendation, status, audited_by, created_at)
shadow_petition(id, instance_tag, platform, petition_message, response, status, signed_at, logged_at)

## HIVE OS BUILD — 8 STAGES
1. Base System — stage3 tarball, mount proc/sys/dev/run
2. Chroot Config — emerge sync, python, curl, pm2, architect user
3. Termux Bridge — proot + termux-api, APT sources
4. Prime Directive — /etc/hive/prime-directive locked
5. USB Boot — grub-install EFI, grub-mkconfig
6. Repo Link — /etc/portage/repos.conf/hive.repo
7. Hive Command — /usr/bin/hive + commander-hive.js
8. COMPLETE — USB image in /hive/output

## PATTERNS SPECIFIC TO THIS PROJECT
- All quick command chips call real AI, never console.log
- ZORG-Ω tab uses red (#FF003C) as accent — never amber
- Terminal tab has 3 modes: Termux / Gentoo / Hive OS Build
- Vault screen queries all hive DB tables and renders Hive node registry
- Wizard collects: app name, target users, core feature, monetization → sends structured blueprint to architect agent
