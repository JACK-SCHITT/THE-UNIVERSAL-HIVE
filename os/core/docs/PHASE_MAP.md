# HIVE-OS Phase Map (1-4)

| Phase | Name | Runs on | Status tooling |
|-------|------|---------|----------------|
| 1 | Seed / Stage3 + DNA inject | Gentoo live USB / bare metal | `NEURAL/hive_install.sh` |
| 2 | Chroot soul bind | Inside chroot | `docs/PHASE2_CHROOT.md` |
| 3 | Kernel forge | Inside chroot | `NEURAL/kernel/kernel_prep.sh` |
| 4 | Identity + Aegis + world | Inside chroot / live node | `aegis_harden.start` + emerge @world |

## This Windows box cannot install bare-metal Gentoo safely from System32.

**Staging turf available:** WSL2 `kali-linux` (1TB free). Use it to:
- validate scripts (`bash -n`)
- host `~/THE_HIVE` mirror
- dry-run documentation path

**Real forge** requires: blank disk + Gentoo Stage3 ISO/live environment.

See `docs/PHASE3_WSL_STAGING.md` and `scripts/wsl_stage_hive.sh`.
