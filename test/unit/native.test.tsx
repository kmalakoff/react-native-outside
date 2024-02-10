import assert from 'assert';
import { forwardRef } from 'react';
import { Dispatch, SetStateAction, RefObject } from 'react';
import { create, act } from 'react-test-renderer';

import { View, Text, TouchableOpacity } from 'react-native';
import { Active, ActiveBoundary } from 'react-native-outside';
import { EventProvider } from 'react-native-event';
import { useRef } from 'react-ref-boundary';
import { PortalProvider, Portal } from '@gorhom/portal';

describe('react-native', function () {
  it('Active', async function () {
    type ComponentProps = {
      isActive?: boolean | undefined;
      setIsActive?: Dispatch<SetStateAction<boolean>>;
    };

    const Component = forwardRef(function ({ isActive, setIsActive }: ComponentProps, ref: RefObject<View>) {
      return (
        <View ref={ref}>
          <Text testID="text">{isActive ? 'active' : 'not active'}</Text>
          <TouchableOpacity
            testID="toggle"
            onPress={function () {
              setIsActive(!isActive);
            }}
          />
        </View>
      );
    });

    const { root } = await act(() =>
      create(
        <View>
          <EventProvider>
            <Active>
              <Component />
            </Active>
          </EventProvider>
          <View
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
        if (node.props && node.props.onStartShouldSetResponderCapture) node.props.onStartShouldSetResponderCapture(event);
      });
    });
    assert.equal(root.findByProps({ testID: 'text' }).props.children, 'not active');
  });

  it('ActiveBoundary', async function () {
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
            onPress={function () {
              // event.stopPropagation();
            }}
          />
        </Portal>
      );
    }

    const Component = forwardRef(function ({ isActive, setIsActive }: ComponentProps, ref: RefObject<View>) {
      return (
        <View ref={ref}>
          <Text testID="text">{isActive ? 'active' : 'not active'}</Text>
          <TouchableOpacity
            testID="toggle"
            onPress={function () {
              setIsActive(!isActive);
            }}
          />
          <PortalComponent />
        </View>
      );
    });

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
            onPress={function () {
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
        if (node.props && node.props.onStartShouldSetResponderCapture) node.props.onStartShouldSetResponderCapture(event);
      });
    });
    assert.equal(root.findByProps({ testID: 'text' }).props.children, 'not active');
  });
});
