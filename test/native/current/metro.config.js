const { makeMetroConfig } = require('@rnx-kit/metro-config');

module.exports = makeMetroConfig({
  resolver: {
    // Disposable fixtures must not reuse an ancestor checkout's Watchman index.
    useWatchman: false,
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
});
