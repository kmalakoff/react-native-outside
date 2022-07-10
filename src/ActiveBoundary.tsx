import React from 'react';
import { useEvent } from 'react-native-event';
import contains from 'react-native-contains';
import { BoundaryProvider, useBoundary, useRef } from 'react-ref-boundary';

function Component({ children, isActive, setIsActive }) {
  const ref = useRef<HTMLElement>(null);
  const boundary = useBoundary();
  useEvent(
    (event) => {
      if (!isActive) return;
      for (let i = 0; i < boundary.refs.length; i++) {
        const x = boundary.refs[i] as React.RefObject<HTMLElement>;
        if (x.current && contains(x.current, event.target)) return;
      }
      setIsActive(false);
    },
    [isActive, setIsActive],
  );

  return (
    <React.Fragment>
      {React.Children.map<React.ReactNode, React.ReactNode>(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { isActive, setIsActive, ref })
          : child,
      )}
    </React.Fragment>
  );
}

export default function ActiveBoundary({ children }) {
  const state = React.useState<boolean>(false);
  const isActive = state[0];
  const setIsActive = state[1];

  return (
    <BoundaryProvider>
      <Component isActive={isActive} setIsActive={setIsActive}>
        {children}
      </Component>
    </BoundaryProvider>
  );
}
