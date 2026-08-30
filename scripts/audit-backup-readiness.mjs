#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFileSync } from 'node:child_process';

const REQUIRED_DOC = 'BACKUP_DR_BUSINESS_CONTINUITY.md';
const REQUIRED_WORKFLOWS = [
  '.github/workflows/quality-gate.yml',
  '.github/workflows/seo-integrity.yml'
];

async function exists(path) {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

export async function auditBackupReadiness({ env = process.env } = {}) {
  const checks = [];
  const add = (id, ok, detail, severity = 'error') => checks.push({ id, ok, detail, severity });

  add('git_repository', Boolean(git(['rev-parse', '--is-inside-work-tree'])), 'repository is a Git work tree');
  const headSha = git(['rev-parse', 'HEAD']);
  add('head_sha', /^[0-9a-f]{40}$/.test(headSha), headSha);

  add('backup_policy', await exists(REQUIRED_DOC), `${REQUIRED_DOC} is readable`);
  for (const workflow of REQUIRED_WORKFLOWS) {
    add(`workflow:${workflow}`, await exists(workflow), `${workflow} is readable`);
  }

  if (await exists(REQUIRED_DOC)) {
    const policy = await readFile(REQUIRED_DOC, 'utf8');
    for (const marker of ['3-2-1', 'Restore Drill', 'RPO', 'RTO', 'Pendiente de Andrés']) {
      add(`policy_marker:${marker}`, policy.includes(marker), `policy contains ${marker}`);
    }
  }

  let remotes = [];
  try {
    remotes = git(['remote', '-v']).split('\n').filter(Boolean);
  } catch {
    remotes = [];
  }
  const remoteNames = [...new Set(remotes.map((line) => line.split(/\s+/)[0]).filter(Boolean))];
  add('git_remote', remoteNames.length > 0, `configured remotes: ${remoteNames.join(', ') || 'none'}`);
  add(
    'independent_backup_target',
    Boolean(env.BACKUP_INDEPENDENT_TARGET),
    env.BACKUP_INDEPENDENT_TARGET ? 'independent backup target declared' : 'BACKUP_INDEPENDENT_TARGET is not configured',
    'warning'
  );
  add(
    'restore_drill_evidence',
    Boolean(env.BACKUP_LAST_RESTORE_DRILL),
    env.BACKUP_LAST_RESTORE_DRILL ? `restore drill evidence: ${env.BACKUP_LAST_RESTORE_DRILL}` : 'BACKUP_LAST_RESTORE_DRILL is not configured',
    'warning'
  );

  const errors = checks.filter((check) => !check.ok && check.severity === 'error');
  const warnings = checks.filter((check) => !check.ok && check.severity === 'warning');
  return {
    ok: errors.length === 0,
    status: errors.length ? 'fail' : warnings.length ? 'ready-with-human-pending' : 'ready',
    head_sha: headSha,
    checks,
    errors: errors.length,
    warnings: warnings.length
  };
}

const isCli = process.argv[1] && new URL(import.meta.url).pathname === process.argv[1];
if (isCli) {
  auditBackupReadiness()
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      if (!result.ok) process.exitCode = 1;
    })
    .catch((error) => {
      process.stderr.write(`Backup readiness audit failed: ${error.message}\n`);
      process.exitCode = 1;
    });
}
