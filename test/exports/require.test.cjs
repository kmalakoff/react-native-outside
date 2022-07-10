const assert = require('assert');
const { Active, ActiveBoundary } = require('react-native-outside');

describe('exports .ts', function () {
  it('defaults', function () {
    assert.equal(typeof Active, 'function');
    assert.equal(typeof ActiveBoundary, 'function');
  });
});
