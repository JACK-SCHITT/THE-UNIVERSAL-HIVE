# Chapter 06 — Portage DNA for HIVE-OS

Hive injects `NEURAL/hive_make.conf` as `/etc/portage/make.conf` during seed plant.

## Principles

1. **Hardened-first** mindset; profile set in chroot per arch.
2. **OpenRC** init (stage3-*-openrc).
3. **Source builds** preferred; binary packages only when Architect authorizes.
4. **Minimal junk** — USE flags express intent, not fashion.
5. **Hive packages** (python, git, curl, vim, sudo) land early for brain + recovery.

## SPARC specifics

- Use **sparc / sparc64** profiles — never copy-paste amd64 profile numbers.
- Kernel: gentoo-sources + SPARC bootloader chapter from official handbook.
- Compile times are long; autonomy jobs should be nice'd and logged.

## After first boot

```bash
emerge --ask --verbose --update --deep --newuse @world
# only when Architect schedules the burn
```

## Handbook cross-links

- Official USE: `docs/handbook/gentoo-sparc/Handbook_SPARC__Working__USE.md`
- Official Portage: `...Working__Portage.md`
- Official Variables: `...Portage__Variables.md`
