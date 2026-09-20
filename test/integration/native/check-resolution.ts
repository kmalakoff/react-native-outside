import { existsSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import semver from 'semver';

type PackageRecord = { name: string; repository: string; sha: string; version: string; tarball: string; sha256: string };
type Manifest = { packages: PackageRecord[] };
type PackageJson = { name: string; version: string; peerDependencies?: Record<string, string> };

const { values } = parseArgs({ options: { fixture: { type: 'string' }, profile: { type: 'string' }, manifest: { type: 'string' } } });
const fixture = resolve(values.fixture ?? '');
const profile = values.profile ?? 'current';
const manifestPath = resolve(values.manifest ?? '.tmp/native/candidate-manifest.json');
if (profile !== 'current' && profile !== 'minimum') throw new Error(`Unknown native profile: ${profile}`);
if (!fixture || !existsSync(fixture)) throw new Error(`Fixture does not exist: ${fixture}`);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;

function packageJson(name: string): PackageJson {
  return JSON.parse(readFileSync(join(fixture, 'node_modules', name, 'package.json'), 'utf8'));
}

const expected = profile === 'minimum' ? { react: '16.8.3', reactNative: '0.59.10' } : { react: '19.2.3', reactNative: '0.87.1' };
const react = packageJson('react');
const reactNative = packageJson('react-native');
if (react.version !== expected.react || reactNative.version !== expected.reactNative) {
  throw new Error(`Expected React ${expected.react} and RN ${expected.reactNative}, got ${react.version} and ${reactNative.version}`);
}

function findPackages(root: string, wanted: Set<string>, found = new Map<string, string>()): Map<string, string> {
  if (!existsSync(root)) return found;
  for (const entry of readdirSync(root)) {
    if (entry.startsWith('.')) continue;
    const path = join(root, entry);
    if (!statSync(path).isDirectory()) continue;
    if (entry.startsWith('@')) {
      findPackages(path, wanted, found);
      continue;
    }
    const packageFile = join(path, 'package.json');
    if (existsSync(packageFile)) {
      const data = JSON.parse(readFileSync(packageFile, 'utf8')) as { name?: string };
      if (data.name && wanted.has(data.name)) found.set(`${data.name}:${path}`, realpathSync(path));
    }
    findPackages(join(path, 'node_modules'), wanted, found);
  }
  return found;
}

const wanted = new Set(['react', 'react-native', 'react-native-contains', 'react-native-event', 'react-native-outside', 'react-ref-boundary']);
const locations = findPackages(join(fixture, 'node_modules'), wanted);
for (const name of wanted) {
  const copies = [...locations.entries()].filter(([key]) => key.startsWith(`${name}:`)).map(([, path]) => path);
  if (new Set(copies).size !== 1) throw new Error(`${name} resolved to ${new Set(copies).size} physical copies`);
}

for (const candidate of manifest.packages) {
  const installed = packageJson(candidate.name);
  if (installed.version !== candidate.version) throw new Error(`${candidate.name} resolved to ${installed.version}, expected ${candidate.version}`);
}

const peerContracts = manifest.packages.flatMap((candidate) => {
  const installed = packageJson(candidate.name);
  return ['react', 'react-native'].flatMap((dependency) => {
    const range = installed.peerDependencies?.[dependency];
    if (!range) return [];
    const actual = dependency === 'react' ? react.version : reactNative.version;
    return [{ candidate: candidate.name, dependency, range, actual, satisfied: semver.satisfies(actual, range) }];
  });
});
const outside = packageJson('react-native-outside');
const outsideContract = peerContracts.find(({ candidate, dependency }) => candidate === 'react-native-outside' && dependency === 'react-native');
const peerContract = outside.peerDependencies?.['react-native'] ?? '<missing>';
const peerContractSatisfied = outsideContract?.satisfied ?? false;
const incompatiblePeerContracts = [...peerContracts.filter((contract) => !contract.satisfied), ...(outsideContract ? [] : [{ candidate: 'react-native-outside', dependency: 'react-native', range: '<missing>', actual: reactNative.version, satisfied: false }])];
const report = {
  profile,
  react: react.version,
  reactNative: reactNative.version,
  candidates: manifest.packages.map(({ name, repository, sha, version, tarball, sha256 }) => ({ name, repository, sha, version, tarball, sha256 })),
  peerContracts,
  peerContract,
  peerContractSatisfied,
  peerContractStatus: peerContract === '<missing>' ? 'missing' : peerContractSatisfied ? `satisfied: react-native@${reactNative.version} matches ${peerContract}` : `blocked: react-native@${reactNative.version} does not match ${peerContract}`,
};
writeFileSync(join(fixture, '.native-resolution.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (profile === 'current' && incompatiblePeerContracts.length > 0) {
  throw new Error(`Current profile has incompatible React/RN peer contracts: ${incompatiblePeerContracts.map(({ candidate, dependency, actual, range }) => `${candidate} requires ${dependency} ${range}, got ${actual}`).join('; ')}`);
}
