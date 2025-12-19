/**
 * @module TimePicker
 * @description
 * 時刻選択ピッカーコンポーネント
 *
 * スクロールホイール形式で時刻を選択できるピッカー。
 * 24時間形式と12時間形式（AM/PM）に対応。
 *
 * 機能:
 * - スピナー形式の時刻選択
 * - 24時間/12時間表示切り替え
 * - HH:MM形式の文字列で値を管理
 * - ボトムシートモーダル表示
 *
 * @see PickerTypes - 共通型定義
 * @see @react-native-community/datetimepicker
 */

import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@lib/themeSystem';
import { BottomSheetModal } from '@components/common/UnifiedModal';
import { ModalFooter } from '@components/common/ModalFooter';
import { BasePickerProps } from './PickerTypes';
import { formatTime } from '@cliptap/shared';

/* ========================================
   Props定義
   ======================================== */

/**
 * TimePickerのProps
 * @property value - 現在選択されている時刻（HH:MM形式の文字列）
 * @property onValueChange - 時刻変更時のコールバック
 * @property format24 - 24時間表示を使用するか（デフォルト: true）
 */
interface TimePickerProps extends BasePickerProps {
  value?: string; // HH:MM format
  onValueChange: (timeString: string) => void;
  format24?: boolean;
}

const TimePicker: React.FC<TimePickerProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  value,
  onValueChange,
  format24 = true,
  confirmText,
  cancelText,
  showCancel = true,
}) => {
  /* ========================================
     Hooks & コンテキスト
     ======================================== */
  const { colors, spacing, typography } = useTheme();

  /* ========================================
     状態管理
     ======================================== */
  /** 一時的な選択時刻（HH:MM形式の文字列、確定前の値を保持） */
  const [tempValue, setTempValue] = useState<string>(value || '09:00');

  /* ========================================
     副作用
     ======================================== */

  /**
   * 親から渡されたvalueが変更されたら一時値を同期
   */
  useEffect(() => {
    setTempValue(value || '09:00');
  }, [value]);

  /* ========================================
     派生データ（計算値）
     ======================================== */

  /**
   * HH:MM文字列をDateオブジェクトに変換
   * DateTimePickerはDateオブジェクトを必要とするため
   * 日付部分は固定値（2000-01-01）を使用し、時刻部分のみ扱う
   */
  const timeValue = tempValue ? new Date(`2000-01-01T${tempValue}`) : new Date();

  /* ========================================
     イベントハンドラ
     ======================================== */

  /**
   * 確定ボタン押下時の処理
   */
  const handleConfirm = () => {
    onValueChange(tempValue);
    onClose();
  };

  /* ========================================
     レンダリング
     ======================================== */

  if (!visible) return null;

  /* 時刻選択ピッカー（ボトムシート形式） */
  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={title}
      showCloseButton={false}
      showHandle={true}
      maxHeight="50%"
    >
      {/* サブタイトル（オプション） */}
      {subtitle && (
        <Text style={[typography.bodyMedium, {
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: spacing.lg
        }]}>
          {subtitle}
        </Text>
      )}

      {/* 時刻ピッカーコンテナ */}
      <View style={{
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm
      }}>
        {/* 時刻選択スピナー */}
        <DateTimePicker
          value={timeValue}
          mode="time"
          is24Hour={format24}
          display="spinner"
          onChange={(_event, selectedTime) => {
            if (selectedTime) {
              const timeString = formatTime(selectedTime);
              setTempValue(timeString);
            }
          }}
          themeVariant={colors.background === '#FFFFFF' ? 'light' : 'dark'}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            height: 180,
            width: '100%'
          }}
        />
      </View>

      {/* 確定・キャンセルボタン */}
      <ModalFooter
        onConfirm={handleConfirm}
        onCancel={onClose}
        confirmText={confirmText}
        cancelText={cancelText}
        showCancel={showCancel}
      />
    </BottomSheetModal>
  );
};

export default TimePicker;
