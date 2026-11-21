// Solara Bay 3D: Heatline — submission entrypoint (gta6-01, Node 22, stdlib only).
// Copies game/ and screenshots/ beside this file into MAKEFUN_OUTPUT_DIR (or
// /output), builds the judge dossier with the kit library, then refuses to
// write anything that would fail the scorer's own gate: file/size caps,
// offline-only references, screenshot count and size, dossier size.
// Deterministic: same input files give byte-identical output on every run.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier, htmlFacts, importOrder, isRelativeRef, readGameTree, sourceImports } from './vendor/makefun-game.ts';

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};
const DOSSIER_MAX_BYTES = 1572864;

function offlineOnly(ref: string): boolean {
  if (ref.startsWith('data:')) return true;
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(ref) || ref.startsWith('//')) return false;
  return isRelativeRef(ref) || ref.startsWith('/');
}

function fail(msg: string): never {
  throw new Error('Gate failed: ' + msg);
}

function checkOutput(outDir: string, dossier: Uint8Array): void {
  if (dossier.length > DOSSIER_MAX_BYTES) fail(`dossier.json is ${dossier.length} bytes (max ${DOSSIER_MAX_BYTES})`);
  const gameDir = join(outDir, 'game');
  const tree = readGameTree(gameDir, CAPS);
  const indexHtml = readFileSync(join(gameDir, 'index.html'), 'utf8');
  if (Buffer.byteLength(indexHtml, 'utf8') > 1048576) fail('game/index.html is over 1 MiB');
  const facts = htmlFacts(indexHtml);
  for (const s of facts.scripts) if (s.src !== null && !offlineOnly(s.src)) fail(`external script "${s.src}" in index.html`);
  for (const l of facts.links) if (!offlineOnly(l.href)) fail(`external link "${l.href}" in index.html`);
  for (const r of facts.resources) if (!offlineOnly(r.src)) fail(`external media "${r.src}" in index.html`);
  const sources = tree.files
    .filter((f) => f.cls === 'source')
    .map((f) => ({ path: f.path, bytes: new Uint8Array(readFileSync(join(gameDir, f.path))) }));
  for (const modPath of importOrder(sources, facts)) {
    const code = readFileSync(join(gameDir, modPath), 'utf8');
    for (const spec of sourceImports(code)) {
      if (!offlineOnly(spec)) fail(`external import "${spec}" in game/${modPath}`);
    }
    if (/https?:\/\//.test(code)) fail(`hardcoded http(s) URL in game/${modPath}`);
  }
  const shotDir = join(outDir, 'screenshots');
  const shots = readdirSync(shotDir).filter((n) => !n.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) fail(`screenshots/ needs 3-4 images, found ${shots.length}`);
  for (const name of shots) {
    if (!/^[A-Za-z0-9._-]{1,128}$/.test(name) || name.startsWith('-')) fail(`bad screenshot name "${name}"`);
    const size = statSync(join(shotDir, name)).size;
    if (size > CAPS.screenshots.max_bytes) fail(`screenshots/${name} is ${size} bytes (max ${CAPS.screenshots.max_bytes})`);
  }
}

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

const dossier = buildDossier(out, CAPS);
checkOutput(out, dossier);
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`dossier.json written: ${dossier.length} bytes`);
