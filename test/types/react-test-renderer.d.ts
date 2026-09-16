declare module 'react-test-renderer' {
  import type React from 'react';

  export interface ReactTestInstance {
    props: Record<string, unknown>;
    instance: unknown;
    findByProps(props: Record<string, unknown>): ReactTestInstance;
    findByType(type: unknown): ReactTestInstance;
    findAll(predicate: (node: ReactTestInstance) => boolean | void): ReactTestInstance[];
  }

  export interface ReactTestRenderer {
    root: ReactTestInstance;
    update(element: React.ReactElement): void;
    unmount(): void;
  }

  export function act<T>(callback: () => T | Promise<T>): Promise<T>;
  export function create(element: React.ReactElement): ReactTestRenderer;
}
