// Copies the US and UK English Hunspell dictionaries into public/ so the
// in-browser spellchecker can fetch them. Runs before dev and build.
import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}public/dictionaries`;
await mkdir(out, { recursive: true });

const sources = { 'en-US': 'dictionary-en', 'en-GB': 'dictionary-en-gb' };
for (const [lang, pkg] of Object.entries(sources)) {
  for (const ext of ['aff', 'dic']) {
    await copyFile(`${root}node_modules/${pkg}/index.${ext}`, `${out}/${lang}.${ext}`);
  }
  await copyFile(`${root}node_modules/${pkg}/license`, `${out}/${lang}.LICENSE.txt`);
}
console.log('Copied spelling dictionaries to public/dictionaries');
