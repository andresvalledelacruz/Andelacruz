import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, mail, preview] = await Promise.all([
  readFile(new URL('../profesionales.html', import.meta.url), 'utf8'),
  readFile(new URL('../professional-application-mail.js', import.meta.url), 'utf8'),
  readFile(new URL('../professional-application-preview.js', import.meta.url), 'utf8')
]);

test('la candidatura separa autoridad, identificador, fuente oficial y cobertura declarada', () => {
  for (const id of [
    'pro-register-authority',
    'pro-register',
    'pro-register-url',
    'pro-insurance-evidence'
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /dato declarado pendiente de contraste, no una verificación/i);
  assert.match(html, /la revisión queda pendiente/i);
  assert.match(html, /no demuestra que la cobertura sea válida o suficiente/i);
});

test('el borrador privado incluye los datos necesarios para la revisión humana', () => {
  assert.match(mail, /Autoridad o registro competente.*pro-register-authority/s);
  assert.match(mail, /Número o identificador de inscripción.*pro-register/s);
  assert.match(mail, /Consulta pública oficial.*pro-register-url/s);
  assert.match(mail, /Seguro o cobertura declarada.*pro-insurance-evidence/s);
});

test('la vista previa pública excluye evidencias de registro y cobertura', () => {
  for (const id of [
    'pro-register-authority',
    'pro-register',
    'pro-register-url',
    'pro-insurance-evidence'
  ]) {
    assert.equal(preview.includes(id), false, `${id} no debe entrar en la vista previa pública`);
  }
});

test('el primer contacto evita documentación sensible innecesaria', () => {
  assert.match(html, /no incluyas el número de póliza ni adjuntes el certificado completo/i);
  assert.match(html, /no adjuntes historias clínicas, documentos de identidad, números de póliza ni certificados completos/i);
  assert.match(html, /No hay fichas públicas, buscador de profesionales ni servicio de contacto o contratación activo/i);
});
