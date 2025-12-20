/**
 * 時刻選択ピッカーのビジネスロジックフック
 *
 * 時刻ピッカーに必要な状態管理とロジックを提供。
 * UIコンポーネント（TimePicker.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - 一時時刻の管理
 * - 確定処理
 * - 文字列⇔Date変換
 *
 * @see components/pickers/TimePicker.tsx - UIコンポーネント
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { formatTime } from '@cliptap/shared';

/**
 * useTimePickerのProps
 * @property value - 現在選択されている時刻（HH:MM形式）
 * @property onValueChange - 時刻変更時のコールバック
 * @property onClose - 閉じる時のコールバック
 */
export interface UseTimePickerProps {
  value?: string;
  onValueChange: (timeString: string) => void;
  onClose: () => void;
}

/**
 * useTimePickerの戻り値の型
 */
export interface UseTimePickerReturn {
  /* 状態 */
  tempValue: string;
  timeValue: Date;

  /* ハンドラ */
  setTempValue: (value: string) => void;
  handleConfirm: () => void;
  handleTimeChange: (selectedTime: Date | undefined) => void;
}

/**
 * 時刻選択ピッカーのビジネスロジックフック
 *
 * @param props - 現在の値と変更コールバック
 * @returns ピッカーに必要な全ての状態とハンドラ
 */
export function useTimePicker({
  value,
  onValueChange,
  onClose,
}: UseTimePickerProps): UseTimePickerReturn {
  const [tempValue, setTempValue] = useState<string>(value || '09:00');

  /**
   * 親から渡されたvalueが変更されたら一時値を同期
   */
  useEffect(() => {
    setTempValue(value || '09:00');
  }, [value]);

  /**
   * HH:MM文字列をDateオブジェクトに変換
   */
  const timeValue = useMemo(() => {
    return tempValue ? new Date(`2000-01-01T${tempValue}`) : new Date();
  }, [tempValue]);

  /**
   * 時刻変更時の処理
   */
  const handleTimeChange = useCallback((selectedTime: Date | undefined) => {
    if (selectedTime) {
      const timeString = formatTime(selectedTime);
      setTempValue(timeString);
    }
  }, []);

  /**
   * 確定ボタン押下時の処理
   */
  const handleConfirm = useCallback(() => {
    onValueChange(tempValue);
    onClose();
  }, [tempValue, onValueChange, onClose]);

  return {
    tempValue,
    timeValue,
    setTempValue,
    handleConfirm,
    handleTimeChange,
  };
}
