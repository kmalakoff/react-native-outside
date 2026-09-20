import { importMapsPlugin } from '@web/dev-server-import-maps';
import createConfig from 'tsds-web-test-runner/createConfig.mjs';
import { prepareReactProfile } from './test/lib/local-react-bundle.mjs';
import { prepareNativeWebProfile } from './test/lib/native-web-bundle.mjs';

const profile = process.env.REACT_TEST_PROFILE || 'current';
if (!['minimum', 'current', 'react17', 'react18'].includes(profile)) throw new Error(`Unknown React browser profile: ${profile}`);

const config = createConfig({
  hostname: 'localhost',
  port: { minimum: 9022, current: 9023, react17: 9106, react18: 9107 }[profile],
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
