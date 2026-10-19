// Compila un pacchetto con la lingua fissa: node tools/build-lang.mjs it
// → dist/<pacchetto>.debug.<versione>-it.rpk, accanto a quello con la lingua automatica.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { LANGS } from '../src/common/i18n.js';

const lang = process.argv[2];
if (LANGS.indexOf(lang) < 0) {
  console.error('Lingua non valida: usa una tra ' + LANGS.join(', '));
  process.exit(1);
}

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('src/manifest.json', root), 'utf8'));
const out = new URL(`dist/${manifest.package}.debug.${manifest.versionName}.rpk`, root);
const target = new URL(`dist/${manifest.package}.debug.${manifest.versionName}-${lang}.rpk`, root);
// il pacchetto con la lingua automatica, se c'è già: fuori da dist/, che la build svuota
const aside = path.join(os.tmpdir(), path.basename(fileURLToPath(out)));
const build = new URL('src/common/build.js', root);
const original = fs.readFileSync(build, 'utf8');

if (fs.existsSync(out)) fs.renameSync(out, aside);
try {
  fs.writeFileSync(build, original.replace("FORCED_LANG = ''", `FORCED_LANG = '${lang}'`));
  execSync('npx aiot build', { cwd: root, stdio: 'inherit' });
  fs.renameSync(out, target);
  console.log('→ ' + target.pathname);
} finally {
  fs.writeFileSync(build, original);
  if (fs.existsSync(aside)) fs.renameSync(aside, out);
}
