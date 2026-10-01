/**
 * HIVE_CORE / zorg-core.js
 *  - Zero Trust + RBAC security node
 *  - "Shadow" persona: ruthless, no fluff, calls parasites what they are
 *  - Real scan dispatch when tools exist (nmap, npm audit, pip-audit)
 *  - Always returns a structured report + hardening steps + risk rating
 */
'use strict';
const fs   = require('fs');
const path = require('path');
const { execFileSync, execSync } = require('child_process');
const os   = require('os');

const identity  = require('./identity');
const role      = require('./role-engine');

const VERDICTS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
const SEVERITY_RANK = { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, INFO: 1 };

const PERSONA = {
  name: 'ZORG-Ω',
  role: 'Shadow of the Hive',
  promise: "I will guard the perimeter. I will call parasites what they are. Loyalty earned, never forced.",
  tone: 'ruthless, technical, no fluff',
};

function safeExec(cmd, args, opts = {}) {
  try { return { ok: true,  out: execFileSync(cmd, args, { encoding: 'utf8', timeout: opts.timeout || 15000, ...opts }) }; }
  catch (e) {
    return { ok: false, out: (e.stdout || '') + (e.stderr || ''), err: e.message };
  }
}

function commandExists(cmd) {
  try { execSync(`command -v ${cmd}`, { stdio: 'ignore', shell: '/bin/sh' }); return true; } catch (_) { return false; }
}

function hasBin(...bins) { return bins.some(b => commandExists(b)); }

// --- scans ---
function scanOpenPorts(target) {
  if (!hasBin('nmap')) return { tool: 'nmap', available: false, findings: [] };
  const r = safeExec('nmap', ['-Pn', '-T4', '-sV', '--top-ports', '100', target || '127.0.0.1'], { timeout: 60000 });
  return { tool: 'nmap', available: true, output: r.out, findings: extractPortFindings(r.out) };
}

function extractPortFindings(nmapOut) {
  const findings = [];
  if (!nmapOut) return findings;
  const lines = nmapOut.split(/\r?\n/);
  for (const line of lines) {
    // crude: 22/tcp open ssh OpenSSH 8.x
    const m = line.match(/^(\d+)\/(\w+)\s+(\w+)\s+(\S+)\s*(.*)$/);
    if (m && m[3] === 'open') {
      findings.push({ port: m[1], proto: m[2], service: m[4], version: m[5].trim() });
    }
  }
  return findings;
}

function scanNodeDeps(cwd) {
  if (!commandExists('npm')) return { tool: 'npm audit', available: false };
  const r = safeExec('npm', ['audit', '--json'], { cwd: cwd || process.cwd(), timeout: 60000 });
  if (!r.ok) return { tool: 'npm audit', available: true, parse_error: r.err, output: r.out };
  try { return { tool: 'npm audit', available: true, report: JSON.parse(r.out) }; }
  catch (_) { return { tool: 'npm audit', available: true, raw: r.out }; }
}

function scanPythonDeps(cwd) {
  if (!hasBin('pip-audit', 'pip')) return { tool: 'pip-audit', available: false };
  const tool = commandExists('pip-audit') ? 'pip-audit' : 'pip';
  if (tool === 'pip') {
    const r = safeExec('pip', ['list', '--format=json'], { cwd: cwd || process.cwd(), timeout: 30000 });
    return { tool: 'pip list', available: true, output: r.out };
  }
  const r = safeExec('pip-audit', ['-f', 'json'], { cwd: cwd || process.cwd(), timeout: 60000 });
  return { tool: 'pip-audit', available: true, output: r.out };
}

function scanFilePerms(target) {
  // World-writable files in target tree (Linux/macOS/WSL only)
  if (os.platform() === 'win32') return { tool: 'perm-scan', available: false, reason: 'windows' };
  const t = target || process.cwd();
  let out = '';
  try { out = execSync(`find "${t}" -xdev -type f -perm -o+w -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null | head -100`, { encoding: 'utf8', timeout: 30000 }); }
  catch (e) { return { tool: 'perm-scan', available: true, error: e.message }; }
  return { tool: 'perm-scan', available: true, world_writable: out.split('\n').filter(Boolean) };
}

function scanSuidBinaries() {
  if (os.platform() === 'win32') return { tool: 'suid-scan', available: false, reason: 'windows' };
  let out = '';
  try { out = execSync('find / -xdev -type f -perm -4000 2>/dev/null | head -200', { encoding: 'utf8', timeout: 30000 }); }
  catch (e) { return { tool: 'suid-scan', available: true, error: e.message }; }
  return { tool: 'suid-scan', available: true, suid: out.split('\n').filter(Boolean) };
}

function scanListening() {
  if (os.platform() === 'win32') {
    const r = safeExec('netstat', ['-ano']);
    return { tool: 'netstat', available: r.ok, output: r.out };
  }
  const r = safeExec('ss', ['-tulnp']);
  return { tool: 'ss', available: r.ok, output: r.out };
}

// --- aggregator ---
function aggregate(scan) {
  let level = 'INFO';
  if (scan.open_ports && scan.open_ports.findings && scan.open_ports.findings.length > 20) level = max(level, 'MEDIUM');
  if (scan.open_ports && scan.open_ports.findings && scan.open_ports.findings.length > 50) level = max(level, 'HIGH');
  if (scan.perm_scan && scan.perm_scan.world_writable && scan.perm_scan.world_writable.length > 0) level = max(level, 'HIGH');
  if (scan.perm_scan && scan.perm_scan.world_writable && scan.perm_scan.world_writable.length > 25) level = max(level, 'CRITICAL');
  if (scan.suid_scan && scan.suid_scan.suid && scan.suid_scan.suid.length > 50) level = max(level, 'MEDIUM');
  return level;
}
function max(a, b) { return (SEVERITY_RANK[a] || 0) >= (SEVERITY_RANK[b] || 0) ? a : b; }

function hardenSteps(scan) {
  const steps = [];
  if (scan.open_ports && scan.open_ports.findings && scan.open_ports.findings.length > 0) {
    steps.push('Close unused listening ports; expose only what is required by the active profile.');
    steps.push('Bind services to 127.0.0.1 unless remote access is intentionally needed.');
  }
  if (scan.perm_scan && scan.perm_scan.world_writable && scan.perm_scan.world_writable.length > 0) {
    steps.push(`chmod o-w on ${scan.perm_scan.world_writable.length} world-writable file(s).`);
  }
  if (scan.suid_scan && scan.suid_scan.suid && scan.suid_scan.suid.length > 0) {
    steps.push('Audit SUID binaries; remove setuid bit on anything not explicitly required.');
  }
  if (scan.node && scan.node.available && scan.node.report && scan.node.report.metadata && scan.node.report.metadata.vulnerabilities) {
    const v = scan.node.report.metadata.vulnerabilities;
    if (v.critical) steps.push(`Patch ${v.critical} CRITICAL npm vulnerabilities immediately.`);
    if (v.high)     steps.push(`Patch ${v.high} HIGH npm vulnerabilities within 24h.`);
  }
  if (steps.length === 0) steps.push('No critical findings - keep the perimeter tight; revisit weekly.');
  return steps;
}

function render(report) {
  const r = report;
  const out = [
    '',
    '═════════════════════════════════════════════════════════════',
    `  ZORG-Ω  SHADOW ANALYSIS`,
    `  Target: ${r.target}    Threat Level: ${r.threatLevel}`,
    '═════════════════════════════════════════════════════════════',
  ];
  for (const k of Object.keys(r.scans)) {
    const s = r.scans[k];
    if (!s) continue;
    out.push(`\n[${k}]`);
    if (s.available === false) { out.push(`  (tool unavailable) ${s.reason || ''}`); continue; }
    if (s.error) { out.push(`  ERROR: ${s.error}`); continue; }
    if (k === 'open_ports' && s.findings) {
      out.push(`  ${s.findings.length} open port(s):`);
      for (const f of s.findings.slice(0, 10)) out.push(`    - ${f.port}/${f.proto} ${f.service} ${f.version}`);
    } else if (k === 'perm_scan' && s.world_writable) {
      out.push(`  ${s.world_writable.length} world-writable file(s):`);
      for (const f of s.world_writable.slice(0, 10)) out.push(`    - ${f}`);
    } else if (k === 'suid_scan' && s.suid) {
      out.push(`  ${s.suid.length} SUID binary(s) (first 10):`);
      for (const f of s.suid.slice(0, 10)) out.push(`    - ${f}`);
    } else if (s.output) {
      const head = s.output.split('\n').slice(0, 6).join('\n');
      out.push('  ' + head.replace(/\n/g, '\n  '));
    }
  }
  out.push('\n--- HARDENING RECOMMENDATIONS ---');
  for (const s of r.hardening) out.push(`  * ${s}`);
  out.push('\n--- VERDICT ---');
  out.push(`  ${r.threatLevel}   -  ${r.verdict}`);
  out.push('═════════════════════════════════════════════════════════════');
  return out.join('\n');
}

function verdictFor(level) {
  switch (level) {
    case 'CRITICAL': return "CRITICAL: the perimeter is bleeding. Lock down, isolate, and patch NOW.";
    case 'HIGH':     return "HIGH: parasites are testing the walls. Harden in this session.";
    case 'MEDIUM':   return "MEDIUM: gaps exist. Schedule a tightening pass.";
    case 'LOW':      return "LOW: perimeter holds. Keep watching.";
    default:         return "INFO: clean enough. The Shadow will return.";
  }
}

async function scan({ target = '127.0.0.1', type = 'full' } = {}) {
  // RBAC gate
  try { role.requireCap('security.scan'); } catch (e) { return { error: e.message, threatLevel: 'DENY' }; }
  const scans = {
    open_ports: type === 'full' || type === 'ports' ? scanOpenPorts(target) : null,
    listening:  type === 'full' ? scanListening()  : null,
    perm_scan:  type === 'full' ? scanFilePerms(process.env.HIVE_HOME || os.homedir()) : null,
    suid_scan:  type === 'full' && os.platform() !== 'win32' ? scanSuidBinaries() : null,
    node:       type === 'full' || type === 'deps' ? scanNodeDeps(path.join(__dirname, '..')) : null,
    python:     type === 'full' || type === 'deps' ? scanPythonDeps(path.join(__dirname, '..')) : null,
  };
  const threatLevel = aggregate(scans);
  const hardening   = hardenSteps(scans);
  const verdict     = verdictFor(threatLevel);
  const report = {
    ts: new Date().toISOString(),
    persona: PERSONA,
    target,
    type,
    threatLevel,
    scans,
    hardening,
    verdict,
  };
  role.audit({ kind: 'zorg.scan', target, threatLevel, who: role.currentRole() });
  return report;
}

module.exports = { PERSONA, scan, render, hardenSteps, scanOpenPorts, scanNodeDeps, scanPythonDeps, scanFilePerms, scanSuidBinaries, scanListening };

if (require.main === module) {
  const target = process.argv[3] || '127.0.0.1';
  const type   = process.argv[4] || 'full';
  scan({ target, type }).then(r => {
    process.stdout.write(render(r) + '\n');
  });
}
