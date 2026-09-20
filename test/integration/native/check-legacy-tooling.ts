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
for (const [name, actual, expected] of [
  ['metro-react-native-babel-preset', preset, '0.51.1'],
  ['metro-react-native-babel-transformer', transformer, '0.51.0'],
  ['metro-babel-register', register, '0.51.0'],
]) {
  if (actual !== expected) throw new Error(`${name} must resolve to ${expected} for RN 0.59.10, got ${actual}`);
}
console.log(JSON.stringify({ babel, preset, transformer, register }));
