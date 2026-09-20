# react-native-outside

React components for react-native click outside

```sh
npm install react-native-outside react-native-event react-native-contains react-ref-boundary
```

Requires React Native 0.82.1 or newer and a React version supported by that React Native release. The package's React peer floor is 16.8.0. The native fixture has passed locally on Android and iOS with React Native 0.87.1.

For a react-dom version, check out [react-dom-outside](https://www.npmjs.com/package/react-dom-outside)

### Active component

```tsx
import { forwardRef, type ComponentRef } from 'react';
import { Text, TouchableOpacity, View } from "react-native";
import { Active, type ActiveInjectedProps } from 'react-native-outside';
import { EventProvider } from 'react-native-event';

const Component = forwardRef<ComponentRef<typeof View>, Partial<ActiveInjectedProps>>(({ isActive, setIsActive }, ref) => {
  return (
    <View ref={ref}>
      <Text testID="text">{isActive ? 'active' : 'not active'}</Text>
      <TouchableOpacity
        testID="toggle"
        onPress={function () {
          setIsActive?.((current) => !current);
        }}
      />
    </View>
  );
});

export default function App() {
  return (
    <EventProvider>
      <Active>
        <Component />
      </Active>
      <Active>
        <Component />
      </Active>
    </EventProvider>
  );
}
```

`Active` accepts one non-Fragment child. That child must forward its ref to the native view that defines the inside area. The injected state setter accepts both boolean values and functional updates.

### Active boundary component

For content rendered through a portal, install the portal provider used by this example. Keep the portal host inside `EventProvider` so its presses enter the outside-event provider:

```sh
npm install @gorhom/portal
```

```tsx
import { forwardRef, type ComponentRef } from 'react';
import { Text, TouchableOpacity, View } from "react-native";
import { ActiveBoundary, type ActiveInjectedProps } from 'react-native-outside';
import { EventProvider } from 'react-native-event';
import { Portal, PortalHost, PortalProvider } from '@gorhom/portal';
import { useRef as useBoundaryRef } from 'react-ref-boundary';

const PortalComponent = () => {
  const ref = useBoundaryRef<ComponentRef<typeof View>>(null);
  return (
    <Portal>
      <View ref={ref}>
        <TouchableOpacity testID="portal-click" onPress={() => {}} />
      </View>
    </Portal>
  );
}

const Component = forwardRef<ComponentRef<typeof View>, Partial<ActiveInjectedProps>>(({ isActive, setIsActive }, ref) => {
  return (
    <View ref={ref}>
      <Text testID="text">{isActive ? 'active' : 'not active'}</Text>
      <TouchableOpacity
        testID="toggle"
        onPress={function () {
          setIsActive?.((current) => !current);
        }}
      />
      <PortalComponent/>
    </View>
  );
});

export default function App() {
  return (
    <PortalProvider shouldAddRootHost={false}>
      <EventProvider>
        <PortalHost name="root" />
        <ActiveBoundary>
          <Component />
        </ActiveBoundary>
      </EventProvider>
    </PortalProvider>
  );
}
```

`ActiveBoundary` also accepts one non-Fragment child. Register additional portal content with `react-ref-boundary`; its host must be inside `EventProvider` so presses reach the outside-event provider.

### Testing

Run `npm test` for consumer types, browser interactions and Node helper checks,
then `npm run test:engines` for export resolution on Node.js 16.0.0. The shared
native fixture exercises real iOS and Android input, including registered and
unrelated portals, locally and through manually requested GitHub Actions runs.
See [local tests and manual Android/iOS CI](test/README.md).

### Documentation

[API Docs](https://kmalakoff.github.io/react-native-outside/)
