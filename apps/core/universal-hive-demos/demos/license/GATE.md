# License gate — demo

This is the legal call-home. Not a location beacon.

Real pattern, when you wire it later
  App sends the license key you issued.
  Your server says valid or revoked.
  Duplicate key gets flagged. Access stops.
  Critical logic stays on your server, so a ripped shell does nothing useful.

No key, the working controls are not on the shell.
Key HIVE-DEMO-001 opens one short session, then the shell locks again.
No server. No report file. No delete.

Architect: Kracker Jack
Repo: JACK-SCHITT/universal-hive
