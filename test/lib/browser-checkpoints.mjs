import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const tsds = createRequire(import.meta.url).resolve('ts-dev-stack/bin/cli.js');
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run checkpoints through npm run test:browser:checkpoints.');
const files = ['test/exports/import.test.ts', 'test/exports/import.test.mjs', 'test/unit/native-web.test.tsx'];
for (const file of files) if (!existsSync(file)) throw new Error(`Missing checkpoint assertion file: ${file}`);
for (const profile of ['react17', 'react18']) {
  execFileSync(process.execPath, [npmCli, 'ci', '--prefix', `test/browser/${profile}`, '--ignore-scripts', '--no-audit', '--no-fund'], { stdio: 'inherit' });
  execFileSync(process.execPath, [tsds, 'test:browser', '--config', `wtr.${profile}.config.mjs`, ...files], { stdio: 'inherit' });
}
