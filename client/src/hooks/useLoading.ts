import { useState, useEffect } from 'react';

export function useLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  return {
    isLoading,
    startLoading,
    stopLoading,
    setIsLoading
  };
}

export function usePageLoading(minLoadTime = 800) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, minLoadTime);

    return () => clearTimeout(timer);
  }, [minLoadTime]);

  return isLoading;
}

export function useAsyncLoading<T>(
  asyncFunction: () => Promise<T>,
  dependencies: any[] = []
) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const executeAsync = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await asyncFunction();
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    executeAsync();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return { isLoading, data, error };
}