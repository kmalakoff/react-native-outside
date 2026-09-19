import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { safeRmSync } from 'fs-remove-compat';
import { installPackedPackage } from './consumer-package.ts';

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
mkdirSync(join(repository, '.tmp'), { recursive: true });
const fixture = mkdtempSync(join(repository, '.tmp', 'node-floor-'));
try {
  const consumerPackage = join(fixture, 'node_modules/react-native-outside');
  installPackedPackage(repository, consumerPackage, fixture);
  cpSync(join(repository, 'test/exports/floor.cjs'), join(fixture, 'floor.cjs'));
  const result = spawnSync(process.execPath, [require.resolve('node-version-use/bin/cli.js'), '16.0.0', 'node', join(fixture, 'floor.cjs')], {
    stdio: 'inherit',
    timeout: 120_000,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Node floor check failed with status ${result.status}.`);
} finally {
  safeRmSync(fixture, { recursive: true, force: true });
}
