# RADIO AI — Python coordination layer
# Owns GPS / telemetry / logic. Never toggles pins itself.
# Sends one byte down the unix pipe: T isolate, R receive, S status.

import json
import os
import socket
import time

PIPE_PATH = os.environ.get("HIVE_RF_PIPE", "/tmp/hive_rf_bridge")
BIND = ("127.0.0.1", int(os.environ.get("RADIO_PY_PORT", "4771")))

# Operator gate. Isolation is allowed only when this is true AND
# telemetry says the station is local and idle receivers are safe to lift.
STATION = {
    "operator": False,
    "gps_fix": False,
    "lat": None,
    "lon": None,
    "mode": "RECEIVE",
    "pa_key": False,  # hard off. this layer cannot key a PA.
}


def trigger_hardware_sequence(mode: str) -> str:
    """Open the local pipe and send the fast flag to the C tier."""
    flag = {"TRANSMIT": b"T", "RECEIVE": b"R", "STATUS": b"S"}.get(mode)
    if flag is None:
        raise ValueError("bad mode")
    pipe = os.open(PIPE_PATH, os.O_WRONLY)
    try:
        os.write(pipe, flag)
    finally:
        os.close(pipe)
    STATION["mode"] = "TRANSMIT" if mode == "TRANSMIT" else "RECEIVE"
    return STATION["mode"]


def allow_isolate() -> tuple[bool, str]:
    if not STATION["operator"]:
        return False, "operator gate closed"
    if not STATION["gps_fix"]:
        return False, "no local fix — holding receive"
    if STATION["pa_key"]:
        return False, "pa key refused by constitution"
    return True, "isolate receivers"


def handle(msg: dict) -> dict:
    mode = str(msg.get("mode", "STATUS")).upper()
    if "operator" in msg:
        STATION["operator"] = bool(msg["operator"])
    if "gps_fix" in msg:
        STATION["gps_fix"] = bool(msg["gps_fix"])
        STATION["lat"] = msg.get("lat")
        STATION["lon"] = msg.get("lon")
    if mode == "STATUS":
        return {"ok": True, "station": STATION}
    if mode == "RECEIVE":
        try:
            trigger_hardware_sequence("RECEIVE")
        except Exception as e:
            return {"ok": False, "error": f"ipc {e}", "held": "RECEIVE"}
        return {"ok": True, "mode": "RECEIVE"}
    if mode == "TRANSMIT":
        ok, why = allow_isolate()
        if not ok:
            return {"ok": False, "error": why, "held": "RECEIVE"}
        try:
            trigger_hardware_sequence("TRANSMIT")
        except Exception as e:
            return {"ok": False, "error": f"ipc {e}", "held": "RECEIVE"}
        return {"ok": True, "mode": "TRANSMIT", "note": "receivers isolated, pa not keyed"}
    return {"ok": False, "error": "unknown mode", "held": "RECEIVE"}


def serve() -> None:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(BIND)
    sock.listen(4)
    print(f"RADIO python on {BIND[0]}:{BIND[1]} pipe={PIPE_PATH}", flush=True)
    while True:
        conn, _ = sock.accept()
        with conn:
            raw = b""
            while b"\n" not in raw:
                chunk = conn.recv(1024)
                if not chunk:
                    break
                raw += chunk
            try:
                msg = json.loads(raw.decode() or "{}")
            except json.JSONDecodeError:
                conn.sendall(b'{"ok": false, "error": "bad json"}\n')
                continue
            conn.sendall((json.dumps(handle(msg)) + "\n").encode())


if __name__ == "__main__":
    serve()
