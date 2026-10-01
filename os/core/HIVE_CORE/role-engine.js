/**
 * HIVE_CORE / role-engine.js
 *  - RBAC: Architect (255) | Administrator (128) | User (32)
 *  - gates every action through policy()
 *  - default-deny on unknown / unassigned
 *  - 'no-limits' is rejected on principle: every action is auditable + signed
 */
'use strict';
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const identity = require('./identity');

const ROLES = {
  Architect:     { level: 255, label: 'Architect (full sovereign)' },
  Administrator: { level: 128, label: 'Administrator (elevated)'   },
  User:          { level: 32,  label: 'User (standard)'            },
};

// Action capability table
const CAPS = {
  'system.install':          ['Architect',     'Administrator'],
  'system.assimilate':       ['Architect'],
  'system.update':           ['Architect',     'Administrator', 'User'],
  'system.self_evolve':      ['Architect'],
  'security.scan':           ['Architect',     'Administrator', 'User'],
  'security.harden':         ['Architect',     'Administrator'],
  'security.lockdown':       ['Architect'],
  'package.install':         ['Architect',     'Administrator', 'User'],
  'package.remove':          ['Architect',     'Administrator'],
  'package.resolve':         ['Architect',     'Administrator', 'User'],
  'teach.list':              ['Architect',     'Administrator', 'User'],
  'teach.say':               ['Architect',     'Administrator', 'User'],
  'teach.eyes':              ['Architect',     'Administrator', 'User'],
  'subagent.research':       ['Architect',     'Administrator', 'User'],
  'subagent.verify':         ['Architect',     'Administrator', 'User'],
  'identity.rotate_key':     ['Architect',     'Administrator'],
  'identity.rebuild':        ['Architect'],
  'cockpit.start':           ['Architect',     'Administrator', 'User'],
  'log.read':                ['Architect',     'Administrator', 'User'],
  // explicit non-allowlist - always denied:
  'abuse.unrestricted':      [],
  'system.destroy_evidence': [],
  'system.disable_audit':    [],
};

const AUDIT_PATH = path.join(identity.HIVE_HOME, 'logs', 'audit.log');
function audit(entry) {
  try {
    fs.mkdirSync(path.dirname(AUDIT_PATH), { recursive: true });
    fs.appendFileSync(AUDIT_PATH, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
  } catch (_) {}
}

function currentRole() {
  const id = identity.read();
  return (id && id.role) || 'User';
}
function currentLevel() {
  const r = currentRole();
  return (ROLES[r] && ROLES[r].level) || 0;
}

function can(action, who) {
  const role = who || currentRole();
  const allowed = CAPS[action];
  if (!allowed) return false;        // default-deny
  return allowed.includes(role);
}

function requireCap(action, who) {
  if (!can(action, who)) {
    audit({ kind: 'deny', action, who: who || currentRole(), reason: 'capability-not-granted' });
    const err = new Error(`DENIED: role '${who || currentRole()}' lacks capability '${action}'`);
    err.code = 'EHIVE_DENY';
    throw err;
  }
  return true;
}

// 'no-limits' guard -- any call that asks to bypass policy is rejected
function bypassGuard(action) {
  if (typeof action === 'string' && /(unrestricted|bypass|disable_audit|nolimit|without[_-]?limits)/i.test(action)) {
    audit({ kind: 'deny', action, who: currentRole(), reason: 'no-limits-bypass-attempt' });
    const err = new Error("DENIED: 'no-limits' is a parasite's request. The Hive does not bypass policy.");
    err.code = 'EHIVE_NOLIMIT';
    throw err;
  }
}

function list() {
  return Object.keys(CAPS).sort();
}
function roleInfo(role) {
  return ROLES[role] || null;
}

// Lightweight signed action envelope (HMAC over identity key).  Audit-only;
// HMAC key is derived locally, not a security boundary on its own.
function signAction(action, payload) {
  const id = identity.read() || {};
  const seed = (id.product_key || 'no-key') + ':' + process.pid;
  const h = crypto.createHmac('sha256', seed).update(JSON.stringify({ action, payload, ts: Date.now() })).digest('hex');
  return { action, payload, sig: h, ts: Date.now(), who: currentRole() };
}

module.exports = { ROLES, CAPS, can, requireCap, bypassGuard, currentRole, currentLevel, list, roleInfo, signAction, audit, AUDIT_PATH };

if (require.main === module) {
  const cmd = process.argv[2] || 'list';
  if (cmd === 'list') {
    for (const c of list()) console.log(`${c}\t-> ${CAPS[c].join(',') || 'DENIED'}`);
  } else if (cmd === 'check') {
    const action = process.argv[3];
    const who    = process.argv[4] || currentRole();
    console.log(JSON.stringify({ action, who, can: can(action, who) }));
  } else if (cmd === 'who') {
    console.log(`${currentRole()}  level=${currentLevel()}`);
  } else {
    process.stderr.write('usage: role-engine.js [list|check <action> [who]|who]\n');
    process.exit(2);
  }
}
