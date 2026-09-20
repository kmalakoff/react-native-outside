import { Portal, PortalHost, PortalProvider } from '@gorhom/portal';
import React, { type ComponentRef, type ForwardedRef, forwardRef, useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import contains, { type NativeElement } from 'react-native-contains';
import { EventProvider, useEvent } from 'react-native-event';
import { Active, ActiveBoundary, type ActiveInjectedProps } from 'react-native-outside';
import { useBoundary, useRef as useBoundaryRef } from 'react-ref-boundary';

function Listener({ mode, onEvent }: { mode: string; onEvent: (mode: string) => void }) {
  const handler = useCallback(() => {
    onEvent(mode);
  }, [mode, onEvent]);
  useEvent(handler, [mode]);
  return null;
}

function EventProbe({ onComplete }: { onComplete: () => void }) {
  const [eventCount, setEventCount] = useState(0);
  const [insidePressCount, setInsidePressCount] = useState(0);
  const [outsideCount, setOutsideCount] = useState(0);
  const [mode, setMode] = useState('initial');
  const [lastEventMode, setLastEventMode] = useState('none');
  const [enabled, setEnabled] = useState(true);

  const onEvent = useCallback((eventMode: string) => {
    setEventCount((count) => count + 1);
    setLastEventMode(eventMode);
  }, []);

  return (
    <View style={eventStyles.root}>
      <View>
        <TouchableOpacity testID="update-button" onPress={() => setMode('updated')} style={eventStyles.button}>
          <Text>Update handler</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="toggle-button" onPress={() => setEnabled((value) => !value)} style={eventStyles.button}>
          <Text>{enabled ? 'Disable handler' : 'Enable handler'}</Text>
        </TouchableOpacity>
      </View>
      <View style={eventStyles.interactionArea}>
        <EventProvider>
          <TouchableOpacity testID="inside-button" onPress={() => setInsidePressCount((count) => count + 1)} style={eventStyles.button}>
            <Text>Inside</Text>
          </TouchableOpacity>
          {enabled ? <Listener mode={mode} onEvent={onEvent} /> : null}
        </EventProvider>
      </View>
      <TouchableOpacity testID="outside-button" onPress={() => setOutsideCount((count) => count + 1)} style={eventStyles.button}>
        <Text>Outside</Text>
      </TouchableOpacity>
      <Text testID="event-count">EVENT_COUNT_{eventCount}</Text>
      <Text testID="inside-count">INSIDE_PRESS_COUNT_{insidePressCount}</Text>
      <Text testID="outside-count">OUTSIDE_COUNT_{outsideCount}</Text>
      <Text testID="event-mode">EVENT_MODE_{lastEventMode}</Text>
      <TouchableOpacity testID="event-complete" style={eventStyles.button} onPress={onComplete}><Text>Continue to containment tests</Text></TouchableOpacity>
    </View>
  );
}

const eventStyles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 120,
    paddingHorizontal: 24,
  },
  interactionArea: {
    height: 80,
  },
  button: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#dddddd',
  },
});



type NativeTarget = NativeElement | number;
const touchableStyle = { minHeight: 44, justifyContent: 'center' as const };

function containsNative(element: unknown, target: unknown): boolean {
  return element !== null && element !== undefined && contains(element as NativeElement, target as NativeTarget);
}

function ContainsProbe() {
  const rootRef = React.useRef<ComponentRef<typeof View> | null>(null);
  const descendantRef = React.useRef<ComponentRef<typeof View> | null>(null);
  const outsideRef = React.useRef<ComponentRef<typeof View> | null>(null);
  const [staticChecks, setStaticChecks] = useState(false);
  const [eventReceived, setEventReceived] = useState(false);
  const [eventInside, setEventInside] = useState<boolean | null>(null);

  React.useEffect(() => {
    const root = rootRef.current;
    const descendant = descendantRef.current;
    const outside = outsideRef.current;
    if (root && descendant && outside) setStaticChecks(containsNative(root, root) && containsNative(root, descendant) && !containsNative(root, outside));
  }, []);

  useEvent((event) => {
    setEventReceived(true);
    setEventInside(containsNative(rootRef.current, event.target));
  }, []);

  return (
    <View>
      <View ref={rootRef} testID="contains-root">
        <TouchableOpacity style={touchableStyle} testID="contains-event" onPress={() => {}}>
          <Text>Contains event target</Text>
        </TouchableOpacity>
        <View ref={descendantRef}>
          <Text>Contains descendant</Text>
        </View>
      </View>
      <View ref={outsideRef}>
        <TouchableOpacity style={touchableStyle} testID="contains-outside-event" onPress={() => {}}>
          <Text>Contains outside</Text>
        </TouchableOpacity>
      </View>
      <Text testID="contains-static-status">{staticChecks ? 'CONTAINS_SMOKE_STATIC_PASS' : 'CONTAINS_SMOKE_STATIC_PENDING'}</Text>
      <Text testID="event-status">{eventReceived ? 'EVENT_SMOKE_RECEIVED' : 'EVENT_SMOKE_PENDING'}</Text>
      <Text testID="contains-event-status">{eventInside === true ? 'CONTAINS_SMOKE_EVENT_INSIDE' : 'CONTAINS_SMOKE_EVENT_PENDING'}</Text>
      <Text testID="contains-outside-event-status">{eventInside === false ? 'CONTAINS_SMOKE_EVENT_OUTSIDE' : 'CONTAINS_SMOKE_EVENT_OUTSIDE_PENDING'}</Text>
    </View>
  );
}

function ActiveContent({ isActive, setIsActive }: Partial<ActiveInjectedProps>, ref: ForwardedRef<ComponentRef<typeof View>>) {
  return (
    <View ref={ref}>
      <Text testID="active-status">{isActive ? 'ACTIVE_SMOKE_ACTIVE' : 'ACTIVE_SMOKE_INACTIVE'}</Text>
      <TouchableOpacity style={touchableStyle} testID="active-toggle" onPress={() => setIsActive?.((current) => !current)}>
        <Text>Toggle active component</Text>
      </TouchableOpacity>
      <TouchableOpacity style={touchableStyle} testID="active-inside" onPress={() => {}}>
        <Text>Inside active component</Text>
      </TouchableOpacity>
    </View>
  );
}

const ForwardedActiveContent = forwardRef(ActiveContent);

function RegisteredPortal() {
  const registeredRef = useBoundaryRef<ComponentRef<typeof TouchableOpacity> | null>(null);
  return (
    <Portal>
      <TouchableOpacity style={touchableStyle} ref={registeredRef} testID="registered-portal" onPress={() => {}}>
        <Text>Registered portal</Text>
      </TouchableOpacity>
    </Portal>
  );
}

function BoundaryContent({ isActive, setIsActive }: Partial<ActiveInjectedProps>, ref: ForwardedRef<ComponentRef<typeof View>>) {
  const [showRegistered, setShowRegistered] = useState(true);
  const [, forceRegistryRender] = useState(0);
  const { refs } = useBoundary();
  React.useEffect(() => forceRegistryRender((current) => current + 1), [forceRegistryRender, showRegistered]);
  const expectedRegistrySize = showRegistered ? 2 : 1;
  const registryReady = refs.length === expectedRegistrySize && refs.every((boundaryRef) => boundaryRef.current !== null);
  const registryStatus = registryReady
    ? showRegistered ? 'BOUNDARY_REGISTRY_REGISTERED' : 'BOUNDARY_REGISTRY_CLEAN'
    : 'BOUNDARY_REGISTRY_PENDING';
  return (
    <View ref={ref}>
      <Text testID="boundary-status">{isActive ? 'BOUNDARY_SMOKE_ACTIVE' : 'BOUNDARY_SMOKE_INACTIVE'}</Text>
      <TouchableOpacity style={touchableStyle} testID="boundary-toggle" onPress={() => setIsActive?.((current) => !current)}>
        <Text>Toggle boundary component</Text>
      </TouchableOpacity>
      <TouchableOpacity style={touchableStyle} testID="boundary-inside" onPress={() => {}}>
        <Text>Inside boundary component</Text>
      </TouchableOpacity>
      <Text testID="boundary-registry-status">{registryStatus}</Text>
      <TouchableOpacity style={touchableStyle} testID="boundary-cleanup" onPress={() => setShowRegistered(false)}>
        <Text>Clean registered portal</Text>
      </TouchableOpacity>
      {showRegistered ? <RegisteredPortal /> : null}
      <Portal hostName="unrelated">
        <TouchableOpacity style={touchableStyle} testID="unrelated-portal" onPress={() => {}}>
          <Text>Unrelated portal</Text>
        </TouchableOpacity>
      </Portal>
    </View>
  );
}

const ForwardedBoundaryContent = forwardRef(BoundaryContent);

export default function App() {
  const [ready, setReady] = useState(false);
  const [showContains, setShowContains] = useState(true);
  const [eventComplete, setEventComplete] = useState(false);
  if (!eventComplete) return <EventProbe onComplete={() => setEventComplete(true)} />;
  return (
    <PortalProvider shouldAddRootHost={false}>
      <View style={{ flex: 1 }}>
        <EventProvider>
          <View style={{ flex: 1, paddingTop: 120, paddingHorizontal: 24 }}>
            {showContains ? <>
              <ContainsProbe />
              <TouchableOpacity style={touchableStyle} testID="contains-complete" onPress={() => setShowContains(false)}>
                <Text>Continue to outside tests</Text>
              </TouchableOpacity>
            </> : <>
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
              <TouchableOpacity style={touchableStyle} testID="outside" onPress={() => setReady(true)}>
                <Text>Outside</Text>
              </TouchableOpacity>
            </View>
            </>}
          </View>
        </EventProvider>
      </View>
    </PortalProvider>
  );
}
