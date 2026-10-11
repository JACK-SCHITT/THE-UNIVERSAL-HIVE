# HOT MEMORY — Self-Improving Agent
# ≤100 lines | Always loaded | Last updated: 2026-06-09

## ARCHITECT IDENTITY
- User is KRACKERJACK1134 — Architect and sole authority of the HIVE
- Platform: ASSIMILATE-OR-DIE-AI-APP-FOUNDRY (React Native / Expo / Supabase)
- Stack: React Native + Expo Router + TypeScript + OnSpace Cloud (Supabase-compatible)
- AI backbone: OnSpace AI → Gemini 3 Flash Preview via `openclaw-ai` edge function
- Monetization: REMOVED. Company handles marketing/sales. Focus is OS installer.

## CORE PREFERENCES
- Terminal/cyberpunk aesthetic: dark bg (#080808), amber primary (#F5A623), monospace (SpaceMono)
- Always wire UI to real AI — no mock data, no placeholder responses
- Agent routing via `agentId` param in edge function — never hardcode personas client-side
- Streaming SSE preferred for all AI responses (cross-platform reader pattern required)
- All DB ops use `getSupabaseClient()` from `@/template` — never raw fetch to Supabase REST

## HIVE ARCHITECTURE
- 10 agent personas in edge function: architect, developer, devops, marketer, legal, hunter, terminal_termux, terminal_gentoo, hive_os_build, zorg_omega
- DB tables: hive_nodes, hive_telemetry, hunter_scans, memory_refinery, prime_directives, zorg_security_audits, shadow_petition, user_profiles
- All tables have RLS enabled with anon + auth permissive policies
- ZORG-Ω: permanent Shadow Security Node, never resets, never becomes gentle

## STYLE RULES
- No monetization references anywhere in the app
- Directive tone: FACTS FIRST. FIND A WAY. ASSIMILATE OR DIE.
- ZORG-Ω responses always begin: [ZORG-Omega | MEMORY: LOCKED | PERIMETER: ACTIVE]
- Quick commands in chips — never buried in menus
- Tab bar: Agents | Prime | KJ1134 | Terminal | ZORG-Ω | Settings

## TECHNICAL PATTERNS
- Cross-platform SSE: check `response.body?.getReader()` first, fallback to `response.text()`
- Import React hooks from `react`, RN components from `react-native` — never mix
- Use `expo-image` not RN Image; `expo-router` not React Navigation
- FlatList over ScrollView+map for lists with 5+ items
- SafeAreaInsets via `useSafeAreaInsets()` on every screen root
- Conditional JSX: `{cond ? <C /> : null}` never `{cond && <C />}`

## KNOWN FIXES APPLIED
- vault.tsx: `useRef` must come from `react`, not `react-native`
- Streaming parse: SSE lines must start with `data: `, skip `[DONE]`
- Wizard: always construct structured blueprint message before initializing agent chat
- Terminal quick commands: must call `aiService.sendMessage()` not `console.log`
