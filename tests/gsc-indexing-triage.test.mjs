import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, writeFileSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const script = 'scripts/gsc_indexing_triage.py';

function run(csv, args = []) {
  const dir = mkdtempSync(join(tmpdir(), 'gsc-triage-'));
  const source = join(dir, 'export.csv');
  const output = join(dir, 'report.json');
  writeFileSync(source, csv, 'utf8');
  const result = spawnSync('python3', [script, source, '--output', output, ...args], {encoding: 'utf8'});
  return {result, output, report: existsSync(output) ? JSON.parse(readFileSync(output, 'utf8')) : null};
}

test('agrupa una exportación española sin escribir las URL individuales', () => {
  const {result, report, output} = run('\ufeffPágina,Motivo,Estado\nhttps://desgracias.es/a,Descubierta,No iniciada\nhttps://desgracias.es/a/,Descubierta,No iniciada\nhttps://www.desgracias.es/b?x=1,Alternativa,Iniciada\nhttps://example.com/fuera,Excluida,No iniciada\nno-es-url,Inválida,No iniciada\n', ['--expected', '2']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(report.valid_unique_property_urls, 2);
  assert.equal(report.duplicate_urls, 1);
  assert.equal(report.other_property_urls, 1);
  assert.equal(report.invalid_urls, 1);
  assert.equal(report.expected_count_matches, true);
  assert.deepEqual(report.reasons, {Alternativa: 1, Descubierta: 1});
  const serialized = readFileSync(output, 'utf8');
  assert.doesNotMatch(serialized, /desgracias\.es\/a|desgracias\.es\/b|example\.com/);
});

test('tolera cabeceras opcionales ausentes y columnas sobrantes sin filtrar valores', () => {
  const {result, report} = run('URL\nhttps://desgracias.es/uno,celda sobrante\n');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(report.reasons, {'Not supplied': 1});
  assert.deepEqual(report.statuses, {'Not supplied': 1});
});

test('rechaza exportaciones sin columna URL y no crea un informe engañoso', () => {
  const {result, report} = run('Motivo,Estado\nDescubierta,No iniciada\n');
  assert.equal(result.status, 2);
  assert.equal(report, null);
  assert.match(result.stderr, /Missing URL\/Page\/Página column/);
});

test('rechaza recuentos esperados negativos', () => {
  const {result, report} = run('URL\nhttps://desgracias.es/uno\n', ['--expected', '-1']);
  assert.equal(result.status, 2);
  assert.equal(report, null);
  assert.match(result.stderr, /Expected count must be zero or greater/);
});
