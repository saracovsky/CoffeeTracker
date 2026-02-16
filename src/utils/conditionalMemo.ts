import { useMemo, useCallback, DependencyList, ComponentType, memo } from 'react';
import { FEATURE_FLAGS } from '@/src/config/featureFlags';

export function useConditionalMemo<T>(
  factory: () => T,
  deps: DependencyList
): T {
  if (FEATURE_FLAGS.USE_MEMOIZATION) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMemo(factory, deps);
  }
  return factory();
}

export function useConditionalCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  if (FEATURE_FLAGS.USE_MEMOIZATION) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(callback, deps);
  }
  return callback;
}

export function conditionalMemo<P extends object>(
  Component: ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): ComponentType<P> {
  if (FEATURE_FLAGS.USE_MEMOIZATION) {
    return memo(Component, propsAreEqual);
  }
  return Component;
}
