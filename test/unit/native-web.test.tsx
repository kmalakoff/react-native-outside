((typeof global === 'undefined' ? window : global) as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import assert from 'assert';
import type { ComponentRef, ForwardedRef } from 'react';
import React, { Fragment } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { EventProvider, useEvent } from 'react-native-event';
import { Active, ActiveBoundary, type ActiveBoundaryProps, type ActiveInjectedProps, type ActiveProps } from 'react-native-outside';
import { containsTarget } from '../../src/lib/nativeTarget.ts';
import { act, type MountedRoot, mount } from '../lib/react-dom.tsx';

type ViewRef = ComponentRef<typeof View>;

function dispatchMouseEvent(target: Element, type: string) {
  target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: 1 }));
}

describe('react-native-web DOM events', () => {
  it('rejects fragments and multiple children before rendering hooks', () => {
    assert.throws(() => Active({ children: (<Fragment />) as unknown as ActiveProps['children'] }), /non-Fragment child/);
    assert.throws(() => Active({ children: [<View key="a" />, <View key="b" />] as unknown as ActiveProps['children'] }), /single React element child/);
    assert.throws(() => ActiveBoundary({ children: (<Fragment />) as unknown as ActiveBoundaryProps['children'] }), /non-Fragment child/);
    assert.throws(() => ActiveBoundary({ children: [<View key="a" />, <View key="b" />] as unknown as ActiveBoundaryProps['children'] }), /single React element child/);
  });

  it('checks DOM hosts directly and rejects invalid targets', () => {
    const host = document.createElement('main');
    const inside = document.createElement('span');
    const outside = document.createElement('aside');
    host.appendChild(inside);
    assert.equal(containsTarget(host, host), true);
    assert.equal(containsTarget(host, inside), true);
    assert.equal(containsTarget(host, outside), false);
    assert.equal(containsTarget(host, {}), false);
  });
  it('keeps Active inside and dismisses outside while preserving an object ref', () => {
    const container = document.createElement('div');
    document.body.append(container);
    let root!: MountedRoot;
    act(() => {
      root = mount(container, null);
    });
    const consumerRef = React.createRef<ViewRef>();
    let eventCount = 0;
    const Component = React.forwardRef(({ isActive, setIsActive }: Partial<ActiveInjectedProps>, ref: ForwardedRef<ViewRef>) => (
      <View ref={ref} testID="active-inside">
        <Text testID="active-status">{isActive ? 'active' : 'inactive'}</Text>
        <TouchableOpacity testID="active-toggle" onPress={() => setIsActive?.((current) => !current)} />
      </View>
    ));
    function Probe() {
      useEvent(() => {
        eventCount += 1;
      }, []);
      return null;
    }

    try {
      act(() => {
        root.render(
          <EventProvider>
            <Active>
              <Component ref={consumerRef} />
            </Active>
            <TouchableOpacity testID="active-outside" />
            <Probe />
          </EventProvider>
        );
      });

      const host = consumerRef.current;
      assert.ok(host instanceof HTMLElement);
      const status = container.querySelector('[data-testid="active-status"]');
      const toggle = container.querySelector('[data-testid="active-toggle"]');
      const inside = container.querySelector('[data-testid="active-inside"]');
      const outside = container.querySelector('[data-testid="active-outside"]');
      assert.ok(status);
      assert.ok(toggle);
      assert.ok(inside);
      assert.ok(outside);
      assert.equal(status.textContent, 'inactive');

      act(() => dispatchMouseEvent(toggle, 'click'));
      assert.equal(status.textContent, 'active');
      act(() => dispatchMouseEvent(inside, 'mousedown'));
      assert.equal(status.textContent, 'active');
      assert.ok(eventCount > 0, 'inside event did not enter EventProvider');
      act(() => dispatchMouseEvent(outside, 'mousedown'));
      assert.equal(status.textContent, 'inactive');
      assert.ok(eventCount > 1, 'outside event did not enter EventProvider');
    } finally {
      act(() => root.unmount());
      assert.equal(consumerRef.current, null);
      container.remove();
    }
  });

  it('keeps ActiveBoundary inside and dismisses outside while cleaning a callback ref', () => {
    const container = document.createElement('div');
    document.body.append(container);
    let root!: MountedRoot;
    act(() => {
      root = mount(container, null);
    });
    const callbackValues: Array<ViewRef | null> = [];
    const consumerRef = (value: ViewRef | null) => {
      callbackValues.push(value);
    };
    let eventCount = 0;
    const Component = React.forwardRef(({ isActive, setIsActive }: Partial<ActiveInjectedProps>, ref: ForwardedRef<ViewRef>) => (
      <View ref={ref} testID="boundary-inside">
        <Text testID="boundary-status">{isActive ? 'active' : 'inactive'}</Text>
        <TouchableOpacity testID="boundary-toggle" onPress={() => setIsActive?.((current) => !current)} />
      </View>
    ));
    function Probe() {
      useEvent(() => {
        eventCount += 1;
      }, []);
      return null;
    }

    try {
      act(() => {
        root.render(
          <EventProvider>
            <ActiveBoundary>
              <Component ref={consumerRef} />
            </ActiveBoundary>
            <TouchableOpacity testID="boundary-outside" />
            <Probe />
          </EventProvider>
        );
      });

      const host = callbackValues[0];
      assert.ok(host instanceof HTMLElement);
      const status = container.querySelector('[data-testid="boundary-status"]');
      const toggle = container.querySelector('[data-testid="boundary-toggle"]');
      const inside = container.querySelector('[data-testid="boundary-inside"]');
      const outside = container.querySelector('[data-testid="boundary-outside"]');
      assert.ok(status);
      assert.ok(toggle);
      assert.ok(inside);
      assert.ok(outside);
      assert.equal(status.textContent, 'inactive');

      act(() => dispatchMouseEvent(toggle, 'click'));
      assert.equal(status.textContent, 'active');
      act(() => dispatchMouseEvent(inside, 'mousedown'));
      assert.equal(status.textContent, 'active');
      assert.ok(eventCount > 0, 'inside event did not enter EventProvider');
      act(() => dispatchMouseEvent(outside, 'mousedown'));
      assert.equal(status.textContent, 'inactive');
      assert.ok(eventCount > 1, 'outside event did not enter EventProvider');
    } finally {
      act(() => root.unmount());
      assert.equal(callbackValues[callbackValues.length - 1], null);
      container.remove();
    }
  });
  for (const Wrapper of [Active, ActiveBoundary]) {
    it(`keeps ${Wrapper.name} instances independent`, () => {
      const container = document.createElement('div');
      document.body.append(container);
      let root!: MountedRoot;
      act(() => {
        root = mount(container, null);
      });
      const Component = React.forwardRef(({ id, isActive, setIsActive }: Partial<ActiveInjectedProps> & { id: string }, ref: ForwardedRef<ViewRef>) => (
        <View ref={ref} testID={`${id}-inside`}>
          <Text testID={`${id}-status`}>{isActive ? 'active' : 'inactive'}</Text>
          <TouchableOpacity testID={`${id}-toggle`} onPress={() => setIsActive?.(true)} />
        </View>
      ));
      const element = (id: string) => {
        const found = container.querySelector(`[data-testid="${id}"]`);
        assert.ok(found);
        return found;
      };
      try {
        act(() => {
          root.render(
            <EventProvider>
              <Wrapper>
                <Component id="first" />
              </Wrapper>
              <Wrapper>
                <Component id="second" />
              </Wrapper>
            </EventProvider>
          );
        });
        act(() => {
          dispatchMouseEvent(element('first-toggle'), 'click');
          dispatchMouseEvent(element('second-toggle'), 'click');
        });
        assert.equal(element('first-status').textContent, 'active');
        assert.equal(element('second-status').textContent, 'active');
        act(() => dispatchMouseEvent(element('first-inside'), 'mousedown'));
        assert.equal(element('first-status').textContent, 'active');
        assert.equal(element('second-status').textContent, 'inactive');
      } finally {
        act(() => root.unmount());
        container.remove();
      }
    });
  }
});
