import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

for (const file of ['buscar/index.html', 'src/search-content-catalog.js']) {
  test(`diagnostic sha256 ${file}`, async () => {
    const data = await readFile(new URL(`../${file}`, import.meta.url));
    console.log(`MEASUREMENT_PIN ${file} ${createHash('sha256').update(data).digest('hex')}`);
  });
}
