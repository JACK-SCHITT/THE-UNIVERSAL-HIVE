/**
 * HIVE_CORE / package-manager.js
 *  - cross-base package install + dependency resolution
 *  - dispatches to pkg / apt / emerge / pacman / apk / brew / winget
 *  - resolves dependencies from the local catalog (data/package-catalog.json)
 */
'use strict';
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { execSync, execFileSync } = require('child_process');

const identity = require('./identity');
const role     = require('./role-engine');

const CATALOG_PATH = path.join(__dirname, 'data', 'package-catalog.json');

function loadCatalog() {
  try { return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8')); }
  catch (_) { return { categories: {} }; }
}

function detectPkg() {
  if (process.env.TERMUX_VERSION || fs.existsSync('/data/data/com.termux')) return 'pkg';
  if (fs.existsSync('/etc/gentoo-release'))                                  return 'emerge';
  try { const r = fs.readFileSync('/etc/os-release','utf8'); if (/kali/i.test(r)) return 'apt'; } catch(_){}
  if (fs.existsSync('/etc/debian_version')) return 'apt';
  if (fs.existsSync('/etc/arch-release'))   return 'pacman';
  if (fs.existsSync('/etc/alpine-release')) return 'apk';
  if (os.platform() === 'darwin')           return 'brew';
  if (os.platform() === 'win32')            return 'winget';
  return 'unknown';
}

function resolve(packages) {
  const cat = loadCatalog();
  const allDeps = new Set();
  const queue = [...packages];
  const seen = new Set();
  while (queue.length) {
    const p = queue.shift();
    if (seen.has(p)) continue;
    seen.add(p);
    allDeps.add(p);
    // search across categories
    for (const catName of Object.keys(cat.categories || {})) {
      const list = cat.categories[catName] || [];
      for (const item of list) {
        if (typeof item === 'string' && item === p) { /* no deps */ }
        else if (item && item.name === p) {
          for (const d of (item.deps || [])) queue.push(d);
        }
      }
    }
  }
  return [...allDeps];
}

function shQuote(s) { return `'${String(s).replace(/'/g, `'\\''`)}'`; }

function install(packages, opts = {}) {
  // RBAC
  try { role.requireCap('package.install'); } catch (e) { return { ok: false, error: e.message }; }
  const pkg = opts.pkg || detectPkg();
  const resolved = resolve(packages);
  const log = [];
  const failures = [];
  for (const name of resolved) {
    if (opts.dryRun) { log.push(`[dry] ${pkg} install ${name}`); continue; }
    try {
      switch (pkg) {
        case 'pkg':    execFileSync('pkg',    ['install', '-y', name], { stdio: 'pipe', timeout: 120000 }); break;
        case 'apt':    execSync(`DEBIAN_FRONTEND=noninteractive apt-get install -y ${shQuote(name)}`, { stdio: 'pipe', timeout: 180000, shell: '/bin/sh' }); break;
        case 'emerge': execFileSync('emerge', ['--quiet', name],        { stdio: 'pipe', timeout: 600000 }); break;
        case 'pacman': execSync(`pacman -S --noconfirm ${shQuote(name)}`, { stdio: 'pipe', timeout: 180000, shell: '/bin/sh' }); break;
        case 'apk':    execFileSync('apk',    ['add', name],            { stdio: 'pipe', timeout: 120000 }); break;
        case 'brew':   execFileSync('brew',   ['install', name],        { stdio: 'pipe', timeout: 300000 }); break;
        case 'winget': execFileSync('winget', ['install', '--accept-package-agreements', '--accept-source-agreements', name], { stdio: 'pipe', timeout: 300000 }); break;
        default: failures.push({ name, err: `no handler for pkg manager: ${pkg}` }); continue;
      }
      log.push(`[ok]  ${name}`);
    } catch (e) {
      failures.push({ name, err: (e.stderr || e.stdout || e.message || '').toString().slice(0, 300) });
      log.push(`[err] ${name}`);
    }
  }
  role.audit({ kind: 'package.install', who: role.currentRole(), count: resolved.length, failures: failures.length, pkg });
  return { ok: failures.length === 0, pkg, resolved, failures, log };
}

function list() { return loadCatalog(); }

module.exports = { detectPkg, resolve, install, list, CATALOG_PATH };

if (require.main === module) {
  const args = require('minimist')(process.argv.slice(2));
  if (args.list) {
    const c = list();
    process.stdout.write(JSON.stringify(c, null, 2) + '\n');
  } else if (args.resolve) {
    process.stdout.write(JSON.stringify(resolve(String(args.resolve).split(',').filter(Boolean)), null, 2) + '\n');
  } else if (args.install) {
    const r = install(String(args.install).split(',').filter(Boolean), { dryRun: !!args.dryRun });
    process.stdout.write(JSON.stringify(r, null, 2) + '\n');
  } else {
    process.stderr.write('usage: package-manager.js [--list|--resolve p1,p2|--install p1,p2 [--dryRun]]\n');
    process.exit(2);
  }
}
