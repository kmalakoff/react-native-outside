const assert = require('assert');
const { Active, ActiveBoundary } = require('react-native-outside/dist/umd/react-native-outside.min.js');

describe('exports react-native-outside/dist/umd/react-native-outside.js', () => {
  it('defaults', () => {
    assert.equal(typeof Active, 'function');
    assert.equal(typeof ActiveBoundary, 'function');
  });
});
