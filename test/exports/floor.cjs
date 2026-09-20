const assert = require('assert');
const path = require('path');

assert.strictEqual(process.versions.node, '16.0.0');
const manifestPath = require.resolve('react-native-outside/package.json');
const manifest = require(manifestPath);
assert.strictEqual(require.resolve('react-native-outside'), path.resolve(path.dirname(manifestPath), manifest.main));
console.log('Node 16.0.0: native package CommonJS resolution passed; native code is not executed.');
