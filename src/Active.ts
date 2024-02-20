import { Children, Fragment, cloneElement, createElement, isValidElement, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import contains from 'react-native-contains';
import { useEvent } from 'react-native-event';

export default function Active({ children }) {
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
        ? // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          cloneElement(child as ReactElement<any>, {
            isActive,
            setIsActive,
            ref,
          })
        : child
    )
  );
}
