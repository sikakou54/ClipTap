import { useState, useCallback } from 'react';

export const useToggle = (initialValue: boolean = false) => {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return [value, { toggle, setTrue, setFalse, setValue }] as const;
};

export const useMultipleToggle = <T extends Record<string, boolean>>(
  initialValues: T
) => {
  const [values, setValues] = useState(initialValues);

  const toggle = useCallback((key: keyof T) => {
    setValues(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const setTrue = useCallback((key: keyof T) => {
    setValues(prev => ({ ...prev, [key]: true }));
  }, []);

  const setFalse = useCallback((key: keyof T) => {
    setValues(prev => ({ ...prev, [key]: false }));
  }, []);

  const setValue = useCallback((key: keyof T, value: boolean) => {
    setValues(prev => ({ ...prev, [key]: value }));
  }, []);

  return {
    values,
    toggle,
    setTrue,
    setFalse,
    setValue
  };
};
