import type { ReactElement, Ref, RefCallback } from 'react';
import React, { useCallback, useRef } from 'react';

type RefCleanup = () => void;

interface RefState<T> {
  ref: Ref<T>;
  cleanup: RefCleanup | undefined;
}

function setRef<T>(ref: Ref<T>, value: T | null): RefCleanup | undefined {
  if (typeof ref === 'function') {
    const cleanup = ref(value);
    return typeof cleanup === 'function' ? cleanup : undefined;
  }
  if (ref) ref.current = value;
  return undefined;
}

function clearRefs<T>(states: RefState<T>[], supportsCleanup: boolean) {
  for (const state of states) {
    if (supportsCleanup && state.cleanup) {
      state.cleanup();
    } else {
      state.cleanup?.();
      setRef(state.ref, null);
    }
  }
}

export function getElementRef<T>(element: ReactElement): Ref<T> | null {
  if (Number.parseInt(React.version, 10) >= 19) {
    return (element.props as { ref?: Ref<T> }).ref ?? null;
  }
  return (element as ReactElement & { ref?: Ref<T> }).ref ?? null;
}

export function useComposedRefs<T>(...refs: Array<Ref<T> | null | undefined>): RefCallback<T> {
  const states = useRef<RefState<T>[]>([]);
  const supportsCleanup = Number.parseInt(React.version, 10) >= 19;

  return useCallback(
    (value: T | null) => {
      if (value === null) {
        const previous = states.current;
        states.current = [];
        clearRefs(previous, supportsCleanup);
        return;
      }

      clearRefs(states.current, supportsCleanup);
      const next = refs.filter((ref): ref is Ref<T> => ref != null).map((ref) => ({ ref, cleanup: setRef(ref, value) }));
      states.current = next;

      if (supportsCleanup && next.some(({ cleanup }) => cleanup)) {
        return () => {
          if (states.current !== next) return;
          states.current = [];
          clearRefs(next, true);
        };
      }
    },
    [supportsCleanup, ...refs, refs.filter]
  );
}
