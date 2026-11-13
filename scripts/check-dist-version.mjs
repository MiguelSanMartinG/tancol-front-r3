// Valida el version.json que quedó DENTRO del dist después de `ng build`.
// Publicar "dev" (o un archivo vacío o inválido) es un build roto: sale con código 1.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DIST_VERSION = resolve(raiz, 'dist', 'tancol-frontend', 'browser', 'assets', 'version.json');

/** Devuelve el motivo del fallo, o null si la versión es válida. */
export function problemaDeVersion(texto) {
  let data;
  try {
    data = JSON.parse(texto);
  } catch {
    return 'no es JSON válido';
  }
  const version = data?.version;
  if (typeof version !== 'string') return 'falta "version" o no es string';
  if (version.trim().length === 0) return '"version" está vacío';
  if (version.trim() === 'dev') return '"version" quedó en "dev"';
  return null;
}

const esCli = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (esCli) {
  const archivo = process.argv[2] ? resolve(process.argv[2]) : DIST_VERSION;
  let texto;
  try {
    texto = readFileSync(archivo, 'utf8');
  } catch {
    console.error(`[version] ERROR: no existe ${archivo}`);
    process.exit(1);
  }
  const problema = problemaDeVersion(texto);
  if (problema) {
    console.error(`[version] ERROR: ${archivo}: ${problema}. Contenido: ${texto.trim()}`);
    process.exit(1);
  }
  console.log(`[version] OK ${archivo}: ${texto.trim()}`);
}
