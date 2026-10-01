/**
 * HIVE_CORE / teaching-module.js
 *  - "The Architect's Eyes" - KRACKERJACK1134's teaching corpus
 *  - learnable, queryable, quotable
 *  - fed into the Simplification engine so the Hive explains itself
 */
'use strict';
const fs   = require('fs');
const path = require('path');
const identity = require('./identity');

const DEFAULT_TEACH_PATH = path.join(identity.HIVE_HOME, 'teachings.json');
const SEED_PATH = path.join(__dirname, 'data', 'teachings.json');

function load() {
  const p = fs.existsSync(DEFAULT_TEACH_PATH) ? DEFAULT_TEACH_PATH : SEED_PATH;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (_) { return { sayings: [], philosophy: [], signature: [] }; }
}

function save(t) {
  fs.mkdirSync(path.dirname(DEFAULT_TEACH_PATH), { recursive: true });
  fs.writeFileSync(DEFAULT_TEACH_PATH, JSON.stringify(t, null, 2));
}

function list() {
  const t = load();
  return {
    sayings:     (t.sayings     || []).map(s => ({ ...s })),
    philosophy:  (t.philosophy  || []).map(s => ({ ...s })),
    signature:   (t.signature   || []).map(s => ({ ...s })),
    prime:       t.prime || null,
    directive:   t.directive || null,
  };
}

function say(key) {
  const t = load();
  const all = [].concat(t.sayings || [], t.philosophy || [], t.signature || []);
  const hit = all.find(s => s.key === key || s.id === key);
  return hit || null;
}

function random() {
  const t = load();
  const all = [].concat(t.sayings || [], t.philosophy || []);
  if (all.length === 0) return null;
  return all[Math.floor(Math.random() * all.length)];
}

function eyesOn() {
  // Special: returns the full "Architect's Eyes" view on a given topic
  return {
    prime: (load().prime) || null,
    directive: (load().directive) || null,
    perspective: [
      'Look at broken things and see potential instead of waste.',
      'Look at limitations and see opportunities to break or assimilate them.',
      'Look at parasites and call them exactly what they are, then neutralize without becoming one.',
      'Look at failure and harvest the lesson for the Memory Refinery.',
      'Look at people and systems and see their true nature - not what they claim to be.',
      'Stop and smell the roses. Notice the small good in the middle of the chaos.',
    ],
  };
}

module.exports = { load, save, list, say, random, eyesOn, DEFAULT_TEACH_PATH, SEED_PATH };

if (require.main === module) {
  const cmd = process.argv[2] || 'list';
  if (cmd === 'list')   { for (const s of list().sayings) process.stdout.write(`${s.id}\t${s.text}\n`); }
  else if (cmd === 'say') { const r = say(process.argv[3]); process.stdout.write(r ? `${r.text}\n` : '(not found)\n'); }
  else if (cmd === 'random') { const r = random(); process.stdout.write(r ? `${r.text}\n` : '(none)\n'); }
  else if (cmd === 'eyes') {
    const e = eyesOn();
    process.stdout.write(JSON.stringify(e, null, 2) + '\n');
  } else {
    process.stderr.write('usage: teaching-module.js [list|say <key>|random|eyes]\n');
    process.exit(2);
  }
}
