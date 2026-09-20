import assert from 'assert';
import { containsTarget } from '../../../src/lib/nativeTarget.ts';

describe('native target containment', () => {
  it('checks legacy native tag trees and rejects unrelated values', () => {
    const descendant = { _nativeTag: 3 };
    const element = { _nativeTag: 1, _children: [{ _nativeTag: 2, _children: [descendant] }] };
    const outside = { _nativeTag: 4 };

    assert.equal(containsTarget(element, element), true);
    assert.equal(containsTarget(element, descendant), true);
    assert.equal(containsTarget(element, descendant._nativeTag), true);
    assert.equal(containsTarget(element, outside), false);
    assert.equal(containsTarget(element, outside._nativeTag), false);
    assert.equal(containsTarget(element, {}), false);
    assert.equal(containsTarget({}, 1), false);
  });
});
