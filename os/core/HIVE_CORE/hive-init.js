/**
 * HIVE_CORE / hive-init.js
 *  - Orchestrator. Boots the whole Hive in dependency order.
 *  - Called by `bin/hive` and the installer.
 */
'use strict';
const path = require('path');
const fs   = require('fs');

const identity = require('./identity');
const role     = require('./role-engine');
const zorg     = require('./zorg-core');
const claude   = require('./claude-subagent');
const teach    = require('./teaching-module');
const pm       = require('./package-manager');

async function boot() {
  const id = identity.read();
  const banner = [];
  banner.push('+=============================================+');
  banner.push('|   KRACKERJACK HIVE OS  -  v' + identity.VERSION + '  ' + identity.CODENAME);
  banner.push('|   Architect: ' + identity.ARCHITECT);
  if (id) {
    banner.push('|   User    : ' + id.user_name + '  (' + id.role + ', rbac ' + id.rbac_level + ')');
    banner.push('|   Base    : ' + id.base + '  (pkg: ' + id.pkg_manager + ')');
    banner.push('|   Key     : ' + id.product_key);
    banner.push('|   OS name : ' + id.os_name);
  } else {
    banner.push('|   (no identity yet - run the installer)');
  }
  banner.push('+=============================================+');
  return {
    banner: banner.join('\n'),
    identity: id,
    role: { current: role.currentRole(), caps: role.list() },
    agents: {
      zorg:   { name: zorg.PERSONA.name, role: zorg.PERSONA.role },
      claude: { name: 'Claude', promise: claude.PROMISE },
      teach:  { sayings: (teach.list().sayings || []).length },
    },
  };
}

function status() {
  const id = identity.read();
  return {
    installed: !!id,
    identity:  id,
    role:      { current: role.currentRole(), level: role.currentLevel() },
    audit:     (() => { try { return fs.statSync(role.AUDIT_PATH).size; } catch (_) { return 0; } })(),
    audit_path: role.AUDIT_PATH,
    refinery:  (() => { try { return JSON.parse(fs.readFileSync(path.join(identity.HIVE_HOME, 'refinery.json'), 'utf8')); } catch (_) { return null; } })(),
  };
}

module.exports = { boot, status };

if (require.main === module) {
  const cmd = process.argv[2] || 'boot';
  if (cmd === 'boot')   boot().then(r => process.stdout.write(JSON.stringify(r, null, 2) + '\n'));
  else if (cmd === 'status') process.stdout.write(JSON.stringify(status(), null, 2) + '\n');
  else { process.stderr.write('usage: hive-init.js [boot|status]\n'); process.exit(2); }
}
