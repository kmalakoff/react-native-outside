# react-native-outside

React components for react-native click outside

```sh
npm install react-native-outside react-native-event react-native-contains react-ref-boundary
```

The examples assume React Native 0.82.1 or newer and React. The native CI fixture is validated with React Native 0.87.1.

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
  const ref = useBoundaryRef<ComponentRef<typeof TouchableOpacity>>(null);
  return (
    <Portal>
      <TouchableOpacity
        ref={ref}
        testID="portal-click"
        onPress={() => {}}
      />
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

Run `npm test`, then `npm run test:engines` for consumer types, browser
interactions, and Node containment/export checks. The
[native fixture](examples/native-test-app/README.md) exercises real iOS and
Android input, including registered and unrelated portals, in GitHub Actions.

### Documentation

[API Docs](https://kmalakoff.github.io/react-native-outside/)
