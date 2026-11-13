// node --test scripts/   (npm run test:version-script)
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { resolveVersion, writeVersion } from './write-version.mjs';
import { problemaDeVersion } from './check-dist-version.mjs';

const sinGit = () => null;
const salida = () => join(mkdtempSync(join(tmpdir(), 'version-')), 'assets', 'version.json');

test('con SOURCE_COMMIT=abc escribe {"version":"abc"}', () => {
  const output = salida();
  writeVersion(output, { SOURCE_COMMIT: 'abc' }, sinGit);
  assert.equal(readFileSync(output, 'utf8').trim(), '{"version":"abc"}');
});

test('respeta la prioridad de variables e ignora vacías o con solo espacios', () => {
  assert.equal(resolveVersion({ SOURCE_COMMIT: '  ', COMMIT_SHA: 'c1', GITHUB_SHA: 'g1' }, sinGit).version, 'c1');
  assert.equal(resolveVersion({ CI_COMMIT_SHA: '', GITHUB_SHA: ' g1 ' }, sinGit).version, 'g1');
  assert.equal(resolveVersion({ GIT_COMMIT: 'gc' }, sinGit).version, 'gc');
  assert.equal(resolveVersion({}, () => 'abc1234').version, 'abc1234');
});

test('sin env y sin git no escribe "dev": usa build-<ts>-<6 hex> distinto por build', () => {
  const output = salida();
  const { version } = writeVersion(output, {}, sinGit);
  const escrito = JSON.parse(readFileSync(output, 'utf8')).version;
  assert.equal(escrito, version);
  assert.notEqual(escrito, 'dev');
  assert.match(escrito, /^build-[0-9a-z]+-[0-9a-f]{6}$/);
  assert.notEqual(resolveVersion({}, sinGit).version, resolveVersion({}, sinGit).version);
});

test('un SOURCE_COMMIT="dev" tampoco se publica', () => {
  assert.notEqual(resolveVersion({ SOURCE_COMMIT: 'dev' }, sinGit).version, 'dev');
});

test('check-dist-version rechaza dev, vacío, no string o JSON inválido', () => {
  assert.equal(problemaDeVersion('{"version":"abc"}'), null);
  assert.ok(problemaDeVersion('{"version":"dev"}'));
  assert.ok(problemaDeVersion('{"version":""}'));
  assert.ok(problemaDeVersion('{"version":12}'));
  assert.ok(problemaDeVersion('{}'));
  assert.ok(problemaDeVersion('{no'));
});
