/**
 * @module NumberPicker
 * @description
 * 数値選択ピッカーコンポーネント
 *
 * 指定範囲内の数値をスクロールホイールで選択できるピッカー。
 * 最小値、最大値、ステップ値、単位を設定可能。
 *
 * 機能:
 * - スクロールホイール形式の数値選択
 * - 最小値/最大値/ステップの設定
 * - 単位表示（分、回、個など）
 * - ボトムシートモーダル表示
 *
 * @see PickerTypes - 共通型定義
 * @see @react-native-picker/picker - ホイールピッカー
 */

import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '@lib/themeSystem';
import { BottomSheetModal } from '@components/common/UnifiedModal';
import { ModalFooter } from '@components/common/ModalFooter';
import { BasePickerProps } from './PickerTypes';

/* ========================================
   Props定義
   ======================================== */

/**
 * NumberPickerのProps
 * @property value - 現在選択されている値
 * @property onValueChange - 値変更時のコールバック
 * @property min - 選択可能な最小値（デフォルト: 0）
 * @property max - 選択可能な最大値（デフォルト: 100）
 * @property step - 値の増減単位（デフォルト: 1）
 * @property unit - 数値の後に表示する単位（例: "分"、"個"）
 */
interface NumberPickerProps extends BasePickerProps {
  value?: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

const NumberPicker: React.FC<NumberPickerProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
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
  /** 一時的な選択値（確定前の値を保持、キャンセル時は破棄される） */
  const [tempValue, setTempValue] = useState<number>(value || min);

  /* ========================================
     副作用
     ======================================== */

  /**
   * 親から渡されたvalueまたはminが変更されたら一時値を同期
   */
  useEffect(() => {
    setTempValue(value || min);
  }, [value, min]);

  /* ========================================
     ヘルパー関数
     ======================================== */

  /**
   * 数値オプション配列を生成
   */
  const generateNumberOptions = () => {
    const options = [];
    for (let i = min; i <= max; i += step) {
      options.push({
        label: `${i}${unit}`,
        value: i,
      });
    }
    return options;
  };

  /** 生成された数値オプション配列（ピッカーの選択肢） */
  const numberOptions = generateNumberOptions();

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

  /* 数値選択ピッカー（ボトムシート形式） */
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

      {/* 数値ピッカーコンテナ */}
      <View style={{
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        minHeight: 180
      }}>
        {/* 数値選択スピナー */}
        <Picker
          selectedValue={tempValue}
          onValueChange={(itemValue) => setTempValue(itemValue)}
          style={{
            color: colors.textPrimary,
            backgroundColor: colors.surface,
            height: 180,
            width: '100%'
          }}
          itemStyle={{
            color: colors.textPrimary,
            height: 120
          }}
        >
          {numberOptions.map((option, index) => (
            <Picker.Item
              key={index}
              label={option.label}
              value={option.value}
              color={colors.textPrimary}
            />
          ))}
        </Picker>
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

export default NumberPicker;
