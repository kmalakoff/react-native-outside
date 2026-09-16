import assert from 'assert';
import { createRequire } from 'module';
import { satisfies } from 'semver';
import { containsTarget } from '../../../src/lib/nativeTarget.ts';

const require = createRequire(import.meta.url);
const jsdomPackage = require('jsdom/package.json') as { engines?: { node?: string } };
const supportsJsdom = typeof jsdomPackage.engines?.node === 'string' && satisfies(process.versions.node, jsdomPackage.engines.node);

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

  const domSuite = supportsJsdom ? describe : describe.skip;
  domSuite('DOM hosts', () => {
    it('uses real DOM containment for host and target nodes', async () => {
      const { JSDOM } = await import('jsdom');
      const dom = new JSDOM('<!doctype html><main><span></span></main><aside></aside>');
      try {
        const host = dom.window.document.querySelector('main');
        const inside = dom.window.document.querySelector('main span');
        const outside = dom.window.document.querySelector('aside');
        assert.ok(host);
        assert.ok(inside);
        assert.ok(outside);
        assert.equal(containsTarget(host, host), true);
        assert.equal(containsTarget(host, inside), true);
        assert.equal(containsTarget(host, outside), false);
        assert.equal(containsTarget(host, {}), false);
      } finally {
        dom.window.close();
      }
    });
  });
});
