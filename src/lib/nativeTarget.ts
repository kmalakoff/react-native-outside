import type { NativeElement, NativeHost } from 'react-native-contains';
import contains from 'react-native-contains';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNativeHost(value: unknown): value is NativeHost {
  return isObject(value) && typeof value.contains === 'function';
}

function isNativeElement(value: unknown): value is NativeElement {
  return isObject(value) && typeof value._nativeTag === 'number';
}

export function containsTarget(element: unknown, target: unknown): boolean {
  if (isNativeHost(element)) {
    return isNativeHost(target) && contains(element, target);
  }
  if (isNativeElement(element) && (typeof target === 'number' || isNativeElement(target))) {
    return contains(element, target);
  }
  return false;
}
