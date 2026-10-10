import { importMapsPlugin } from '@web/dev-server-import-maps';
import createConfig from 'tsds-web-test-runner/createConfig.mjs';

// esm.sh cannot detect React 16.8's CommonJS named exports, so the floor loads from jspm.
// No CDN exposes react-dom 16.8's named exports; test/lib/react-dom-16.8.mjs re-exports them from jspm's default.
const JSPM = 'https://ga.jspm.io/npm:';
const ESM_SH = 'https://esm.sh/';

// esm.sh mis-converts react-native-web 0.13's inline-style-prefixer 5 dependency; jspm serves its exact dependency tree.
const REACT_NATIVE_WEB_0_13 = {
  'react-native': 'https://ga.jspm.io/npm:react-native-web@0.13.18/dist/cjs/dev.index.js',
  'react-native-web': 'https://ga.jspm.io/npm:react-native-web@0.13.18/dist/cjs/dev.index.js',
  'array-find-index': 'https://ga.jspm.io/npm:array-find-index@1.0.2/index.js',
  'create-react-class': 'https://ga.jspm.io/npm:create-react-class@15.7.0/index.js',
  'css-in-js-utils/lib/hyphenateProperty': 'https://ga.jspm.io/npm:css-in-js-utils@2.0.1/lib/hyphenateProperty.js',
  'css-in-js-utils/lib/isPrefixedValue': 'https://ga.jspm.io/npm:css-in-js-utils@2.0.1/lib/isPrefixedValue.js',
  'fbjs/lib/ExecutionEnvironment': 'https://ga.jspm.io/npm:fbjs@1.0.0/lib/ExecutionEnvironment.js',
  'fbjs/lib/invariant': 'https://ga.jspm.io/npm:fbjs@1.0.0/lib/dev.invariant.js',
  'fbjs/lib/performanceNow': 'https://ga.jspm.io/npm:fbjs@1.0.0/lib/performanceNow.js',
  'fbjs/lib/warning': 'https://ga.jspm.io/npm:fbjs@1.0.0/lib/dev.warning.js',
  'hyphenate-style-name': 'https://ga.jspm.io/npm:hyphenate-style-name@1.1.0/index.js',
  'inline-style-prefixer/lib/createPrefixer': 'https://ga.jspm.io/npm:inline-style-prefixer@5.1.2/lib/createPrefixer.js',
  'inline-style-prefixer/lib/plugins/backgroundClip': 'https://ga.jspm.io/npm:inline-style-prefixer@5.1.2/lib/plugins/backgroundClip.js',
  'inline-style-prefixer/lib/plugins/crossFade': 'https://ga.jspm.io/npm:inline-style-prefixer@5.1.2/lib/plugins/crossFade.js',
  'inline-style-prefixer/lib/plugins/cursor': 'https://ga.jspm.io/npm:inline-style-prefixer@5.1.2/lib/plugins/cursor.js',
  'inline-style-prefixer/lib/plugins/filter': 'https://ga.jspm.io/npm:inline-style-prefixer@5.1.2/lib/plugins/filter.js',
  'inline-style-prefixer/lib/plugins/flex': 'https://ga.jspm.io/npm:inline-style-prefixer@5.1.2/lib/plugins/flex.js',
  'inline-style-prefixer/lib/plugins/flexboxIE': 'https://ga.jspm.io/npm:inline-style-prefixer@5.1.2/lib/plugins/flexboxIE.js',
  'inline-style-prefixer/lib/plugins/flexboxOld': 'https://ga.jspm.io/npm:inline-style-prefixer@5.1.2/lib/plugins/flexboxOld.js',
  'inline-style-prefixer/lib/plugins/gradient': 'https://ga.jspm.io/npm:inline-style-prefixer@5.1.2/lib/plugins/gradient.js',
  'inline-style-prefixer/lib/plugins/grid': 'https://ga.jspm.io/npm:inline-style-prefixer@5.1.2/lib/plugins/grid.js',
  'inline-style-prefixer/lib/plugins/imageSet': 'https://ga.jspm.io/npm:inline-style-prefixer@5.1.2/lib/plugins/imageSet.js',
  'inline-style-prefixer/lib/plugins/logical': 'https://ga.jspm.io/npm:inline-style-prefixer@5.1.2/lib/plugins/logical.js',
  'inline-style-prefixer/lib/plugins/position': 'https://ga.jspm.io/npm:inline-style-prefixer@5.1.2/lib/plugins/position.js',
  'inline-style-prefixer/lib/plugins/sizing': 'https://ga.jspm.io/npm:inline-style-prefixer@5.1.2/lib/plugins/sizing.js',
  'inline-style-prefixer/lib/plugins/transition': 'https://ga.jspm.io/npm:inline-style-prefixer@5.1.2/lib/plugins/transition.js',
  'normalize-css-color': 'https://ga.jspm.io/npm:normalize-css-color@1.0.2/index.js',
  'object-assign': 'https://ga.jspm.io/npm:object-assign@4.1.1/index.js',
  process: 'https://ga.jspm.io/npm:@jspm/core@2.1.0/nodelibs/browser/process.js',
  'prop-types': 'https://ga.jspm.io/npm:prop-types@15.8.1/dev.index.js',
  'prop-types/checkPropTypes': 'https://ga.jspm.io/npm:prop-types@15.8.1/dev.checkPropTypes.js',
  'react-is': 'https://ga.jspm.io/npm:react-is@16.13.1/dev.index.js',
  scheduler: 'https://ga.jspm.io/npm:scheduler@0.13.6/dev.index.js',
  'scheduler/tracing': 'https://ga.jspm.io/npm:scheduler@0.13.6/dev.tracing.js',
};

// React 16/17 have no react-dom/client; mapping it to react-dom leaves createRoot undefined for the legacy mount path.
const PROFILES = {
  minimum: {
    port: 9022,
    imports: {
      react: `${JSPM}react@16.8.0/dev.index.js`,
      'react-dom': '/test/lib/react-dom-16.8.mjs',
      'react-dom/client': '/test/lib/react-dom-16.8.mjs',
      'react-dom/test-utils': `${JSPM}react-dom@16.8.0/dev.test-utils.js`,
      'object-assign': `${JSPM}object-assign@4.1.1/index.js`,
      'prop-types/checkPropTypes': `${JSPM}prop-types@15.8.1/dev.checkPropTypes.js`,
      scheduler: `${JSPM}scheduler@0.13.6/dev.index.js`,
      'scheduler/tracing': `${JSPM}scheduler@0.13.6/dev.tracing.js`,
      ...REACT_NATIVE_WEB_0_13,
    },
  },
  react17: {
    port: 9106,
    imports: {
      react: `${ESM_SH}react@17.0.2?dev`,
      'react-dom': `${ESM_SH}react-dom@17.0.2?dev`,
      'react-dom/client': `${ESM_SH}react-dom@17.0.2?dev`,
      'react-dom/test-utils': `${ESM_SH}react-dom@17.0.2/test-utils?dev`,
      ...REACT_NATIVE_WEB_0_13,
    },
  },
  react18: {
    port: 9107,
    imports: {
      react: `${ESM_SH}react@18.3.1?dev`,
      'react-dom': `${ESM_SH}react-dom@18.3.1?dev`,
      'react-dom/client': `${ESM_SH}react-dom@18.3.1/client?dev`,
      'react-dom/test-utils': `${ESM_SH}react-dom@18.3.1/test-utils?dev`,
      'react-native-web': `${ESM_SH}react-native-web@0.21.2?dev&external=react,react-dom`,
      'react-native': `${ESM_SH}react-native-web@0.21.2?dev&external=react,react-dom`,
    },
  },
  current: {
    port: 9023,
    imports: {
      react: `${ESM_SH}react@19.3.0?dev`,
      'react-dom': `${ESM_SH}react-dom@19.3.0?dev`,
      'react-dom/client': `${ESM_SH}react-dom@19.3.0/client?dev`,
      'react-dom/test-utils': `${ESM_SH}react-dom@19.3.0/test-utils?dev`,
      'react-native-web': `${ESM_SH}react-native-web@0.21.2?dev&external=react,react-dom`,
      'react-native': `${ESM_SH}react-native-web@0.21.2?dev&external=react,react-dom`,
    },
  },
};

export function profileConfig(profile) {
  const { port, imports } = PROFILES[profile];
  const config = createConfig({ hostname: 'localhost', port, plugins: [importMapsPlugin({ inject: { importMap: { imports } } })] });
  config.browsers = [config.browsers[0]];
  return config;
}

export default profileConfig('current');
