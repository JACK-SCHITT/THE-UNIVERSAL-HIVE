/**
 * HIVE_CORE / identity.js
 *  - generates product key, constructs OS name, owns the identity file
 *  - $HIVE_HOME/identity.json is the single source of truth
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const crypto = require('crypto');

const HIVE_HOME_RAW = process.env.HIVE_HOME || path.join(os.homedir(), '.hive');
// Walk up to find identity.json if HIVE_HOME is wrong (portable / shim case)
function resolveHiveHome() {
  if (process.env.HIVE_HOME) return process.env.HIVE_HOME;
  // Try os.homedir() first
  if (fs.existsSync(path.join(HIVE_HOME_RAW, 'identity.json'))) return HIVE_HOME_RAW;
  // Try walking up from this file
  let d = path.dirname(__filename);
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(d, 'identity.json'))) return d;
    d = path.dirname(d);
  }
  return HIVE_HOME_RAW;
}
const HIVE_HOME     = resolveHiveHome();
const HIVE_CORE_DIR = process.env.HIVE_CORE     || path.join(HIVE_HOME, 'core');
const IDENTITY_FILE = process.env.HIVE_IDENTITY_FILE || path.join(HIVE_HOME, 'identity.json');
const ROLE_FILE     = path.join(HIVE_HOME, 'role');
const KEY_FILE      = path.join(HIVE_HOME, 'product_key');

const VERSION    = '7.0.0';
const CODENAME   = 'FULLEST-POTENTIAL';
const ARCHITECT  = 'KRACKERJACK1134';

const ROLE_TABLE = {
  'Architect':     255,
  'Administrator': 128,
  'User':          32,
};

function detectBase() {
  // Best-effort
  const plat = os.platform();
  if (process.env.TERMUX_VERSION || (fs.existsSync('/data/data/com.termux'))) return 'termux';
  if (fs.existsSync('/etc/gentoo-release'))                                  return 'gentoo';
  try { const r = fs.readFileSync('/etc/os-release', 'utf8'); if (/kali/i.test(r)) return 'kali'; } catch (_) {}
  if (fs.existsSync('/etc/debian_version'))                                  return 'debian';
  if (fs.existsSync('/etc/arch-release'))                                    return 'arch';
  if (fs.existsSync('/etc/alpine-release'))                                  return 'alpine';
  if (plat === 'darwin')                                                     return 'macos';
  if (plat === 'win32')                                                      return 'windows';
  if (plat === 'linux' && fs.existsSync('/proc/version') && /microsoft/i.test(fs.readFileSync('/proc/version', 'utf8'))) return 'wsl';
  return plat;
}

function genKey(seed = '') {
  const mix = [
    seed,
    os.hostname(),
    os.userInfo().username || '',
    fs.existsSync('/etc/machine-id') ? fs.readFileSync('/etc/machine-id', 'utf8').trim() : '',
    crypto.randomBytes(32).toString('hex'),
  ].join('|');
  const h = crypto.createHash('sha256').update(mix).digest('hex').slice(0, 16);
  return h.match(/.{4}/g).join('-');
}

function read() {
  try { return JSON.parse(fs.readFileSync(IDENTITY_FILE, 'utf8')); }
  catch (_) { return null; }
}

function write(obj) {
  fs.mkdirSync(path.dirname(IDENTITY_FILE), { recursive: true });
  fs.writeFileSync(IDENTITY_FILE, JSON.stringify(obj, null, 2));
  if (obj.role)     fs.writeFileSync(ROLE_FILE, obj.role);
  if (obj.product_key) fs.writeFileSync(KEY_FILE, obj.product_key);
  return obj;
}

function build({ user_name = 'KRACKERJACK', role = 'Architect', packages = [], base } = {}) {
  if (!ROLE_TABLE[role]) role = 'User';
  const rbac = ROLE_TABLE[role];
  const b = base || detectBase();
  const seed = `${user_name}|${role}|${b}|${os.hostname()}`;
  const key = genKey(seed);
  const os_name = `${user_name}'s ${role} HIVE OS - ${b} | Packages: ${packages.join(' ') || 'core'} | Key: ${key}`;
  return write({
    version: VERSION,
    codename: CODENAME,
    architect: ARCHITECT,
    user_name,
    role,
    rbac_level: rbac,
    base: b,
    pkg_manager: b === 'termux' ? 'pkg' : b === 'gentoo' ? 'emerge' : 'apt',
    product_key: key,
    os_name,
    packages,
    uname: `${os.type()} ${os.release()} ${os.arch()}`,
    arch: os.arch(),
    installed_at: new Date().toISOString(),
    hive_home: HIVE_HOME,
    hive_core: HIVE_CORE_DIR,
  });
}

function rotate() {
  const cur = read() || {};
  cur.product_key = genKey(`${cur.user_name || 'KRACKERJACK'}|${Date.now()}`);
  return write(cur);
}

function banner() {
  const id = read();
  if (!id) return '[HIVE] no identity yet';
  return [
    `+=============================================+`,
    `|  ${id.user_name}'s ${id.role} HIVE OS`,
    `|  base : ${id.base}  (pkg: ${id.pkg_manager})`,
    `|  key  : ${id.product_key}`,
    `|  os   : ${id.os_name}`,
    `|  arch : ${id.architect}  v${id.version} ${id.codename}`,
    `+=============================================+`,
  ].join('\n');
}

module.exports = { VERSION, CODENAME, ARCHITECT, ROLE_TABLE, detectBase, genKey, read, write, build, rotate, banner, IDENTITY_FILE, HIVE_HOME, HIVE_CORE_DIR };

if (require.main === module) {
  const cmd = process.argv[2] || 'show';
  if (cmd === 'show')   { const b = banner(); process.stdout.write(b + '\n'); }
  else if (cmd === 'build') {
    const args = require('minimist')(process.argv.slice(3));
    const id = build({
      user_name: args.name || 'KRACKERJACK',
      role:      args.role || 'Architect',
      packages:  String(args.packages || '').split(',').filter(Boolean),
      base:      args.base,
    });
    process.stdout.write(JSON.stringify(id, null, 2) + '\n');
  }
  else if (cmd === 'rotate') { process.stdout.write(JSON.stringify(rotate(), null, 2) + '\n'); }
  else { process.stderr.write('usage: identity.js [show|build|rotate]\n'); process.exit(2); }
}
