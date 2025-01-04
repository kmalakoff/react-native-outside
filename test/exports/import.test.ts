import assert from 'assert';
// @ts-ignore
import { Active, ActiveBoundary } from 'react-native-outside';

describe('exports .mjs', () => {
  it('defaults', () => {
    assert.equal(typeof Active, 'function');
    assert.equal(typeof ActiveBoundary, 'function');
  });
});
