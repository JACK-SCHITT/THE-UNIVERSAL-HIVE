# BIN YARD directive

Architect: KRACKERJACK1134
Module: bin-yard
Status: active

## Mission

Take incoming surplus HID (keyboards, mice, combos) and route each unit to a known family so later operators do not repeat the same bench hassle.

## Hard limits

- Do not scan or replay proprietary 2.4 GHz HID traffic.
- Do not impersonate a missing USB receiver.
- Do not advertise a generic 2.4 GHz unit as working if the original nano is gone.

## Recovery order

1. Wired USB — test, list.
2. Bluetooth mark — pair in OS settings, list.
3. Logitech Unifying (orange star) — genuine Unifying receiver + official software.
4. Logitech Bolt — genuine Bolt receiver only.
5. Microsoft / other brand 2.4 — official stick for that printed model.
6. Generic 2.4, empty slot — parts.
7. Infrared window — parts.

## Local bench

On the shop PC: Windows Bluetooth add-device, Logitech Options / Options+ / Unifying, Device Manager for wired. Chrome or Edge can open a Bluetooth chooser. Proprietary nanos will not appear there. That is the test.
