import React from 'react';
import { useEvent } from 'react-native-event';
import contains from 'react-native-contains';

export default function Active({ children }) {
  const state = React.useState<boolean>(false);
  const isActive = state[0];
  const setIsActive = state[1];
  const ref = React.useRef<HTMLElement>(null);
  useEvent(
    (event) => {
      if (!isActive) return;
      if (ref.current && contains(ref.current, event.target)) return;
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
