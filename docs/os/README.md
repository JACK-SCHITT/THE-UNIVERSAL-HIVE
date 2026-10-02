# Individual Hive OS downloads

Each directory is one hive. Installing it does not merge it with the others.

- `install.sh` or `install.ps1` forces that hive's base and writes `~/.hive/link.json`.
- `link.json` lists every other hive as a peer with `"united": false`.
- `unite` is an empty list. Add ids there later if you choose to join specific hives.
- No OS ISO, stage3 tarball, or NetHunter image is included.

Windows Hive does not start WSL. WSL Hive does not become the Windows hive.
Termux, NetHunter, and iSH are three different installs.
