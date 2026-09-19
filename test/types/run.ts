import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { safeRmSync } from 'fs-remove-compat';
import { installPackedPackage } from '../lib/consumer-package.ts';

const {
  values: { generated = false },
} = parseArgs({ options: { generated: { type: 'boolean' } } });

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this fixture through npm run test:types.');
const packageName = 'react-native-outside';
const source = readFileSync(join(repository, 'test/types/consumer.tsx'), 'utf8');
mkdirSync(join(repository, '.tmp'), { recursive: true });

function run(args: string[], cwd: string, capture = false) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
    timeout: 120_000,
  });
  if (result.error) throw result.error;
  return result;
}

for (const profile of generated ? ['current'] : ['minimum', 'current']) {
  const fixture = mkdtempSync(join(repository, '.tmp', 'consumer-types-'));
  try {
    cpSync(join(repository, 'test/types/profiles', profile), fixture, { recursive: true, filter: (path) => !path.includes('node_modules') });
    const installed = run([npmCli, 'ci', '--ignore-scripts', '--no-audit', '--no-fund'], fixture);
    if (installed.status !== 0) throw new Error(`${profile}: type fixture dependency installation failed.`);
    const consumerPackage = join(fixture, 'node_modules', packageName);
    installPackedPackage(repository, consumerPackage, fixture);
    for (const dependency of ['react-native-event', 'react-native-contains', 'react-ref-boundary']) {
      const from = join(repository, 'node_modules', dependency);
      const to = join(fixture, 'node_modules', dependency);
      installPackedPackage(from, to, fixture);
    }
    mkdirSync(join(fixture, 'src'));
    writeFileSync(join(fixture, 'src/index.tsx'), source);
    if (generated) {
      const configPath = join(fixture, 'tsconfig.json');
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      delete config.compilerOptions.customConditions;
      writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
    const tsc = join(fixture, 'node_modules/typescript/bin/tsc');
    console.log(`Consumer types: ${profile}${profile === 'current' && !generated ? ' (RN legacy declaration condition)' : ''}; skipLibCheck=false`);
    if (run([tsc, '-p', fixture], fixture).status !== 0) throw new Error(`${profile}: consumer declarations failed.`);

    const regression = source.replace("setIsActive?.('invalid');", 'setIsActive?.(false);');
    if (regression === source) throw new Error('Negative consumer assertion was not found.');
    writeFileSync(join(fixture, 'src/index.tsx'), regression);
    const negative = run([tsc, '-p', fixture], fixture, true);
    if (negative.status === 0 || !`${negative.stdout}${negative.stderr}`.includes('TS2578')) {
      throw new Error(`${profile}: negative consumer assertion did not detect the changed contract.`);
    }
  } finally {
    safeRmSync(fixture, { recursive: true, force: true });
  }
}
