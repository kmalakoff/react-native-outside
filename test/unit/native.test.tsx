import assert from 'assert';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { View, Text, TouchableOpacity } from 'react-native';
import { Active, ActiveBoundary } from 'react-native-outside';
import { EventProvider } from 'react-native-event';
import { useRef } from 'react-ref-boundary';
import { PortalProvider, Portal } from '@gorhom/portal';

import visit from '../lib/visit';

describe('react-native', function () {
  it('Active', async function () {
    type ComponentProps = {
      isActive?: boolean | undefined;
      setIsActive?: React.Dispatch<React.SetStateAction<boolean>>;
    };

    const Component = React.forwardRef(function (
      { isActive, setIsActive }: ComponentProps,
      ref: React.RefObject<View>,
    ) {
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

    const onPress = (event) => {
      // emulate onStartShouldSetResponderCapture
      event.persist = function () {
        /* empty */
      };
      visit(toJSON(), (element) => {
        if (element.props && element.props.onStartShouldSetResponderCapture)
          element.props.onStartShouldSetResponderCapture(event);
      });
    };

    const { getByTestId, getByText, toJSON } = await render(
      <View>
        <EventProvider>
          <Active>
            <Component />
          </Active>
        </EventProvider>
        <View testID="outside" onPress={onPress} />
      </View>,
    );

    // inside
    assert.ok(await getByText('not active'));
    await fireEvent.press(getByTestId('toggle'), {
      target: getByTestId('toggle'),
    });
    try {
      await getByText('not active');
      assert.ok(false);
    } catch (err) {
      assert.ok(err);
    }
    assert.ok(await getByText('active'));

    // outside
    await fireEvent.press(getByTestId('outside'), {
      target: getByTestId('outside'),
    });
    assert.ok(await getByText('not active'));
  });

  it('ActiveBoundary', async function () {
    type ComponentProps = {
      isActive?: boolean | undefined;
      setIsActive?: React.Dispatch<React.SetStateAction<boolean>>;
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

    const Component = React.forwardRef(function (
      { isActive, setIsActive }: ComponentProps,
      ref: React.RefObject<View>,
    ) {
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

    const onPress = (event) => {
      // emulate onStartShouldSetResponderCapture
      event.persist = function () {
        /* empty */
      };
      visit(toJSON(), (element) => {
        if (element.props && element.props.onStartShouldSetResponderCapture)
          element.props.onStartShouldSetResponderCapture(event);
      });
    };

    const { getByTestId, getByText, toJSON } = await render(
      <PortalProvider>
        <EventProvider>
          <ActiveBoundary>
            <Component />
          </ActiveBoundary>
        </EventProvider>
        <TouchableOpacity
          testID="outside"
          onPress={function (event) {
            // event.stopPropagation();
            onPress(event);
          }}
        />
      </PortalProvider>,
    );

    // inside
    assert.ok(await getByText('not active'));
    fireEvent.press(getByTestId('toggle'), { target: getByTestId('toggle') });
    try {
      await getByText('not active');
      assert.ok(false);
    } catch (err) {
      assert.ok(err);
    }
    assert.ok(await getByText('active'));

    // portal
    fireEvent.press(getByTestId('portal-click'), {
      target: getByTestId('portal-click'),
    });
    assert.ok(await getByText('active'));

    // outside
    fireEvent.press(getByTestId('outside'), { target: getByTestId('outside') });
    assert.ok(await getByText('not active'));
  });
});
