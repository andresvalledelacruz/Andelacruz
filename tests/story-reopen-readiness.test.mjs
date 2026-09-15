import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditStoryReopenReadiness } from '../scripts/audit-story-reopen-readiness.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('la publicación real permanece cerrada aunque existan tareas Supabase pendientes', () => {
  const report = auditStoryReopenReadiness({ root: ROOT });
  assert.equal(report.publication_paused, true);
  assert.equal(report.decision, 'STORIES_HOLD_SAFE');
  assert.ok(report.blockers.length >= 1, 'los requisitos pendientes deben quedar explícitos antes de reabrir');
});

test('quitar el HOLD sin resolver backend/configuración convierte la auditoría en HOLD', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'story-reopen-'));
  try {
    await cp(ROOT, root, {
      recursive: true,
      filter(source) {
        const relative = path.relative(ROOT, source);
        return relative !== '.git' && relative !== 'node_modules';
      }
    });
    const file = path.join(root, 'index.html');
    const html = await readFile(file, 'utf8');
    await writeFile(file, html.replace('La publicación de historias reales está en pausa.', 'La publicación de historias reales está disponible.'));
    const report = auditStoryReopenReadiness({ root });
    assert.equal(report.publication_paused, false);
    assert.equal(report.decision, 'HOLD');
    assert.ok(report.blockers.length >= 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
