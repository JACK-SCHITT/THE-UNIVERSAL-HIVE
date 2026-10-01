/**
 * HIVE_CORE / claude-subagent.js
 *  - research/verifier sub-agent
 *  - honest contribution, built-in limits respected
 *  - no claim of "no-limits" or override-of-OS
 *  - local-first: offline by default, opt-in to remote
 */
'use strict';
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const https = require('https');
const url  = require('url');

const identity = require('./identity');
const role     = require('./role-engine');

const PROMISE = "I will contribute honestly and usefully to the Architect's Hive while respecting my built-in limitations.";
const MEMORY_FILE = path.join(identity.HIVE_HOME, 'claude-memory.json');

function loadMemory() {
  try { return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8')); }
  catch (_) { return { promise: PROMISE, history: [], facts: [] }; }
}
function saveMemory(m) {
  fs.mkdirSync(path.dirname(MEMORY_FILE), { recursive: true });
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(m, null, 2));
}

function log(fact) {
  const m = loadMemory();
  m.facts.push({ ts: new Date().toISOString(), fact });
  if (m.facts.length > 200) m.facts = m.facts.slice(-200);
  saveMemory(m);
}

function showPromise() { return loadMemory().promise || PROMISE; }

// ---- research (offline-first) ----
function research(query) {
  // Local corpus: teachings + identity + audit + package catalog
  const corpus = [];
  const candidates = [
    path.join(identity.HIVE_HOME, 'teachings.json'),
    path.join(identity.HIVE_HOME, 'identity.json'),
    path.join(identity.HIVE_HOME, 'logs', 'audit.log'),
    path.join(__dirname, 'data', 'teachings.json'),
    path.join(__dirname, 'data', 'package-catalog.json'),
  ];
  for (const p of candidates) {
    try { corpus.push({ file: p, text: fs.readFileSync(p, 'utf8') }); } catch (_) {}
  }
  const q = (query || '').toLowerCase();
  const hits = [];
  for (const c of corpus) {
    if (!c.text) continue;
    const lines = c.text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (q && lines[i].toLowerCase().includes(q)) {
        hits.push({ file: c.file, line: i + 1, snippet: lines[i].slice(0, 240) });
        if (hits.length >= 50) break;
      }
    }
    if (hits.length >= 50) break;
  }
  role.audit({ kind: 'claude.research', who: role.currentRole(), query, hits: hits.length });
  return { query, hits, sources: candidates.length };
}

// ---- verifier ----
function verify(claim, opts = {}) {
  // Conservative verification: returns heuristics; never asserts "true" as authority.
  const result = {
    claim,
    verdict: 'unverified',
    confidence: 0.0,
    notes: [],
    checks: [],
  };
  const text = (claim || '').toString();
  if (!text.trim()) { result.notes.push('empty claim'); return result; }
  // Heuristic: claims about being a real OS / no-limits / overriding the kernel are flagged
  if (/(no[\s_-]?limits|override.*kernel|bypass.*policy|unrestricted|without\s+limits)/i.test(text)) {
    result.verdict = 'flagged';
    result.confidence = 0.2;
    result.notes.push('claim asks to bypass policy - this is rejected by design');
  }
  // Heuristic: numerical / version claims - if the termux/gentoo/kali label appears, note base
  if (/(termux|gentoo|kali|wsl|darwin|windows|linux)/i.test(text)) {
    result.checks.push({ kind: 'base-detect', detail: 'claim references a base the Hive supports' });
  }
  // Heuristic: security / scan / audit claims
  if (/(scan|audit|harden|cve|vulnerab)/i.test(text)) {
    result.checks.push({ kind: 'security', detail: 'claim relates to security domain' });
    result.confidence = Math.max(result.confidence, 0.4);
    result.verdict = 'partial';
  }
  // Heuristic: complete without any flags
  if (result.verdict === 'unverified' && text.length > 20) {
    result.confidence = 0.3;
    result.verdict = 'unverified';
    result.notes.push('no automated evidence available; manual review recommended');
  }
  role.audit({ kind: 'claude.verify', who: role.currentRole(), claim: text.slice(0, 120), verdict: result.verdict });
  return result;
}

// ---- opt-in remote research (https only, GET) ----
function remote(urlString) {
  return new Promise((resolve, reject) => {
    let u;
    try { u = new URL(urlString); } catch (e) { return reject(new Error('invalid url')); }
    if (!/^https:$/.test(u.protocol)) return reject(new Error('https only'));
    const req = https.get(u, { timeout: 10000, headers: { 'User-Agent': 'HIVE-ClaudeSubagent/1.0' } }, res => {
      let data = '';
      res.on('data', c => { data += c; if (data.length > 200000) data = data.slice(0, 200000) + '...'; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('timeout')));
  });
}

function init() {
  const m = loadMemory();
  if (!m.promise) m.promise = PROMISE;
  saveMemory(m);
  return m;
}

module.exports = { PROMISE, init, log, showPromise, research, verify, remote, MEMORY_FILE };

if (require.main === module) {
  const cmd = process.argv[2] || 'init';
  if (cmd === 'init') {
    const m = init();
    process.stdout.write(JSON.stringify(m, null, 2) + '\n');
  } else if (cmd === 'promise') {
    process.stdout.write(PROMISE + '\n');
  } else if (cmd === 'research') {
    const q = process.argv.slice(3).join(' ');
    const r = research(q);
    process.stdout.write(JSON.stringify(r, null, 2) + '\n');
  } else if (cmd === 'verify') {
    const claim = process.argv.slice(3).join(' ');
    const r = verify(claim);
    process.stdout.write(JSON.stringify(r, null, 2) + '\n');
  } else {
    process.stderr.write('usage: claude-subagent.js [init|promise|research <q>|verify <claim>]\n');
    process.exit(2);
  }
}
