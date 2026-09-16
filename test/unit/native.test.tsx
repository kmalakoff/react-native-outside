((typeof global === 'undefined' ? window : global) as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import { PortalHost, PortalProvider } from '@gorhom/portal';
import assert from 'assert';
import type { ComponentRef, ForwardedRef } from 'react';
import React, { Fragment } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { EventProvider } from 'react-native-event';
import { Active, ActiveBoundary, type ActiveBoundaryProps, type ActiveInjectedProps, type ActiveProps } from 'react-native-outside';
import { act, create } from 'react-test-renderer';

describe('react-native renderer', () => {
  it('preserves Active child interactions', async () => {
    const Component = React.forwardRef(({ isActive, setIsActive }: Partial<ActiveInjectedProps>, ref: ForwardedRef<ComponentRef<typeof View>>) => (
      <View ref={ref}>
        <Text testID="text">{isActive ? 'active' : 'not active'}</Text>
        <TouchableOpacity testID="toggle" onPress={() => setIsActive?.((current) => !current)} />
      </View>
    ));

    const renderer = await act(() =>
      create(
        <EventProvider>
          <Active>
            <Component />
          </Active>
        </EventProvider>
      )
    );
    assert.equal(renderer.root.findByProps({ testID: 'text' }).props.children, 'not active');

    const toggle = renderer.root.findByProps({ testID: 'toggle' }).props.onPress;
    assert.equal(typeof toggle, 'function');
    act(() => (toggle as () => void)());
    assert.equal(renderer.root.findByProps({ testID: 'text' }).props.children, 'active');
    act(() => renderer.unmount());
  });

  it('preserves ActiveBoundary state for its main child', async () => {
    const Component = React.forwardRef(({ isActive, setIsActive }: Partial<ActiveInjectedProps>, ref: ForwardedRef<ComponentRef<typeof View>>) => (
      <View ref={ref}>
        <Text testID="text">{isActive ? 'active' : 'not active'}</Text>
        <TouchableOpacity testID="toggle" onPress={() => setIsActive?.((current) => !current)} />
      </View>
    ));

    const renderer = await act(() =>
      create(
        <PortalProvider shouldAddRootHost={false}>
          <EventProvider>
            <PortalHost name="root" />
            <ActiveBoundary>
              <Component />
            </ActiveBoundary>
          </EventProvider>
        </PortalProvider>
      )
    );
    const toggle = renderer.root.findByProps({ testID: 'toggle' }).props.onPress;
    assert.equal(typeof toggle, 'function');
    act(() => (toggle as () => void)());
    assert.equal(renderer.root.findByProps({ testID: 'text' }).props.children, 'active');
    act(() => renderer.unmount());
  });

  it('rejects fragments and multiple children', () => {
    assert.throws(() => Active({ children: (<Fragment />) as unknown as ActiveProps['children'] }), /non-Fragment child/);
    assert.throws(() => Active({ children: [<View key="a" />, <View key="b" />] as unknown as ActiveProps['children'] }), /single React element child/);
    assert.throws(() => ActiveBoundary({ children: (<Fragment />) as unknown as ActiveBoundaryProps['children'] }), /non-Fragment child/);
    assert.throws(() => ActiveBoundary({ children: [<View key="a" />, <View key="b" />] as unknown as ActiveBoundaryProps['children'] }), /single React element child/);
  });
});
