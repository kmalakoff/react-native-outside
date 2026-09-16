import { spawnSync } from 'child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'fs';
import { safeRmSync } from 'fs-remove-compat';
import { createRequire } from 'module';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
mkdirSync(join(repository, '.tmp'), { recursive: true });
const fixture = mkdtempSync(join(repository, '.tmp/types-'));
const packageName = 'react-native-outside';
const tsds = createRequire(import.meta.url).resolve('ts-dev-stack/bin/cli.js');
const source = readFileSync(join(repository, 'test/types/consumer.tsx'), 'utf8');

function runBuild() {
  const result = spawnSync(process.execPath, [tsds, 'build'], {
    cwd: fixture,
    encoding: 'utf8',
  });
  if (result.error) throw result.error;
  return { output: `${result.stdout}\n${result.stderr}`, status: result.status };
}

try {
  mkdirSync(join(fixture, 'src'));
  mkdirSync(join(fixture, 'node_modules'));
  symlinkSync(repository, join(fixture, 'node_modules', packageName), process.platform === 'win32' ? 'junction' : 'dir');
  writeFileSync(
    join(fixture, 'package.json'),
    JSON.stringify({
      name: 'react-native-outside-consumer-types',
      private: true,
      type: 'module',
      source: 'src/index.tsx',
      tsds: { targets: ['esm'] },
    })
  );
  writeFileSync(
    join(fixture, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: { jsx: 'react-jsx', moduleResolution: 'bundler', skipLibCheck: true, strict: true },
      include: ['src'],
    })
  );
  writeFileSync(join(fixture, 'src/index.tsx'), source);

  const passing = runBuild();
  if (passing.status !== 0) throw new Error(`Consumer type fixture failed:\n${passing.output}`);

  writeFileSync(join(fixture, 'src/index.tsx'), source.replace('  // @ts-expect-error A state setter accepts only boolean state actions.\n', ''));
  const negative = runBuild();
  if (negative.status === 0 || !negative.output.includes('TS2345')) {
    throw new Error(`Consumer negative type fixture did not reject the invalid setter:\n${negative.output}`);
  }

  safeRmSync(join(fixture, 'node_modules', packageName), { recursive: true, force: true });
  mkdirSync(join(fixture, 'node_modules', packageName));
  writeFileSync(join(fixture, 'node_modules', packageName, 'package.json'), readFileSync(join(repository, 'package.json')));
  cpSync(join(repository, 'dist'), join(fixture, 'node_modules', packageName, 'dist'), { recursive: true });
  const declarationPath = join(fixture, 'node_modules', packageName, 'dist/esm/types.d.ts');
  writeFileSync(declarationPath, readFileSync(declarationPath, 'utf8').replaceAll('SetStateAction<boolean>', 'SetStateAction<unknown>'));
  writeFileSync(join(fixture, 'src/index.tsx'), source);
  const regressed = runBuild();
  if (regressed.status === 0 || !regressed.output.includes('TS2578')) {
    throw new Error(`Consumer type fixture did not detect the regressed setter contract:\n${regressed.output}`);
  }
} finally {
  safeRmSync(fixture, { recursive: true, force: true });
}
