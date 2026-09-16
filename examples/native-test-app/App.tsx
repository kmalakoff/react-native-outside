import { type ComponentRef, forwardRef, type ForwardedRef, useState } from 'react';
import { Portal, PortalHost, PortalProvider } from '@gorhom/portal';
import { Text, TouchableOpacity, View } from 'react-native';
import { EventProvider } from 'react-native-event';
import type * as ReactNativeOutside from 'react-native-outside';
import type { ActiveInjectedProps } from 'react-native-outside';

import { useRef as useBoundaryRef } from 'react-ref-boundary';

const { Active, ActiveBoundary } = require('react-native-outside') as typeof ReactNativeOutside;

function ActiveContent({ isActive, setIsActive }: Partial<ActiveInjectedProps>, ref: ForwardedRef<ComponentRef<typeof View>>) {
  return (
    <View ref={ref}>
      <Text testID="active-status">{isActive ? 'ACTIVE_SMOKE_ACTIVE' : 'ACTIVE_SMOKE_INACTIVE'}</Text>
      <TouchableOpacity style={{ minHeight: 44, justifyContent: 'center' }} testID="active-toggle" onPress={() => setIsActive?.((current) => !current)}>
        <Text>Toggle active component</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ minHeight: 44, justifyContent: 'center' }} testID="active-inside" onPress={() => {}}>
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
      <TouchableOpacity style={{ minHeight: 44, justifyContent: 'center' }} testID="boundary-toggle" onPress={() => setIsActive?.((current) => !current)}>
        <Text>Toggle boundary component</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ minHeight: 44, justifyContent: 'center' }} testID="boundary-inside" onPress={() => {}}>
        <Text>Inside boundary component</Text>
      </TouchableOpacity>
      <Portal>
        <TouchableOpacity style={{ minHeight: 44, justifyContent: 'center' }} ref={registeredRef} testID="registered-portal" onPress={() => {}}>
          <Text>Registered portal</Text>
        </TouchableOpacity>
      </Portal>
      <Portal hostName="unrelated">
        <TouchableOpacity style={{ minHeight: 44, justifyContent: 'center' }} testID="unrelated-portal" onPress={() => {}}>
          <Text>Unrelated portal</Text>
        </TouchableOpacity>
      </Portal>
    </View>
  );
}

const ForwardedBoundaryContent = forwardRef(BoundaryContent);

function App() {
  const [ready, setReady] = useState(false);
  return (
    <PortalProvider shouldAddRootHost={false}>
      <View style={{ flex: 1 }}>
        <EventProvider>
          <View style={{ flex: 1, paddingTop: 48, paddingHorizontal: 24 }}>
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
              <TouchableOpacity style={{ minHeight: 44, justifyContent: 'center' }} testID="outside" onPress={() => setReady(true)}>
                <Text>Outside</Text>
              </TouchableOpacity>
            </View>
          </View>
        </EventProvider>
      </View>
    </PortalProvider>
  );
}

export default App;
