import { Portal, PortalHost, PortalProvider } from '@gorhom/portal';
import React, { type ComponentRef, type ForwardedRef, forwardRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { EventProvider, useEvent } from 'react-native-event';
import type * as ReactNativeOutside from 'react-native-outside';
import type { ActiveInjectedProps } from 'react-native-outside';
import { useRef as useBoundaryRef } from 'react-ref-boundary';

const { Active, ActiveBoundary } = require('react-native-outside') as typeof ReactNativeOutside;

function EventStatus() {
  const [eventCount, setEventCount] = useState(0);
  useEvent(() => setEventCount((current) => current + 1), []);
  return <Text testID="event-status">{eventCount > 0 ? 'EVENT_SMOKE_RECEIVED' : 'EVENT_SMOKE_PENDING'}</Text>;
}

function ActiveContent({ isActive, setIsActive }: Partial<ActiveInjectedProps>, ref: ForwardedRef<ComponentRef<typeof View>>) {
  return (
    <View ref={ref}>
      <Text testID="active-status">{isActive ? 'ACTIVE_SMOKE_ACTIVE' : 'ACTIVE_SMOKE_INACTIVE'}</Text>
      <TouchableOpacity testID="active-toggle" onPress={() => setIsActive?.((current) => !current)}>
        <Text>Toggle active component</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="active-inside" onPress={() => {}}>
        <Text>Inside active component</Text>
      </TouchableOpacity>
    </View>
  );
}

const ForwardedActiveContent = forwardRef(ActiveContent);

function BoundaryContent({ isActive, setIsActive }: Partial<ActiveInjectedProps>, ref: ForwardedRef<ComponentRef<typeof View>>) {
  const registeredRef = useBoundaryRef<ComponentRef<typeof TouchableOpacity> | null>(null);
  return (
    <View ref={ref}>
      <Text testID="boundary-status">{isActive ? 'BOUNDARY_SMOKE_ACTIVE' : 'BOUNDARY_SMOKE_INACTIVE'}</Text>
      <TouchableOpacity testID="boundary-toggle" onPress={() => setIsActive?.((current) => !current)}>
        <Text>Toggle boundary component</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="boundary-inside" onPress={() => {}}>
        <Text>Inside boundary component</Text>
      </TouchableOpacity>
      <Portal>
        <TouchableOpacity ref={registeredRef} testID="registered-portal" onPress={() => {}}>
          <Text>Registered portal</Text>
        </TouchableOpacity>
      </Portal>
      <Portal hostName="unrelated">
        <TouchableOpacity testID="unrelated-portal" onPress={() => {}}>
          <Text>Unrelated portal</Text>
        </TouchableOpacity>
      </Portal>
    </View>
  );
}

const ForwardedBoundaryContent = forwardRef(BoundaryContent);

export default function App() {
  const [ready, setReady] = useState(false);
  return (
    <PortalProvider shouldAddRootHost={false}>
      <View style={{ flex: 1 }}>
        <EventProvider>
          <EventStatus />
          <View style={{ flex: 1, paddingTop: 120, paddingHorizontal: 24 }}>
            <PortalHost name="root" />
            <PortalHost name="unrelated" />
            <View>
              <Text>{ready ? 'OUTSIDE_SMOKE_READY' : 'OUTSIDE_SMOKE_PENDING'}</Text>
              <Active>
                <ForwardedActiveContent />
              </Active>
              <ActiveBoundary>
                <ForwardedBoundaryContent />
              </ActiveBoundary>
              <TouchableOpacity testID="outside" onPress={() => setReady(true)}>
                <Text>Outside</Text>
              </TouchableOpacity>
            </View>
          </View>
        </EventProvider>
      </View>
    </PortalProvider>
  );
}
