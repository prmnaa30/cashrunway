import { useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { NavigationGuard } from '@/lib/navigation/navigationGuard';

/**
 * Hook to protect navigation against rapid taps / double-presses.
 * Prevents multiple screens from opening simultaneously when user taps
 * two list items in quick succession.
 */
export function useGuardedNavigation(lockDurationMs = 600) {
  const router = useRouter();
  const guardRef = useRef<NavigationGuard | null>(null);

  if (!guardRef.current) {
    guardRef.current = new NavigationGuard(lockDurationMs);
  }

  const resetLock = useCallback(() => {
    guardRef.current?.reset();
  }, []);

  useEffect(() => {
    return () => {
      guardRef.current?.reset();
    };
  }, []);

  const push = useCallback(
    (...args: Parameters<typeof router.push>) => {
      return (
        guardRef.current?.run(() => {
          router.push(...args);
        }) ?? false
      );
    },
    [router]
  );

  return {
    push,
    resetLock,
    canNavigate: useCallback(() => guardRef.current?.canNavigate() ?? true, []),
  };
}
