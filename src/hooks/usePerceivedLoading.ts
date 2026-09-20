import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to provide smooth perceived loading states during view transitions or data operations.
 * @param initialDelay Number of ms for initial mount shimmer (defaults to 220ms for instant feel with smooth perception)
 */
export function usePerceivedLoading(initialDelay = 220) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, initialDelay);

    return () => clearTimeout(timer);
  }, [initialDelay]);

  const triggerReload = useCallback((delay = 250) => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return {
    isLoading,
    setIsLoading,
    triggerReload
  };
}
