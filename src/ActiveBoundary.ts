import { Children, Fragment, cloneElement, createElement, isValidElement, useState } from 'react';
import type { Dispatch, FC, ReactElement, ReactNode, RefObject } from 'react';
import contains from 'react-native-contains';
import { useEvent } from 'react-native-event';
import { BoundaryProvider, useBoundary, useRef } from 'react-ref-boundary';

function Component({ children, isActive, setIsActive }) {
  const ref = useRef<HTMLElement>(null);
  const boundary = useBoundary();
  useEvent(
    (event) => {
      if (!isActive) return;
      for (let i = 0; i < boundary.refs.length; i++) {
        const x = boundary.refs[i] as RefObject<HTMLElement>;
        if (x.current && contains(x.current, event.target)) return;
      }
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

interface ComponentProps {
  isActive: boolean;
  setIsActive: Dispatch<boolean>;
}

export default function ActiveBoundary({ children }) {
  const state = useState<boolean>(false);
  const isActive = state[0];
  const setIsActive = state[1];

  return createElement(BoundaryProvider, null, createElement<ComponentProps>(Component as FC, { isActive, setIsActive }, children));
}
