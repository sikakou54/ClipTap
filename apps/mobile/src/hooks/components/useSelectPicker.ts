/**
 * 選択ピッカーのビジネスロジックフック
 *
 * 選択ピッカーに必要な状態管理とロジックを提供。
 * UIコンポーネント（SelectPicker.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - 単一選択/複数選択の状態管理
 * - 選択処理
 * - 確定処理
 *
 * @see components/pickers/SelectPicker.tsx - UIコンポーネント
 */

import { useState, useEffect, useCallback } from 'react';
import { PickerValue } from '@components/pickers/PickerTypes';

/**
 * useSelectPickerのProps
 * @property value - 現在選択されている値
 * @property onValueChange - 値変更時のコールバック
 * @property onClose - 閉じる時のコールバック
 * @property multiSelect - 複数選択を有効にするか
 * @property maxSelections - 複数選択時の最大選択数
 */
export interface UseSelectPickerProps {
  value?: PickerValue | PickerValue[];
  onValueChange: (value: PickerValue | PickerValue[]) => void;
  onClose: () => void;
  multiSelect?: boolean;
  maxSelections?: number;
}

/**
 * useSelectPickerの戻り値の型
 */
export interface UseSelectPickerReturn {
  /* 状態 */
  tempValue: PickerValue | undefined;
  selectedOptions: PickerValue[];

  /* ハンドラ */
  setTempValue: (value: PickerValue) => void;
  handleToggleOption: (optionValue: PickerValue, isSelected: boolean, canSelect: boolean) => void;
  handleConfirm: () => void;
}

/**
 * 選択ピッカーのビジネスロジックフック
 *
 * @param props - 現在の値と変更コールバック
 * @returns ピッカーに必要な全ての状態とハンドラ
 */
export function useSelectPicker({
  value,
  onValueChange,
  onClose,
  multiSelect = false,
}: UseSelectPickerProps): UseSelectPickerReturn {
  const [tempValue, setTempValue] = useState<PickerValue | undefined>(
    Array.isArray(value) ? undefined : value
  );
  const [selectedOptions, setSelectedOptions] = useState<PickerValue[]>(
    Array.isArray(value) ? value : []
  );

  /**
   * 親から渡されたvalueが変更されたら内部状態を同期
   */
  useEffect(() => {
    if (Array.isArray(value)) {
      setSelectedOptions(value);
    } else {
      setTempValue(value);
    }
  }, [value]);

  /**
   * 複数選択時のオプション切り替え
   */
  const handleToggleOption = useCallback((
    optionValue: PickerValue,
    isSelected: boolean,
    canSelect: boolean
  ) => {
    if (!canSelect && !isSelected) return;

    let newSelected = [...selectedOptions];
    if (isSelected) {
      newSelected = newSelected.filter(v => v !== optionValue);
    } else {
      newSelected.push(optionValue);
    }
    setSelectedOptions(newSelected);
  }, [selectedOptions]);

  /**
   * 確定ボタン押下時の処理
   */
  const handleConfirm = useCallback(() => {
    const finalValue = multiSelect ? selectedOptions : tempValue;
    if (finalValue !== undefined) {
      onValueChange(finalValue);
    }
    onClose();
  }, [multiSelect, selectedOptions, tempValue, onValueChange, onClose]);

  return {
    tempValue,
    selectedOptions,
    setTempValue,
    handleToggleOption,
    handleConfirm,
  };
}
