/**
 * デバウンスのカスタムフック
 *
 * @description
 * ユーザー入力などの高頻度イベントを最適化するためのユーティリティフック。
 * 検索機能やリアルタイムプレビューなどで使用されます。
 * Mobile/Web両方で共通化。
 *
 * @module useDebounce
 */

import { useEffect, useState } from 'react';

/** デフォルトのデバウンス遅延時間（ミリ秒） - 検索などの快適なUXに最適化された値 */
export const DEFAULT_DEBOUNCE_DELAY = 300;

/**
 * 値の更新を遅延させるデバウンスフック
 *
 * 高頻度で変化する値（検索クエリ、フォーム入力等）を遅延させることで、
 * 不要な再レンダリングやAPI呼び出しを削減します。
 *
 * @template T - デバウンス対象の値の型
 * @param value - デバウンス対象の値
 * @param delay - 遅延時間（ミリ秒）。デフォルトは300ms
 * @returns デバウンスされた値
 */
export function useDebounce<T>(value: T, delay: number = DEFAULT_DEBOUNCE_DELAY): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    /* 高速な入力変更時に中間の値が反映されるのを防ぐ */
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
