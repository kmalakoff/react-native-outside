import type { Attributes, ReactNode } from 'react';
import { Children, cloneElement, createElement, Fragment, isValidElement, useRef, useState } from 'react';
import contains from 'react-native-contains';
import { useEvent } from 'react-native-event';

import type { ActiveProps } from './types.ts';

export default function Active({ children }: ActiveProps) {
  const state = useState<boolean>(false);
  const isActive = state[0];
  const setIsActive = state[1];
  const ref = useRef<HTMLElement>(null);
  useEvent(
    (event) => {
      if (!isActive) return;
      if (ref.current && contains(ref.current, event.target)) return;
      setIsActive(false);
    },
    [isActive, setIsActive]
  );

  return createElement(
    Fragment,
    null,
    Children.map<ReactNode, ReactNode>(children, (child) =>
      isValidElement(child)
        ? cloneElement(child, {
            isActive,
            setIsActive,
            ref,
          } as Attributes)
        : child
    )
  );
}
