import { importMapsPlugin } from '@web/dev-server-import-maps';
import createConfig from 'tsds-web-test-runner/createConfig.mjs';
import { prepareReactProfile } from './test/lib/local-react-bundle.mjs';
import { prepareNativeWebProfile } from './test/lib/native-web-bundle.mjs';

const profile = process.env.REACT_TEST_PROFILE || 'current';
if (profile !== 'minimum' && profile !== 'current') throw new Error(`Unknown React browser profile: ${profile}`);

const config = createConfig({
  hostname: 'localhost',
  port: profile === 'minimum' ? 9022 : 9023,
  nodeResolve: {
    modulePaths: [`${process.cwd()}/test/browser/${profile}/node_modules`],
  },
});
const localProfile = await prepareReactProfile(profile);
Object.assign(localProfile.imports, await prepareNativeWebProfile(profile));

config.plugins = config.plugins.filter((plugin) => plugin.name !== 'import-map');
config.plugins.push(importMapsPlugin({ inject: { importMap: localProfile } }));
config.browsers = [config.browsers[0]];

export default config;
