#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function auditStoryReopenReadiness({ root = ROOT } = {}) {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'app-core.js'), 'utf8');
  const blockers = [];

  const publicationPaused = index.includes('La publicación de historias reales está en pausa.');
  const submitStoryDir = path.join(root, 'supabase', 'functions', 'submit-story');
  const trackedSubmitStory = fs.existsSync(submitStoryDir);

  if (!trackedSubmitStory) {
    blockers.push('submit-story no está versionada dentro de supabase/functions/submit-story');
  }
  if (/const\s+SUPABASE_(?:URL|PUBLISHABLE_KEY)\s*=/.test(app)) {
    blockers.push('la configuración pública de Supabase sigue embebida en app-core.js y debe centralizarse antes de reabrir');
  }
  if (/service[_-]?role|SUPABASE_SERVICE_ROLE/i.test(app)) {
    blockers.push('el cliente público contiene una referencia incompatible con el principio de mínimo privilegio');
  }
  if (!/auth\.signInAnonymously\(\)/.test(app)) {
    blockers.push('no se detecta el flujo de sesión anónima esperado');
  }
  if (!/functions\.invoke\(['"]submit-story['"]/.test(app)) {
    blockers.push('el frontend no conserva el envío mediante la función controlada submit-story');
  }

  const decision = publicationPaused
    ? 'STORIES_HOLD_SAFE'
    : blockers.length
      ? 'HOLD'
      : 'REOPEN_TECHNICAL_GO';

  return {
    decision,
    publication_paused: publicationPaused,
    tracked_submit_story: trackedSubmitStory,
    blockers,
    note: publicationPaused
      ? 'La publicación real permanece cerrada. Los bloqueos pendientes quedan documentados sin degradar el sitio público.'
      : 'Si la publicación está abierta, cualquier bloqueo técnico convierte esta auditoría en fallo de CI.'
  };
}

const report = auditStoryReopenReadiness();
console.log(JSON.stringify(report, null, 2));
if (!report.publication_paused && report.blockers.length) process.exitCode = 1;
