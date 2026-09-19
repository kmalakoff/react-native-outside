import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../..', import.meta.url));

export async function prepareNativeWebProfile(profile) {
  const require = createRequire(path.join(root, 'test/browser', profile, 'package.json'));
  const manifestPath = require.resolve('react-native-web/package.json');
  const entryPoint = path.join(path.dirname(manifestPath), require(manifestPath).module);
  const output = path.join(root, '.tmp/react-browser', profile, 'react-native-web.js');
  await mkdir(path.dirname(output), { recursive: true });
  await build({
    entryPoints: [entryPoint],
    outfile: output,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    define: { 'process.env.NODE_ENV': '"development"', global: 'globalThis' },
    plugins: [
      {
        name: 'native-web-react-instance',
        setup(build) {
          build.onResolve({ filter: /^(react|react-dom)$/ }, ({ path: name, namespace }) => (namespace === 'react-external' ? { path: name, external: true } : { path: name, namespace: 'react-external' }));
          build.onLoad({ filter: /.*/, namespace: 'react-external' }, ({ path: name }) => ({
            contents: `export { default } from '${name}'; export * from '${name}';`,
            loader: 'js',
          }));
        },
      },
    ],
  });
  const url = `/.tmp/react-browser/${profile}/react-native-web.js`;
  return { 'react-native': url, 'react-native-web': url };
}
