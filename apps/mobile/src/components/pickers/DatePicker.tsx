/**
 * @module DatePicker
 * @description
 * 日付選択ピッカーコンポーネント
 *
 * カレンダー形式で日付を選択できるピッカー。
 * iOS/Androidのネイティブピッカーを使用。
 *
 * 機能:
 * - カレンダーアイコン付きボタン表示
 * - iOS: ボトムシートモーダルでスピナー表示
 * - Android: ネイティブダイアログ
 * - 最小/最大日付制限
 * - 日本語ロケール対応
 *
 * @see BottomSheetModal - iOSモーダル
 * @see @react-native-community/datetimepicker
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@cliptap/shared';
import { useTheme } from '@lib/themeSystem';
import { BottomSheetModal } from '@components/common/UnifiedModal';
import { ModalFooter } from '@components/common/ModalFooter';

/* ========================================
   Props定義
   ======================================== */

/**
 * DatePickerのProps
 * @property label - 入力欄上部のラベルテキスト
 * @property value - 現在選択されている日付
 * @property onChange - 日付変更時のコールバック
 * @property minimumDate - 選択可能な最小日付
 * @property maximumDate - 選択可能な最大日付
 */
interface DatePickerProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
}) => {
  /* ========================================
     Hooks & コンテキスト
     ======================================== */
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();

  /* ========================================
     状態管理
     ======================================== */
  /** ピッカーの表示状態（true: 表示、false: 非表示） */
  const [showPicker, setShowPicker] = useState(false);
  /** 一時的な選択日付（確定前の値を保持、キャンセル時は破棄される） */
  const [tempDate, setTempDate] = useState(value);

  /* ========================================
     副作用
     ======================================== */

  /**
   * 親から渡されたvalueが変更されたら一時日付を同期
   */
  useEffect(() => {
    setTempDate(value);
  }, [value]);

  /* ========================================
     ヘルパー関数
     ======================================== */

  /**
   * 日付を日本語フォーマットで表示
   * @param date - フォーマットする日付
   * @returns YYYY/MM/DD形式の文字列（例: 2025/12/31）
   */
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  /* ========================================
     イベントハンドラ
     ======================================== */

  /**
   * ボタンタップ時の処理
   */
  const handlePress = () => {
    setTempDate(value);
    setShowPicker(true);
  };

  /**
   * ピッカーの値変更時の処理
   * Android: 即座に確定、iOS: 一時値を更新
   */
  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
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
  };

  /**
   * 確定ボタン押下時の処理（iOSのみ）
   */
  const handleConfirm = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  /**
   * キャンセルボタン押下時の処理
   */
  const handleCancel = () => {
    setShowPicker(false);
  };

  /* ========================================
     レンダリング
     ======================================== */

  /* 日付選択ピッカーコンテナ */
  return (
    <View>
      {/* ラベル（オプション） */}
      {label && (
        <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs }]}>
          {label}
        </Text>
      )}

      {/* 日付選択ボタン */}
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.button,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm,
          }
        ]}
      >
        {/* カレンダーアイコン */}
        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
        {/* 選択された日付テキスト */}
        <Text style={[typography.body, { color: colors.text, marginLeft: spacing.sm }]}>
          {formatDate(value)}
        </Text>
      </TouchableOpacity>

      {/* iOS用モーダルピッカー（ボトムシート形式） */}
      {Platform.OS === 'ios' && (
        <BottomSheetModal
          visible={showPicker}
          onClose={handleCancel}
          title={t('common.select_date')}
          showCloseButton={false}
          showHandle={true}
          maxHeight="50%"
        >
          {/* 日付ピッカーコンテナ */}
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={handleChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              locale="ja-JP"
              style={styles.picker}
              themeVariant={colors.background === '#FFFFFF' ? 'light' : 'dark'}
            />
          </View>

          {/* 確定・キャンセルボタン */}
          <ModalFooter
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            confirmText={t('common.confirm_button')}
            cancelText={t('common.cancel')}
            showCancel={true}
          />
        </BottomSheetModal>
      )}

      {/* Android用ネイティブピッカー（ダイアログ形式） */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
};

/* ========================================
   スタイル定義
   ======================================== */

const styles = StyleSheet.create({
  /** 日付選択ボタン */
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 44,
  },
  /** ピッカーコンテナ（iOS用） */
  pickerContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  /** ピッカー本体 */
  picker: {
    width: '100%',
    height: 200,
  },
});

export default DatePicker;
