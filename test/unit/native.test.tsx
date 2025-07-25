// @ts-ignore
(typeof global === 'undefined' ? window : global).IS_REACT_ACT_ENVIRONMENT = true;

import { Portal, PortalProvider } from '@gorhom/portal';
import assert from 'assert';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { EventProvider } from 'react-native-event';
// @ts-ignore
import { Active, ActiveBoundary } from 'react-native-outside';
import { useRef } from 'react-ref-boundary';
import { act, create } from 'react-test-renderer';

describe('react-native', () => {
  it('Active', async () => {
    type ComponentProps = {
      isActive?: boolean | undefined;
      setIsActive?: Dispatch<SetStateAction<boolean>>;
    };

    const Component = React.forwardRef(({ isActive, setIsActive }: ComponentProps, ref: RefObject<View>) => (
      <View ref={ref}>
        <Text testID="text">{isActive ? 'active' : 'not active'}</Text>
        <TouchableOpacity
          testID="toggle"
          onPress={() => {
            setIsActive(!isActive);
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
    act(() => root.findByProps({ testID: 'toggle' }).props.onPress({ target: root.findByProps({ testID: 'toggle' }) }));
    assert.equal(root.findByProps({ testID: 'text' }).props.children, 'active');

    // outside
    act(() => {
      const event = {
        target: root.findByProps({ testID: 'outside' }),
        persist() {
          /* empty */
        },
      };
      root.findByProps({ testID: 'outside' }).props.onPress(event);
      // emulate onStartShouldSetResponderCapture
      root.findAll((node) => {
        if (node.props?.onStartShouldSetResponderCapture) node.props.onStartShouldSetResponderCapture(event);
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

    const Component = React.forwardRef(({ isActive, setIsActive }: ComponentProps, ref: RefObject<View>) => (
      <View ref={ref}>
        <Text testID="text">{isActive ? 'active' : 'not active'}</Text>
        <TouchableOpacity
          testID="toggle"
          onPress={() => {
            setIsActive(!isActive);
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
    act(() => root.findByProps({ testID: 'toggle' }).props.onPress({ target: root.findByProps({ testID: 'toggle' }) }));
    assert.equal(root.findByProps({ testID: 'text' }).props.children, 'active');

    // inside
    act(() =>
      root.findByProps({ testID: 'portal-click' }).props.onPress({
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
      root.findByProps({ testID: 'outside' }).props.onPress(event);
      // emulate onStartShouldSetResponderCapture
      root.findAll((node) => {
        if (node.props?.onStartShouldSetResponderCapture) node.props.onStartShouldSetResponderCapture(event);
      });
    });
    assert.equal(root.findByProps({ testID: 'text' }).props.children, 'not active');
  });
});
