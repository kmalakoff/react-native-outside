import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { x } from 'tar';

export function installPackedPackage(source: string, destination: string, archiveDirectory: string): void {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error('Run consumer checks through npm.');
  const packed = spawnSync(process.execPath, [npmCli, 'pack', source, '--json', '--ignore-scripts', '--pack-destination', archiveDirectory], { encoding: 'utf8', timeout: 120_000 });
  if (packed.error) throw packed.error;
  if (packed.status !== 0) throw new Error(`Consumer packing failed: ${packed.stderr}`);
  const output = JSON.parse(packed.stdout);
  const entries = Array.isArray(output) ? output : Object.values(output);
  if (entries.length !== 1 || typeof entries[0]?.filename !== 'string') throw new Error('Expected one packed consumer package.');
  const filename = entries[0].filename;
  if (basename(filename) !== filename) throw new Error('Invalid packed package filename.');
  mkdirSync(destination, { recursive: true });
  x({ file: join(archiveDirectory, filename), cwd: destination, strip: 1, sync: true });
}
