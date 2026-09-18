import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { device: { type: 'string' }, runtime: { type: 'string' } } });
const result = spawnSync('xcrun', ['simctl', 'list', 'devices', 'available', '--json'], { encoding: 'utf8' });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(result.stderr);
const data = JSON.parse(result.stdout) as { devices: Record<string, Array<{ name: string; udid: string; state: string; isAvailable: boolean }>> };
const runtimes = values.runtime ? [values.runtime] : Object.keys(data.devices);
const device = runtimes.flatMap((runtime) => data.devices[runtime] ?? []).find((candidate) => candidate.isAvailable && (!values.device || candidate.name === values.device));
if (!device) throw new Error(`No available simulator matched ${values.device ?? 'any device'}${values.runtime ? ` on ${values.runtime}` : ''}`);
process.stdout.write(`${device.udid}\t${device.state}`);
