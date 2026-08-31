import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const forbiddenRoots = ['docs/drafts'];

async function listFiles(path) {
  const absolute = join(root, path);
  try {
    const info = await stat(absolute);
    if (!info.isDirectory()) return [path];
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }

  const files = [];
  for (const entry of await readdir(absolute, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(child));
    else if (entry.isFile()) files.push(relative(root, join(root, child)));
  }
  return files;
}

const exposed = (await Promise.all(forbiddenRoots.map(listFiles))).flat();

if (exposed.length > 0) {
  console.error('Safety publication boundary violation: internal drafts exist inside the deployable production tree.');
  console.error('Keep sensitive/unreviewed drafts in an isolated non-production branch or governed external workspace until their release gate is approved.');
  for (const file of exposed) console.error(` - ${file}`);
  process.exit(1);
}

console.log('Sensitive draft publication boundary: OK');
