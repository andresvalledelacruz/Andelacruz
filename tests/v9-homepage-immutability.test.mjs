import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Andrés autorizó el 2026-09-15 la simplificación de cabecera, SEO/trust y consolidación CSS de esta tanda.
const APPROVED_V9_INDEX_BLOB = '3114c567b18f277d92e86220500ea134935cf49a';

test('la portada V9 permanece byte-a-byte intacta', () => {
  // 2026-09-20: Andrés pidió explícitamente visibilidad de países e idiomas al final.
  // Preserve the previous approved baseline after removing only this fixed footer paragraph.
  const approvedFooter = '<p class="help-language-coverage">Orientación inicial por país: España, México, Argentina, Colombia, Chile, Portugal, Francia, Reino Unido y recursos de la UE. <a href="/ayuda/es/" lang="es">Español</a> · <a href="/ayuda/en/" lang="en">English</a> · <a href="/ayuda/fr/" lang="fr">Français</a> · <a href="/ayuda/pt/" lang="pt">Português</a>. Las guías completas siguen principalmente en español.</p>';
  // 2026-09-28: Andrés explicitly requested visible Arabic access for people in Spain.
  const arabicEntry = "<p class=\"arabic-help-entry\" style=\"padding:12px 20px;margin:0;text-align:center\">🌐 <a href=\"/ayuda/ar/\" lang=\"ar\" dir=\"rtl\">العربية · المساعدة في إسبانيا</a> <span lang=\"es\">· Ayuda en España</span></p>\n";
  // 2026-10-05: Andrés explicitly requests the six Professionals options directly on the homepage.
  const previousProfessionals = "    <section class=\"professionals section\" id=\"profesionales\">\n      <div class=\"container split reverse-mobile\">\n        <div class=\"professional-panel\">\n          <p class=\"eyebrow\">Cuando necesitas algo más</p>\n          <h2>Profesionales y servicios que pueden ayudarte.</h2>\n          <p>Psicología, orientación legal, empleo, finanzas personales, formación, actividad física y otros servicios relacionados con situaciones concretas.</p>\n          <p class=\"muted\">La recomendación debe ser transparente: sabrás cuándo existe una colaboración comercial.</p>\n          <a class=\"btn btn-secondary\" href=\"/profesionales.html\">Acceder a Profesionales</a>\n          <p><a href=\"/profesionales.html#solicitud\">¿Eres profesional? Solicita evaluación de tu servicio →</a></p>\n        </div>\n\n        <div class=\"steps\">\n          <div><span>01</span><p><strong>Identifica la situación.</strong><br>Qué te está pasando y qué necesitas resolver primero.</p></div>\n          <div><span>02</span><p><strong>Compara opciones.</strong><br>Recursos gratuitos, profesionales y servicios relevantes.</p></div>\n          <div><span>03</span><p><strong>Decide tú.</strong><br>Sin presión y con información clara.</p></div>\n        </div>\n      </div>\n    </section>\n\n";
  // 2026-10-05: Andrés requests Crisis and suicide first, then alphabetical story filters.
  const previousStoryFilters = "          <div class=\"story-filters\" aria-label=\"Filtrar historias\">\n            <button class=\"filter active\" data-filter=\"all\">Todas</button>\n            <button class=\"filter\" data-filter=\"pareja\">Pareja</button>\n            <button class=\"filter\" data-filter=\"familia\">Familia</button>\n            <button class=\"filter\" data-filter=\"trabajo\">Trabajo</button>\n          </div>";
  const current = readFileSync('index.html', 'utf8').replaceAll('\r\n', '\n')
    // 2026-10-07: identical locked CSS delivered in HTML to remove its blocking request.
    .replace('<style data-home-source="styles.css">\n' + readFileSync('styles.css', 'utf8').replaceAll('\r\n', '\n') + '\n</style>', '<link rel="stylesheet" href="styles.css">')
    // 2026-10-07: responsive delivery of the existing hero; keep its visual shell intact.
    .replace("<link rel=\"preload\" as=\"image\" href=\"/assets/manos-apoyo.webp\" imagesrcset=\"/assets/manos-apoyo-480.webp 480w, /assets/manos-apoyo-768.webp 768w, /assets/manos-apoyo.webp 1000w\" imagesizes=\"(max-width: 760px) calc(100vw - 28px), (max-width: 1080px) calc((100vw - 50px) / 2), (max-width: 1220px) calc((100vw - 40px) * .47 - 24px), 531px\" type=\"image/webp\" fetchpriority=\"high\">", "<link rel=\"preload\" as=\"image\" href=\"/assets/manos-apoyo.webp\" type=\"image/webp\" fetchpriority=\"high\">")
    .replace("<source srcset=\"/assets/manos-apoyo-480.webp 480w, /assets/manos-apoyo-768.webp 768w, /assets/manos-apoyo.webp 1000w\" sizes=\"(max-width: 760px) calc(100vw - 28px), (max-width: 1080px) calc((100vw - 50px) / 2), (max-width: 1220px) calc((100vw - 40px) * .47 - 24px), 531px\" type=\"image/webp\">", "<source srcset=\"assets/manos-apoyo.webp\" type=\"image/webp\">")
    // 2026-10-07: reviewed local copies of the same fonts; preserve the visual/editorial baseline.
    .replace("  <link rel=\"preload\" href=\"/assets/fonts/libre-baskerville-22219fb90e3b.woff2\" as=\"font\" type=\"font/woff2\" crossorigin>\n  <link rel=\"preload\" href=\"/assets/fonts/montserrat-06b16db7a969.woff2\" as=\"font\" type=\"font/woff2\" crossorigin>\n  <link rel=\"stylesheet\" href=\"/assets/home-fonts.css?v=20261007\">", "  <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n  <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n  <link href=\"https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&amp;family=Montserrat:wght@400;500;600;700&amp;display=swap\" rel=\"stylesheet\">")
    .replace('"dateModified": "2026-10-07"', '"dateModified": "2026-09-15"')
    .replace(/          <div class="story-filters"[\s\S]*?<\/div>/, previousStoryFilters)
    .replace('  <link rel="stylesheet" href="/assets/professionals-home.css?v=20261005">\n', '')
    .replace(/    <!-- professionals-inline:start -->[\s\S]*?    <!-- professionals-inline:end -->\n\n/, previousProfessionals);
  assert.equal(current.split(arabicEntry).length,2);
  const html = current.replace('\n' + arabicEntry,'');
  assert.equal(html.split(approvedFooter).length, 2, 'one exact language footer is required');
  assert.ok(html.includes(approvedFooter + '</footer>'), 'language coverage belongs at the end of the footer');
  const addedStylesheet = '  <link rel="stylesheet" href="/assets/country-card.css?v=20260927-7">\n';
  // Andrés pidió el 27/09 acceso directo y visible para profesionales y alianzas.
  const professionalEntry = '          <p><a href="/profesionales.html#solicitud">¿Eres profesional? Solicita evaluación de tu servicio →</a></p>\n';
  const newTrustLinks = '<a href="/profesionales.html">Profesionales: participar</a><a href="/alianzas.html">Alianzas</a>';
  const oldTrustLink = '<a href="#profesionales">Profesionales</a>';
  const countryBlock = /<!-- country-cards:start -->[\s\S]*?<!-- country-cards:end -->\n/;
  assert.equal(html.split(addedStylesheet).length, 2, 'one approved country card stylesheet is required');
  assert.match(html, countryBlock, 'the approved country card block is required');
  assert.equal(html.split(professionalEntry).length, 2, 'one direct professional entry is required');
  assert.equal(html.split(newTrustLinks).length, 2, 'one professional and alliance footer entry is required');
  const baseline = html.replace(approvedFooter, '').replace(addedStylesheet, '').replace(countryBlock, '')
    // 2026-10-05: Andrés requests a visible Professionals hub; allow only this exact CTA change.
    .replace('href="/profesionales.html">Acceder a Profesionales', 'href="/contacto.html#profesionales">Explorar opciones')
    .replace(professionalEntry, '').replace(newTrustLinks, oldTrustLink).replace(/<\/html>\n$/, '</html>');
  const actual = execFileSync('git', ['hash-object', '--stdin'], { input: baseline, encoding: 'utf8' }).trim();

  assert.equal(
    actual,
    APPROVED_V9_INDEX_BLOB,
    [
      'La portada V9 (index.html) ha cambiado.',
      'No actualices esta referencia para hacer pasar CI.',
      'Solo puede cambiarse tras petición explícita de Andrés y revisión visual/editorial específica.'
    ].join(' ')
  );
});
