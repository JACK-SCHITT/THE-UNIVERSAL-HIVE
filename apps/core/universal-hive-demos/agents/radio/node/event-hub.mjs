// RADIO AI — Node event hub
// iPhone / Android / browser talk here. This process never touches pins.
// It forwards a mode word down the pipe to Python. Python owns the gate.

import net from "node:net";
import { spawn } from "node:child_process";

const PY_HOST = process.env.RADIO_PY_HOST || "127.0.0.1";
const PY_PORT = Number(process.env.RADIO_PY_PORT || 4771);
const LISTEN = Number(process.env.RADIO_HUB_PORT || 4770);

const ALLOWED = new Set(["REQUEST_BROADCAST", "REQUEST_RECEIVE", "STATUS"]);

function sendToPythonBridge(mode) {
  return new Promise((resolve, reject) => {
    const sock = net.connect(PY_PORT, PY_HOST, () => {
      sock.write(JSON.stringify({ mode, ts: Date.now() }) + "\n");
    });
    let buf = "";
    sock.on("data", (d) => { buf += d; });
    sock.on("end", () => {
      try { resolve(JSON.parse(buf || "{}")); }
      catch (e) { reject(e); }
    });
    sock.on("error", reject);
  });
}

export async function handleNetworkEvent(event) {
  if (!event || !ALLOWED.has(event.action)) {
    return { ok: false, error: "unknown action", held: "RECEIVE" };
  }
  if (event.action === "STATUS") {
    return sendToPythonBridge("STATUS");
  }
  if (event.action === "REQUEST_RECEIVE") {
    return sendToPythonBridge("RECEIVE");
  }
  // REQUEST_BROADCAST is isolation, not a carrier key.
  if (event.operator !== true) {
    return { ok: false, error: "operator gate closed", held: "RECEIVE" };
  }
  console.log("network requested isolate. forwarding.");
  return sendToPythonBridge("TRANSMIT");
}

function startHub() {
  const server = net.createServer((sock) => {
    let buf = "";
    sock.on("data", async (d) => {
      buf += d;
      if (!buf.includes("\n")) return;
      const line = buf.split("\n")[0];
      buf = "";
      let event;
      try { event = JSON.parse(line); }
      catch { sock.end(JSON.stringify({ ok: false, error: "bad json" }) + "\n"); return; }
      const result = await handleNetworkEvent(event).catch((e) => ({ ok: false, error: String(e.message || e) }));
      sock.end(JSON.stringify(result) + "\n");
    });
  });
  server.listen(LISTEN, "127.0.0.1", () => {
    console.log("RADIO hub on 127.0.0.1:" + LISTEN);
  });
  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.env.RADIO_SPAWN_PY === "1") {
    spawn("python3", ["python/coordinator.py"], { stdio: "inherit" });
  }
  startHub();
}

export { startHub };
