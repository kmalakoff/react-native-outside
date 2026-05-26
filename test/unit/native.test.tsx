((typeof global === 'undefined' ? window : global) as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import { Portal, PortalProvider } from '@gorhom/portal';
import assert from 'assert';
import type { Dispatch, ForwardedRef, SetStateAction } from 'react';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { EventProvider } from 'react-native-event';
import { Active, ActiveBoundary } from 'react-native-outside';
import { useRef } from 'react-ref-boundary';
import { act, create } from 'react-test-renderer';

describe('react-native', () => {
  it('Active', async () => {
    type ComponentProps = {
      isActive?: boolean | undefined;
      setIsActive?: Dispatch<SetStateAction<boolean>>;
    };

    const Component = React.forwardRef(({ isActive, setIsActive }: ComponentProps, ref: ForwardedRef<View>) => (
      <View ref={ref}>
        <Text testID="text">{isActive ? 'active' : 'not active'}</Text>
        <TouchableOpacity
          testID="toggle"
          onPress={() => {
            setIsActive?.(!isActive);
          }}
        />
      </View>
    ));

    const { root } = await act(() =>
      create(
        <View>
          <EventProvider>
            <Active>
              <Component />
            </Active>
          </EventProvider>
          <TouchableOpacity
            testID="outside"
            onPress={() => {
              /* empty */
            }}
          />
        </View>
      )
    );

    // inside
    assert.equal(root.findByProps({ testID: 'text' }).props.children, 'not active');
    act(() => (root.findByProps({ testID: 'toggle' }).props.onPress as (e: unknown) => void)({ target: root.findByProps({ testID: 'toggle' }) }));
    assert.equal(root.findByProps({ testID: 'text' }).props.children, 'active');

    // outside
    act(() => {
      const event = {
        target: root.findByProps({ testID: 'outside' }),
        persist() {
          /* empty */
        },
      };
      (root.findByProps({ testID: 'outside' }).props.onPress as (e: unknown) => void)(event);
      // emulate onStartShouldSetResponderCapture
      root.findAll((node) => {
        if (node.props?.onStartShouldSetResponderCapture) (node.props.onStartShouldSetResponderCapture as (e: unknown) => void)(event);
        return false;
      });
    });
    assert.equal(root.findByProps({ testID: 'text' }).props.children, 'not active');
  });

  it('ActiveBoundary', async () => {
    type ComponentProps = {
      isActive?: boolean | undefined;
      setIsActive?: Dispatch<SetStateAction<boolean>>;
    };

    function PortalComponent() {
      const ref = useRef(null);
      return (
        <Portal>
          <TouchableOpacity
            ref={ref}
            testID="portal-click"
            onPress={() => {
              // event.stopPropagation();
            }}
          />
        </Portal>
      );
    }

    const Component = React.forwardRef(({ isActive, setIsActive }: ComponentProps, ref: ForwardedRef<View>) => (
      <View ref={ref}>
        <Text testID="text">{isActive ? 'active' : 'not active'}</Text>
        <TouchableOpacity
          testID="toggle"
          onPress={() => {
            setIsActive?.(!isActive);
          }}
        />
        <PortalComponent />
      </View>
    ));

    const { root } = await act(() =>
      create(
        <PortalProvider>
          <EventProvider>
            <ActiveBoundary>
              <Component />
            </ActiveBoundary>
          </EventProvider>
          <TouchableOpacity
            testID="outside"
            onPress={() => {
              // event.stopPropagation();
            }}
          />
        </PortalProvider>
      )
    );

    // inside
    assert.equal(root.findByProps({ testID: 'text' }).props.children, 'not active');
    act(() => (root.findByProps({ testID: 'toggle' }).props.onPress as (e: unknown) => void)({ target: root.findByProps({ testID: 'toggle' }) }));
    assert.equal(root.findByProps({ testID: 'text' }).props.children, 'active');

    // inside
    act(() =>
      (root.findByProps({ testID: 'portal-click' }).props.onPress as (e: unknown) => void)({
        target: root.findByProps({ testID: 'portal-click' }),
      })
    );
    assert.equal(root.findByProps({ testID: 'text' }).props.children, 'active');

    // outside
    act(() => {
      const event = {
        target: root.findByProps({ testID: 'outside' }),
        persist() {
          /* empty */
        },
      };
      (root.findByProps({ testID: 'outside' }).props.onPress as (e: unknown) => void)(event);
      // emulate onStartShouldSetResponderCapture
      root.findAll((node) => {
        if (node.props?.onStartShouldSetResponderCapture) (node.props.onStartShouldSetResponderCapture as (e: unknown) => void)(event);
        return false;
      });
    });
    assert.equal(root.findByProps({ testID: 'text' }).props.children, 'not active');
  });
});
