# Chapter 05 — Autonomy Services

Services that make HIVE-OS an **autonomous AI OS** on top of Gentoo/OpenRC.

## Core daemons / jobs (target design)

| Name | Role | Default |
|------|------|---------|
| `hive-link` | Local brain (Ollama → offline sovereign; cloud never required) | on-demand or user socket |
| `self-upgrade` | Free refresh of models, handbook, seeds, DNA | Architect-scheduled |
| `krackerjack-first` | First-contact CLI + motd | login / local.d |
| `aegis_harden` | local.d shield | OpenRC local |
| `hive-portage-watch` | optional world update planner | disabled until authorized |
| `hive-heal` | log triage + suggest emerges | optional |

## Autonomy rules

1. No service formats disks.
2. No service ships secrets off-box without Architect key policy.
3. Overnight `@world` only after explicit enable.
4. All services log under `/var/log/hive/` on live nodes.

## War room autonomy (this Windows node)

Even before bare metal:

- Handbook offline → KRACKERJACK answers install questions without net.
- Assimilate script keeps GENESIS honest.
- `hive_link.py` / `first_contact.py` are the cognitive loop.

## SPARC note

On real SPARC hardware, prefer local Ollama only if feasible; otherwise Hive-Link over network to Architect-approved endpoints. Autonomy ≠ mandatory cloud.
