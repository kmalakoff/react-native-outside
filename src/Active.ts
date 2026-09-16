import type { ComponentRef } from 'react';
import { Children, cloneElement, Fragment, useRef, useState } from 'react';
import type { View } from 'react-native';
import { useEvent } from 'react-native-event';
import { getElementRef, useComposedRefs } from './lib/composeRefs.ts';
import { containsTarget } from './lib/nativeTarget.ts';
import type { ActiveChildProps, ActiveProps } from './types.ts';

export default function Active({ children }: ActiveProps) {
  const child = Children.only(children);
  if ((child.type as unknown) === Fragment) {
    throw new Error('Active requires one non-Fragment child that forwards its ref');
  }

  const state = useState<boolean>(false);
  const isActive = state[0];
  const setIsActive = state[1];
  const ref = useRef<ComponentRef<typeof View> | null>(null);
  const childRef = getElementRef<ComponentRef<typeof View>>(child);
  const composedRef = useComposedRefs(childRef, ref);
  useEvent(
    (event) => {
      if (!isActive) return;
      if (containsTarget(ref.current, event.target)) return;
      setIsActive(false);
    },
    [isActive, setIsActive]
  );

  const injectedProps: Partial<ActiveChildProps> = { isActive, setIsActive, ref: composedRef };
  return cloneElement(child, injectedProps);
}
