import { useEffect, useRef } from 'react';

export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

export const useCompare = <T>(value: T, compare?: (prev: T | undefined, current: T) => boolean): boolean => {
  const prevValue = usePrevious(value);

  if (compare) {
    return compare(prevValue, value);
  }

  return prevValue !== value;
};
