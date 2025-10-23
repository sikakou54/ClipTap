import { useRef, useEffect } from 'react';

/**
 * Ref同期カスタムフック
 * state値の変更を自動的にRefに同期する
 * @param value 同期するstate値
 * @returns 常に最新値を保持するRef
 */
export function useRefSync<T>(value: T) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
