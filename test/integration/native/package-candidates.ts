import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { safeRmSync } from 'fs-remove-compat';

type Candidate = { name: string; repository: string; sha: string };
type Manifest = { packages: Candidate[] };

const repository = resolve(process.cwd());
const baselinePath = join(repository, 'test/native/shared/candidates.json');
const candidateDirectory = join(repository, '.tmp/native/candidates');
const packageDirectory = join(repository, '.tmp/native/packages');
const generatedPath = join(repository, '.tmp/native/candidate-manifest.json');
const candidateManifestJson = process.env.CANDIDATE_MANIFEST?.trim();
const candidatePackage = process.env.CANDIDATE_PACKAGE;
const candidateRepository = process.env.CANDIDATE_REPOSITORY;
const candidateSha = process.env.CANDIDATE_SHA;
const callerEvent = process.env.CALLER_EVENT;
const callerRepository = process.env.CALLER_REPOSITORY;
const callerSha = process.env.CALLER_SHA;

const expected = ['react-native-contains', 'react-native-event', 'react-native-outside', 'react-ref-boundary'];
const canonicalWorkflowRepository = 'kmalakoff/react-native-outside';
const fullSha = /^[0-9a-f]{40}$/i;

if (!candidatePackage || !candidateRepository || !candidateSha) throw new Error('Candidate package, repository and SHA are required');
if (!callerEvent || !callerRepository || !callerSha) throw new Error('Caller event, repository and SHA are required');
if (!fullSha.test(candidateSha) || !fullSha.test(callerSha)) throw new Error('Candidate and caller SHAs must be full 40-character commit SHAs');

const coordinatedManual = callerEvent === 'workflow_dispatch' && callerRepository === canonicalWorkflowRepository && candidatePackage === 'react-native-outside' && candidateRepository === canonicalWorkflowRepository && candidateSha === callerSha;

function run(command: string, args: string[], cwd: string): string {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed in ${cwd}\n${output}`);
  return output;
}

function readManifest(): Manifest {
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')) as Manifest;
  const baselineByName = new Map(baseline.packages.map((candidate) => [candidate.name, candidate]));
  for (const candidate of baseline.packages) {
    if (candidate.repository !== `kmalakoff/${candidate.name}`) throw new Error(`Baseline repository is not approved for ${candidate.name}`);
  }
  const supplied = candidateManifestJson ? (JSON.parse(candidateManifestJson) as Manifest) : baseline;
  if (!Array.isArray(supplied.packages)) throw new Error('The candidate manifest must contain packages');
  if (supplied.packages.length !== expected.length) throw new Error('The candidate manifest must contain exactly the four native packages');
  const suppliedNames = supplied.packages.map((candidate) => candidate.name);
  if (new Set(suppliedNames).size !== suppliedNames.length) throw new Error('The candidate manifest contains duplicate package names');
  const packages = new Map(supplied.packages.map((candidate) => [candidate.name, candidate]));
  if (suppliedNames.some((name) => !expected.includes(name))) throw new Error('The candidate manifest contains an unknown package');
  if ([candidatePackage, candidateRepository, candidateSha].some(Boolean) && !(candidatePackage && candidateRepository && candidateSha)) {
    throw new Error('Candidate override requires CANDIDATE_PACKAGE, CANDIDATE_REPOSITORY, and CANDIDATE_SHA');
  }
  if (candidateManifestJson) {
    for (const candidate of supplied.packages) {
      const baselineCandidate = baselineByName.get(candidate.name);
      if (!baselineCandidate) throw new Error(`The candidate manifest contains an unknown package: ${candidate.name}`);
      if (candidate.name !== candidatePackage) {
        if (candidate.repository !== baselineCandidate.repository) {
          throw new Error(`Only canonical repositories may supply non-caller candidates: ${candidate.name}`);
        }
        if (candidate.sha !== baselineCandidate.sha && !coordinatedManual) {
          throw new Error(`Non-caller SHA overrides require a coordinated manual run from ${canonicalWorkflowRepository}: ${candidate.name}`);
        }
      }
    }
  }
  if (candidatePackage && candidateRepository && candidateSha) {
    const current = packages.get(candidatePackage);
    if (!current) throw new Error(`Candidate override names an unknown package: ${candidatePackage}`);
    packages.set(candidatePackage, { ...current, repository: candidateRepository, sha: candidateSha });
  }
  const names = [...packages.keys()].sort();
  if (names.join('\n') !== [...expected].sort().join('\n')) throw new Error('The candidate manifest must contain exactly the four native packages');
  for (const candidate of packages.values()) {
    const canonicalRepository = `kmalakoff/${candidate.name}`;
    const allowedRepository = candidate.name === candidatePackage ? candidateRepository : canonicalRepository;
    if (candidate.repository !== allowedRepository || basename(candidate.repository) !== candidate.name || candidate.repository.includes('..')) {
      throw new Error(`Repository does not match the approved or caller-associated repository for ${candidate.name}`);
    }
    if (!fullSha.test(candidate.sha)) throw new Error(`Candidate ${candidate.name} must use a full commit SHA`);
  }
  return { packages: expected.map((name) => packages.get(name) as Candidate) };
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

const manifest = readManifest();
safeRmSync(candidateDirectory, { recursive: true, force: true });
safeRmSync(packageDirectory, { recursive: true, force: true });
mkdirSync(candidateDirectory, { recursive: true });
mkdirSync(packageDirectory, { recursive: true });

const buildOrder = ['react-ref-boundary', 'react-native-contains', 'react-native-event', 'react-native-outside'];
const candidatesByName = new Map(manifest.packages.map((candidate) => [candidate.name, candidate]));
const packaged: Array<Candidate & { version: string; tarball: string; sha256: string }> = [];
for (const name of buildOrder) {
  const candidate = candidatesByName.get(name);
  if (!candidate) throw new Error(`Candidate manifest is missing ${name}`);
  const source = join(candidateDirectory, candidate.name);
  mkdirSync(source, { recursive: true });
  run('git', ['init', '--quiet'], source);
  run('git', ['remote', 'add', 'origin', `https://github.com/${candidate.repository}.git`], source);
  run('git', ['fetch', '--depth=1', 'origin', candidate.sha], source);
  run('git', ['checkout', '--quiet', '--detach', candidate.sha], source);
  run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], source);
  const siblingTarballs = packaged.map((sibling) => join(packageDirectory, sibling.tarball));
  if (siblingTarballs.length > 0) {
    run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-save', '--package-lock=false', '--legacy-peer-deps', ...siblingTarballs], source);
  }
  run('npm', ['run', 'build'], source);
  const packProcess = spawnSync('npm', ['pack', '--ignore-scripts', '--pack-destination', packageDirectory, '--json'], {
    cwd: source,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (packProcess.error) throw packProcess.error;
  if (packProcess.status !== 0) throw new Error(`npm pack failed in ${source}\n${packProcess.stdout ?? ''}${packProcess.stderr ?? ''}`);
  const rawPackResult = JSON.parse(packProcess.stdout) as Array<{ filename: string }> | Record<string, { filename: string }>;
  const packResult = Array.isArray(rawPackResult) ? rawPackResult : Object.values(rawPackResult);
  if (packResult.length !== 1) throw new Error(`Expected one tarball for ${candidate.name}`);
  if (!packResult[0].filename || basename(packResult[0].filename) !== packResult[0].filename || !packResult[0].filename.startsWith(`${candidate.name}-`) || !packResult[0].filename.endsWith('.tgz')) {
    throw new Error(`npm pack returned an unexpected filename for ${candidate.name}: ${packResult[0].filename ?? '<missing>'}`);
  }
  const tarball = join(packageDirectory, packResult[0].filename);
  if (!existsSync(tarball)) throw new Error(`npm pack did not create ${tarball}`);
  const packageJson = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8')) as { name: string; version: string };
  if (packageJson.name !== candidate.name) throw new Error(`Checked out ${candidate.name} has package name ${packageJson.name}`);
  if (basename(tarball) !== `${candidate.name}-${packageJson.version}.tgz`) {
    throw new Error(`npm pack filename does not match ${candidate.name}@${packageJson.version}: ${basename(tarball)}`);
  }
  const contents = run('tar', ['-tf', tarball], repository);
  if (!contents.split('\n').some((entry) => entry === 'package/dist/' || entry.startsWith('package/dist/'))) {
    throw new Error(`${candidate.name} tarball does not contain dist output`);
  }
  packaged.push({ ...candidate, version: packageJson.version, tarball: basename(tarball), sha256: sha256(tarball) });
}

mkdirSync(resolve(generatedPath, '..'), { recursive: true });
writeFileSync(generatedPath, `${JSON.stringify({ packages: packaged }, null, 2)}\n`);
console.log(readFileSync(generatedPath, 'utf8'));
