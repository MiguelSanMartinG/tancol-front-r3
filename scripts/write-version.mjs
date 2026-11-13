// Escribe public/assets/version.json con un id único por build ANTES de `ng build`.
// El cliente compara ese valor para recargar las pestañas abiertas cuando se publica
// una imagen nueva, así que nunca puede quedar en el placeholder "dev".
//
// Prioridad: SOURCE_COMMIT → COMMIT_SHA → CI_COMMIT_SHA → GITHUB_SHA → GIT_COMMIT
//            → git rev-parse --short HEAD → build-<timestamp base36>-<6 hex>
//
// La versión se hornea en el build de la imagen. No se reescribe al arrancar el contenedor.
import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ENV_VARS = ['SOURCE_COMMIT', 'COMMIT_SHA', 'CI_COMMIT_SHA', 'GITHUB_SHA', 'GIT_COMMIT'];
export const PLACEHOLDER = 'dev';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_OUTPUT = resolve(raiz, 'public', 'assets', 'version.json');

function limpio(valor) {
  if (typeof valor !== 'string') return null;
  const recortado = valor.trim();
  return recortado.length > 0 && recortado !== PLACEHOLDER ? recortado : null;
}

export function gitShortSha(cwd = raiz) {
  try {
    return execSync('git rev-parse --short HEAD', { cwd, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

export function buildId(now = Date.now()) {
  return `build-${now.toString(36)}-${randomBytes(3).toString('hex')}`;
}

/** Resuelve la versión. Nunca devuelve "dev" ni un valor vacío. */
export function resolveVersion(env = process.env, git = gitShortSha) {
  for (const nombre of ENV_VARS) {
    const valor = limpio(env[nombre]);
    if (valor) return { version: valor, origen: nombre };
  }
  const sha = limpio(git());
  if (sha) return { version: sha, origen: 'git' };
  return { version: buildId(), origen: 'build-id' };
}

export function writeVersion(output = DEFAULT_OUTPUT, env = process.env, git = gitShortSha) {
  const { version, origen } = resolveVersion(env, git);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify({ version })}\n`);
  return { version, origen, output };
}

const esCli = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (esCli) {
  const { version, origen, output } = writeVersion(process.env.VERSION_OUTPUT || DEFAULT_OUTPUT);
  console.log(`[version] ${version} (${origen}) -> ${output}`);
}
