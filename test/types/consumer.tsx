import React, { createRef, type ElementRef, forwardRef } from 'react';
import { Text, View } from 'react-native';
import { Active, ActiveBoundary, type ActiveChildProps, type ActiveInjectedProps } from 'react-native-outside';

type ChildProps = Partial<ActiveInjectedProps>;
const Child = forwardRef<ElementRef<typeof View>, ChildProps>(({ isActive, setIsActive }, ref) => (
  <View ref={ref}>
    <Text onPress={() => setIsActive?.((current) => !current)}>{isActive ? 'active' : 'inactive'}</Text>
  </View>
));

const objectRef = createRef<ElementRef<typeof View>>();
const callbackRef = (_element: ElementRef<typeof View> | null) => {};
export const compatibleRef: ActiveChildProps['ref'] = objectRef;
// @ts-expect-error The child ref must point to a native View instance.
export const incompatibleRef: ActiveChildProps['ref'] = createRef<number>();
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
