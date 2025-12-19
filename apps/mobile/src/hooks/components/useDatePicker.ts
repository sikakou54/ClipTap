/**
 * 日付選択ピッカーのビジネスロジックフック
 *
 * 日付ピッカーに必要な状態管理とロジックを提供。
 * UIコンポーネント（DatePicker.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - ピッカー表示状態管理
 * - 一時日付の管理
 * - 確定/キャンセル処理
 *
 * @see components/pickers/DatePicker.tsx - UIコンポーネント
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';

/**
 * useDatePickerのProps
 * @property value - 現在選択されている日付
 * @property onChange - 日付変更時のコールバック
 */
export interface UseDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

/**
 * useDatePickerの戻り値の型
 */
export interface UseDatePickerReturn {
  /* 状態 */
  showPicker: boolean;
  tempDate: Date;

  /* ヘルパー */
  formatDate: (date: Date) => string;

  /* ハンドラ */
  handlePress: () => void;
  handleChange: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  handleConfirm: () => void;
  handleCancel: () => void;
}

/**
 * 日付選択ピッカーのビジネスロジックフック
 *
 * @param props - 現在の値と変更コールバック
 * @returns ピッカーに必要な全ての状態とハンドラ
 */
export function useDatePicker({
  value,
  onChange,
}: UseDatePickerProps): UseDatePickerReturn {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  /**
   * 親から渡されたvalueが変更されたら一時日付を同期
   */
  useEffect(() => {
    setTempDate(value);
  }, [value]);

  /**
   * 日付を日本語フォーマットで表示
   */
  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }, []);

  /**
   * ボタンタップ時の処理
   */
  const handlePress = useCallback(() => {
    setTempDate(value);
    setShowPicker(true);
  }, [value]);

  /**
   * ピッカーの値変更時の処理
   */
  const handleChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && selectedDate) {
        onChange(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  }, [onChange]);

  /**
   * 確定ボタン押下時の処理（iOSのみ）
   */
  const handleConfirm = useCallback(() => {
    onChange(tempDate);
    setShowPicker(false);
  }, [tempDate, onChange]);

  /**
   * キャンセルボタン押下時の処理
   */
  const handleCancel = useCallback(() => {
    setShowPicker(false);
  }, []);

  return {
    showPicker,
    tempDate,
    formatDate,
    handlePress,
    handleChange,
    handleConfirm,
    handleCancel,
  };
}
