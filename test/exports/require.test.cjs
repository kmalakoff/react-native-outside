const assert = require('assert');
const { Active, ActiveBoundary } = require('react-native-outside');

describe('exports .ts', () => {
  it('defaults', () => {
    assert.equal(typeof Active, 'function');
    assert.equal(typeof ActiveBoundary, 'function');
  });
});
