import { importMapsPlugin } from '@web/dev-server-import-maps';
import createConfig from 'tsds-web-test-runner/createConfig.mjs';

export default createConfig({
  files: ['test/exports/import.test.ts', 'test/exports/import.test.mjs', 'test/unit/native-web.test.tsx', 'test/unit/native.test.tsx'],
  port: 9012,
  plugins: [
    importMapsPlugin({
      inject: {
        importMap: {
          imports: {
            react: 'https://esm.sh/react@18.3.1?dev',
            'react-dom': 'https://esm.sh/react-dom@18.3.1?dev',
            'react-dom/client': 'https://esm.sh/react-dom@18.3.1/client.js?dev',
            'react-native-web': 'https://esm.sh/react-native-web@0.19.13?dev&external=react,react-dom',
            'react-native': 'https://esm.sh/react-native-web@0.19.13?dev&external=react,react-dom',
            'react-test-renderer': 'https://esm.sh/react-test-renderer@18.3.1?dev',
          },
        },
      },
    }),
  ],
});
