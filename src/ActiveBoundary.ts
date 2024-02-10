import { useState, Fragment, Children, isValidElement, cloneElement, createElement } from 'react';
import type { RefObject, ReactElement, FC, Dispatch, ReactNode } from 'react';
import { useEvent } from 'react-native-event';
import contains from 'react-native-contains';
import { BoundaryProvider, useBoundary, useRef } from 'react-ref-boundary';

interface ComponentProps {
  isActive: boolean;
  setIsActive: Dispatch<boolean>;
}

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
        ? cloneElement(child as ReactElement<any>, {
            isActive,
            setIsActive,
            ref,
          })
        : child
    )
  );
}

export default function ActiveBoundary({ children }) {
  const state = useState<boolean>(false);
  const isActive = state[0];
  const setIsActive = state[1];

  return createElement(BoundaryProvider, null, createElement<ComponentProps>(Component as FC, { isActive, setIsActive }, children));
}
