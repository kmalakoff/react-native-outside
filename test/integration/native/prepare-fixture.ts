import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';
import { build } from 'esbuild';
import { safeRmSync } from 'fs-remove-compat';

const { values } = parseArgs({
  options: {
    profile: { type: 'string' },
    fixture: { type: 'string' },
    manifest: { type: 'string' },
    packages: { type: 'string' },
  },
});
const profile = values.profile ?? 'current';
const repository = resolve(process.cwd());
if (profile !== 'current' && profile !== 'minimum') {
  throw new Error(`Unknown native profile: ${profile}`);
}

const fixtureRoot = resolve(repository, '.tmp/native/fixtures');
const expectedFixture = join(fixtureRoot, profile);
const fixture = resolve(values.fixture ?? expectedFixture);
if (fixture !== expectedFixture) {
  throw new Error(`Fixture must be the profile scratch path ${expectedFixture}`);
}
const manifestPath = resolve(values.manifest ?? '.tmp/native/candidate-manifest.json');
const packageDirectory = resolve(values.packages ?? '.tmp/native/packages');

function run(command: string, args: string[], cwd: string): string {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed in ${cwd}\n${output}`);
  return output;
}

type Candidate = { name: string; version: string; tarball: string; sha256: string };
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { packages: Candidate[] };
const expectedPackages = new Set(['react-native-contains', 'react-native-event', 'react-native-outside', 'react-ref-boundary']);
if (manifest.packages.length !== expectedPackages.size || new Set(manifest.packages.map((candidate) => candidate.name)).size !== expectedPackages.size) {
  throw new Error('Candidate manifest must contain exactly four unique packages');
}
for (const candidate of manifest.packages) {
  const archive = join(packageDirectory, candidate.tarball);
  const expectedName = `${candidate.name}-${candidate.version}.tgz`;
  if (!expectedPackages.has(candidate.name) || basename(candidate.tarball) !== candidate.tarball || candidate.tarball !== expectedName || !/^[0-9a-f]{64}$/i.test(candidate.sha256) || !existsSync(archive)) {
    throw new Error(`Candidate archive does not match the manifest: ${candidate.tarball}`);
  }
  const digest = createHash('sha256').update(readFileSync(archive)).digest('hex');
  if (digest !== candidate.sha256) throw new Error(`Candidate archive digest mismatch: ${candidate.name}`);
}

safeRmSync(fixture, { recursive: true, force: true });
mkdirSync(fixtureRoot, { recursive: true });
const sourceProject = join(repository, `test/native/${profile}`);
const excludedSegments = new Set(profile === 'current' ? ['node_modules', 'dist', 'Pods', 'DerivedData', '.native'] : ['node_modules', 'dist', '.native']);
cpSync(sourceProject, fixture, {
  recursive: true,
  filter: (source) =>
    !relative(sourceProject, source)
      .split(sep)
      .some((segment) => excludedSegments.has(segment)),
});
if (profile === 'minimum') mkdirSync(join(fixture, 'android/app/src/main/assets'), { recursive: true });

const appTsx = join(fixture, 'App.tsx');
const appJs = join(fixture, 'App.js');
safeRmSync(appTsx, { force: true });
safeRmSync(appJs, { force: true });
await build({
  entryPoints: [join(repository, 'test/native/shared/App.tsx')],
  outfile: appJs,
  bundle: false,
  format: 'esm',
  jsx: 'transform',
  platform: 'neutral',
  target: 'es2018',
  loader: { '.tsx': 'tsx' },
});
cpSync(join(repository, 'test/native/shared/index.js'), join(fixture, 'index.js'));
mkdirSync(join(fixture, '.native'), { recursive: true });
const app = JSON.parse(readFileSync(join(fixture, 'app.json'), 'utf8')) as { android?: { package?: string } };
if (!app.android?.package) throw new Error(`Native fixture ${profile} has no Android package identifier`);
const sharedFlow = readFileSync(join(repository, 'test/native/shared/native-outside.yaml'), 'utf8');
if (!/^appId:\s+\S+$/m.test(sharedFlow)) throw new Error('Shared native flow is missing its appId');
let flow = sharedFlow.replace(/^appId:\s+\S+$/m, `appId: ${app.android.package}`);
if (profile === 'minimum') {
  // RN 0.59 does not expose testID as an Android resource ID; select the same controls by visible labels.
  const selectors = JSON.parse(readFileSync(join(sourceProject, 'selectors.json'), 'utf8')) as Record<string, string>;
  flow = flow.replace(/^ {4}id: (\S+)$/gm, (_, id: string) => {
    const label = selectors[id];
    if (!label) throw new Error(`Missing legacy native selector for ${id}`);
    return `    text: ${JSON.stringify(label)}`;
  });
}
writeFileSync(join(fixture, '.native/native-outside.yaml'), flow);

run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund', ...(profile === 'minimum' ? ['--legacy-peer-deps'] : [])], fixture);
const tarballs = manifest.packages.map((candidate) => join(packageDirectory, candidate.tarball));
run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-save', '--package-lock=false', ...(profile === 'minimum' ? ['--legacy-peer-deps'] : []), ...tarballs], fixture);
console.log(run(process.execPath, [join(repository, 'test/integration/native/check-resolution.ts'), '--fixture', fixture, '--profile', profile, '--manifest', manifestPath], repository));
console.log(`Prepared ${profile} fixture at ${fixture}`);
