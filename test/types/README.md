# Consumer type fixtures

Both profiles compile packed consumer package declarations with TypeScript 5.9.3 and `skipLibCheck: false`. Each installs its own locked type dependencies. They do not resolve React or RN types through a symlink to the development checkout.

- `minimum`: React 16.9.56 definitions and React Native 0.57.65 definitions. There is no published 0.59 line of `@types/react-native`; 0.57.65 is the last published declaration version preceding the 0.60 line. This checks historical declaration compatibility independently of the RN runtime fixture.
- `current`: React 19.2.0 definitions and RN 0.87.1, using RN's exported `react-native-legacy-deep-imports` declaration condition.

RN 0.87.1's default generated declarations fail strict checking in a baseline importing only `GestureResponderEvent`, before this package is imported. The failures are in AnimatedProps, VirtualizedList and ReactNativeDocument. The current profile explicitly checks RN's alternative declaration condition; it does not certify the default generated declarations.

`npm run test:types:generated` runs the default generated declaration profile strictly and reports that upstream failure. No dependency declarations are patched and library checking remains enabled.
