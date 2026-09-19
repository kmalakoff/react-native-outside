import { basename } from 'node:path';

const packageName = process.env.CANDIDATE_PACKAGE;
const candidateRepository = process.env.CANDIDATE_REPOSITORY;
const candidateSha = process.env.CANDIDATE_SHA;
const eventName = process.env.CALLER_EVENT;
const callerRepository = process.env.CALLER_REPOSITORY;
const callerSha = process.env.CALLER_SHA;
const pullRequestRepository = process.env.PULL_REQUEST_REPOSITORY;
const pullRequestSha = process.env.PULL_REQUEST_SHA;
const profile = process.env.NATIVE_PROFILE ?? 'current';

const knownPackages = new Set(['react-native-contains', 'react-native-event', 'react-native-outside', 'react-ref-boundary']);

function fail(message: string): never {
  throw new Error(message);
}

if (profile !== 'current' && profile !== 'minimum' && profile !== 'all') fail(`Unsupported native profile: ${profile}`);

if (!packageName || !knownPackages.has(packageName)) fail(`Unknown native candidate package: ${packageName ?? '<missing>'}`);
const canonicalRepository = `kmalakoff/${packageName}`;
if (!candidateRepository || basename(candidateRepository) !== packageName || candidateRepository.includes('..')) {
  fail(`Candidate repository ${candidateRepository ?? '<missing>'} does not match ${packageName}`);
}
if (!candidateSha || !/^[0-9a-f]{40}$/i.test(candidateSha)) fail('candidate_sha must be a full 40-character commit SHA');
if (!eventName || !callerRepository || !callerSha) fail('The reusable workflow did not receive its caller identity');

const associatedRepository = eventName === 'pull_request' ? pullRequestRepository : callerRepository;
if (candidateRepository !== canonicalRepository && candidateRepository !== associatedRepository) {
  fail(`Only the caller-associated repository may override ${canonicalRepository}`);
}

if (eventName === 'pull_request') {
  if (!pullRequestRepository || !pullRequestSha) fail('The pull request head identity is missing');
  if (candidateRepository !== pullRequestRepository || candidateSha !== pullRequestSha) {
    fail('A pull request candidate must use its head repository and head SHA');
  }
} else if (eventName === 'push') {
  if (candidateRepository !== callerRepository || candidateSha !== callerSha) {
    fail('A push candidate must use the caller repository and github.sha');
  }
} else if (eventName === 'workflow_dispatch') {
  if (candidateRepository !== callerRepository || candidateSha !== callerSha) {
    fail('A manual native pilot must use the caller repository and github.sha');
  }
} else {
  fail(`Native candidate validation does not accept ${eventName}`);
}

console.log(`Validated ${packageName} from ${candidateRepository}@${candidateSha} for ${eventName}`);
