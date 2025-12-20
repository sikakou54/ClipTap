/**
 * 数値選択ピッカーのビジネスロジックフック
 *
 * 数値ピッカーに必要な状態管理とロジックを提供。
 * UIコンポーネント（NumberPicker.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - 一時値の管理
 * - 数値オプション配列の生成
 * - 確定処理
 *
 * @see components/pickers/NumberPicker.tsx - UIコンポーネント
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * 数値オプションの型
 */
export interface NumberOption {
  label: string;
  value: number;
}

/**
 * useNumberPickerのProps
 * @property value - 現在選択されている値
 * @property onValueChange - 値変更時のコールバック
 * @property onClose - 閉じる時のコールバック
 * @property min - 選択可能な最小値
 * @property max - 選択可能な最大値
 * @property step - 値の増減単位
 * @property unit - 数値の後に表示する単位
 */
export interface UseNumberPickerProps {
  value?: number;
  onValueChange: (value: number) => void;
  onClose: () => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

/**
 * useNumberPickerの戻り値の型
 */
export interface UseNumberPickerReturn {
  /* 状態 */
  tempValue: number;
  numberOptions: NumberOption[];

  /* ハンドラ */
  setTempValue: (value: number) => void;
  handleConfirm: () => void;
}

/**
 * 数値選択ピッカーのビジネスロジックフック
 *
 * @param props - 現在の値と変更コールバック
 * @returns ピッカーに必要な全ての状態とハンドラ
 */
export function useNumberPicker({
  value,
  onValueChange,
  onClose,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
}: UseNumberPickerProps): UseNumberPickerReturn {
  const [tempValue, setTempValue] = useState<number>(value || min);

  /**
   * 親から渡されたvalueまたはminが変更されたら一時値を同期
   */
  useEffect(() => {
    setTempValue(value || min);
  }, [value, min]);

  /**
   * 数値オプション配列を生成
   */
  const numberOptions = useMemo(() => {
    const options: NumberOption[] = [];
    for (let i = min; i <= max; i += step) {
      options.push({
        label: `${i}${unit}`,
        value: i,
      });
    }
    return options;
  }, [min, max, step, unit]);

  /**
   * 確定ボタン押下時の処理
   */
  const handleConfirm = useCallback(() => {
    onValueChange(tempValue);
    onClose();
  }, [tempValue, onValueChange, onClose]);

  return {
    tempValue,
    numberOptions,
    setTempValue,
    handleConfirm,
  };
}
