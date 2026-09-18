import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { fixture: { type: 'string' } } });
const fixture = resolve(values.fixture ?? '');

function version(name: string): string {
  const path = join(fixture, 'node_modules', name, 'package.json');
  return (JSON.parse(readFileSync(path, 'utf8')) as { version: string }).version;
}

const babel = version('@babel/core');
const preset = version('metro-react-native-babel-preset');
const transformer = version('metro-react-native-babel-transformer');
const register = version('metro-babel-register');
if (!babel.startsWith('7.')) throw new Error(`RN 0.59 requires Babel 7, got ${babel}`);
for (const [name, actual] of [
  ['metro-react-native-babel-preset', preset],
  ['metro-react-native-babel-transformer', transformer],
  ['metro-babel-register', register],
]) {
  if (actual !== '0.51.0') throw new Error(`${name} must resolve to 0.51.0 for RN 0.59.10, got ${actual}`);
}
console.log(JSON.stringify({ babel, preset, transformer, register }));
