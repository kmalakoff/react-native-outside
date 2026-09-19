import React, { createRef, forwardRef } from 'react';
import { Text, View } from 'react-native';
import { Active, ActiveBoundary, type ActiveInjectedProps } from 'react-native-outside';

type ChildProps = Partial<ActiveInjectedProps>;
const Child = forwardRef<View, ChildProps>(({ isActive, setIsActive }, ref) => (
  <View ref={ref}>
    <Text onPress={() => setIsActive?.((current) => !current)}>{isActive ? 'active' : 'inactive'}</Text>
  </View>
));

const objectRef = createRef<View>();
const callbackRef = (_element: View | null) => {};
const ChildState: ActiveInjectedProps = { isActive: false, setIsActive: (value) => value };
ChildState.setIsActive((current) => !current);
const _InvalidStateCheck = ({ setIsActive }: Partial<ActiveInjectedProps>) => {
  // @ts-expect-error A state setter accepts only boolean state actions.
  setIsActive?.('invalid');
  return null;
};

export const app = (
  <Active>
    <Child ref={objectRef} />
  </Active>
);
export const boundary = (
  <ActiveBoundary>
    <Child ref={callbackRef} />
  </ActiveBoundary>
);
