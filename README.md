## react-native-outside

React components for react-native click outside

For a react-dom version, check out [react-dom-outside](https://www.npmjs.com/package/react-dom-outside)

### Example 1: Active Component

```tsx
import { forwardRef } from "react",
import { View } from "react-native",
import { Active } from "react-native-outside";
import { EventProvider } from "react-native-event";

const Component = forwardRef(({ isActive, setIsActive }, ref) => {
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

### Example 1: Active Boundary Component

```tsx
import { forwardRef } from "react",
import { View } from "react-native",
import { Active } from "react-native-outside";
import { EventProvider } from "react-native-event";
import { PortalProvider, Portal } from '@gorhom/portal';
import { useRef as useBoundaryRef } from 'react-ref-boundary';

// a modal for example outside the hierarchy
const PortalComponent = () => {
  const ref = useBoundaryRef(null); // react-ref-boundary ref
  return (
    <Portal>
      <TouchableOpacity
        ref={ref}
        testID="portal-click"
        onPress={() => { /* this click will not inactivate due to react-ref-boundary ref */ }}
      />
    </Portal>
  );
}

// react-ref-boundary ref passed in
const Component = forwardRef(({ isActive, setIsActive }, ref) => {
  return (
    <View ref={ref}>
      <Text testID="text">{isActive ? 'active' : 'not active'}</Text>
      <TouchableOpacity
        testID="toggle"
        onPress={function () {
          setIsActive(!isActive);
        }}
      />
      <PortalComponent/>
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

### Documentation

[API Docs](https://kmalakoff.github.io/react-native-outside/)
