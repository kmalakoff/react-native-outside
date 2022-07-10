import assert from 'assert';
import { Active, ActiveBoundary } from 'react-native-outside';

describe('exports .mjs', function () {
  it('defaults', function () {
    assert.equal(typeof Active, 'function');
    assert.equal(typeof ActiveBoundary, 'function');
  });
});
