/**
 * HIVE_CORE / simplification-engine.js
 *  - Core directive: "Complexity Hidden, Power Delivered."
 *  - Translates natural-language requests into chained Hive actions
 *  - Defaults to "easy mode" for User role; surfaces controls for higher roles
 */
'use strict';
const identity = require('./identity');
const role     = require('./role-engine');
const teach    = require('./teaching-module');

const NL_RULES = [
  { match: /(make|harden|secure|lock).*(system|machine|host)/i,
    plan: () => [
      { action: 'security.scan',   args: { target: '127.0.0.1', type: 'full' } },
      { action: 'security.harden', args: {} },
      { action: 'security.scan',   args: { target: '127.0.0.1', type: 'ports' } },
    ],
    summary: 'Hardening the perimeter. ZORG-Ω will scan, then harden, then re-scan.' },
  { match: /(update|upgrade).*(system|everything|all)/i,
    plan: () => [
      { action: 'system.update',   args: {} },
      { action: 'refinery.run',    args: {} },
    ],
    summary: 'Updating everything. Hive will check upstream; if upstream fails, the Refinery will synthesize a custom update.' },
  { match: /(install|add).*(\S+)/i,
    plan: (text, m) => {
      const pkg = m[2];
      return [
        { action: 'package.resolve',  args: { packages: pkg } },
        { action: 'package.install',  args: { packages: pkg } },
      ];
    },
    summary: 'Installing - the Hive will resolve dependencies first, then install.' },
  { match: /(teach|architect|eyes|wisdom|quote|krackerjack)/i,
    plan: () => [
      { action: 'teach.random', args: {} },
      { action: 'teach.eyes',   args: {} },
    ],
    summary: 'Opening the Architect\'s Eyes. A saying + the perspective will be returned.' },
  { match: /(research|find|look up|verify).*(\S.+)/i,
    plan: (text, m) => {
      const q = m[2];
      return [
        { action: 'subagent.research', args: { query: q } },
        { action: 'subagent.verify',   args: { claim: q } },
      ];
    },
    summary: 'Researching. Claude sub-agent will search the local corpus and verify the claim.' },
  { match: /(who am i|identity|status|whoami)/i,
    plan: () => [{ action: 'identity.show', args: {} }],
    summary: 'Showing your identity.' },
];

function match(text) {
  for (const r of NL_RULES) {
    const m = r.match.exec(text || '');
    if (m) return { rule: r, match: m };
  }
  return null;
}

function plan(text) {
  const id = identity.read() || {};
  const who = (id.role) || 'User';
  const easy = who === 'User';
  const m = match(text);
  if (!m) {
    return {
      easy,
      who,
      summary: "I don't have a specific plan for that yet. I can: secure the system, install packages, update everything, teach, or research.",
      plan: easy ? [] : [
        { action: 'help.catalog', args: {} },
      ],
    };
  }
  return { easy, who, summary: m.rule.summary, plan: m.rule.plan(text, m.match) };
}

async function runStep(step) {
  // The "steps" are descriptions, not direct calls into the host OS.
  // Each step returns a JSON-serializable result so the user can see what happened.
  const id = identity.read() || {};
  switch (step.action) {
    case 'security.scan': {
      const zorg = require('./zorg-core');
      const r = await zorg.scan(step.args);
      return { action: step.action, result: { threatLevel: r.threatLevel, hardening_count: (r.hardening || []).length, report: r } };
    }
    case 'security.harden': {
      // Don't execute hardening directly - produce a hardening checklist instead.
      return { action: step.action, result: { note: 'Hardening checklist produced. Review and apply deliberately.', roles: role.list() } };
    }
    case 'system.update': {
      const ref = require('./refinery');
      return ref.run({ sources: ['https://distfiles.gentoo.org', 'https://packages.termux.dev'] });
    }
    case 'refinery.run': {
      const ref = require('./refinery');
      return ref.run({ sources: [] });
    }
    case 'package.resolve': {
      const pm = require('./package-manager');
      return { action: step.action, result: pm.resolve(String(step.args.packages).split(/\s+/).filter(Boolean)) };
    }
    case 'package.install': {
      const pm = require('./package-manager');
      const r = pm.install(String(step.args.packages).split(/\s+/).filter(Boolean), { dryRun: true });
      return { action: step.action, result: r };
    }
    case 'teach.random': {
      const s = teach.random();
      return { action: step.action, result: s };
    }
    case 'teach.eyes': {
      return { action: step.action, result: teach.eyesOn() };
    }
    case 'subagent.research': {
      const c = require('./claude-subagent');
      return { action: step.action, result: c.research(step.args.query) };
    }
    case 'subagent.verify': {
      const c = require('./claude-subagent');
      return { action: step.action, result: c.verify(step.args.claim) };
    }
    case 'identity.show': {
      return { action: step.action, result: identity.banner() };
    }
    case 'help.catalog': {
      return { action: step.action, result: { capabilities: role.list() } };
    }
    default:
      return { action: step.action, result: { note: 'no handler' } };
  }
}

async function execute(text) {
  const p = plan(text);
  const results = [];
  for (const step of p.plan) {
    try {
      const r = await runStep(step);
      results.push(r);
    } catch (e) {
      results.push({ action: step.action, error: e.message, code: e.code });
    }
  }
  return { plan: p, results };
}

module.exports = { plan, execute, runStep, NL_RULES };

if (require.main === module) {
  const args = require('minimist')(process.argv.slice(2));
  if (args.plan) {
    const p = plan(String(args.plan));
    process.stdout.write(JSON.stringify(p, null, 2) + '\n');
  } else if (args.execute) {
    execute(String(args.execute)).then(r => process.stdout.write(JSON.stringify(r, null, 2) + '\n'));
  } else {
    process.stderr.write('usage: simplification-engine.js [--plan text|--execute text]\n');
    process.exit(2);
  }
}
