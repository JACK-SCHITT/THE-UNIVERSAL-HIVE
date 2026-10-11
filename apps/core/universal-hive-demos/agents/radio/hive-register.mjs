// RADIO AI — hive registration patch
// Drop into hive.js routeAgent() and call registerAgent("RADIO") at boot.
// Route returns a name. It does not launch the agent.

export function routeRadio(task) {
  const t = String(task || "").toLowerCase();
  if (
    t.includes("radio") ||
    t.includes("coax") ||
    t.includes("relay") ||
    t.includes("ptt") ||
    /\brf\b/.test(t) ||
    t.includes("transmit") ||
    t.includes("receive") ||
    t.includes("telemetry")
  ) {
    return "RADIO";
  }
  return null;
}

export const RADIO_AGENT = {
  name: "RADIO",
  version: "0.1.0",
  role: "station coax isolation",
  defaultState: "RECEIVE",
  layers: ["node", "python", "c", "coax"],
  capabilities: ["radio.status", "radio.receive", "radio.isolate", "radio.telemetry"],
  veto: ["jam", "spoof", "unlicensed-carrier", "pa-key"],
};

export function registerRadio(Hive) {
  Hive.registerAgent(RADIO_AGENT.name);
  Hive.sync({
    agents: { RADIO: RADIO_AGENT },
    capabilities: RADIO_AGENT.capabilities,
    settings: { radioDefault: "RECEIVE", radioPaKey: false },
  });
  return Hive.agents;
}
