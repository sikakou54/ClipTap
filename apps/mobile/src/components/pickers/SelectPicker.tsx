/**
 * @module SelectPicker
 * @description
 * 選択ピッカーコンポーネント（単一選択・複数選択）
 *
 * オプションリストから単一または複数の項目を選択できるピッカー。
 * チェックボックス形式のUIでリスト表示。
 *
 * 機能:
 * - 単一選択モード（ラジオボタン形式）
 * - 複数選択モード（チェックボックス形式）
 * - 最大選択数制限（複数選択時）
 * - スクロール可能なオプションリスト
 * - ボトムシートモーダル表示
 *
 * @see PickerTypes - 共通型定義
 * @see BottomSheetModal - ベースモーダル
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { BottomSheetModal } from '@components/common/UnifiedModal';
import { ModalFooter } from '@components/common/ModalFooter';
import { BasePickerProps, PickerOption, PickerValue } from './PickerTypes';
import { UI_CONSTANTS } from '@constants/ui';

/* ========================================
   Props定義
   ======================================== */

/**
 * SelectPickerのProps
 * @template T - オプション値の型
 * @property options - 選択可能なオプション配列
 * @property value - 現在選択されている値（単一または配列）
 * @property onValueChange - 選択変更時のコールバック
 * @property multiSelect - 複数選択を有効にするか（デフォルト: false）
 * @property maxSelections - 複数選択時の最大選択数
 */
interface SelectPickerProps<T = PickerValue> extends BasePickerProps {
  options: PickerOption<T>[];
  value?: T | T[];
  onValueChange: (value: T | T[]) => void;
  multiSelect?: boolean;
  maxSelections?: number;
}

const SelectPicker: React.FC<SelectPickerProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  options,
  value,
  onValueChange,
  multiSelect = false,
  maxSelections,
  confirmText,
  cancelText,
  showCancel = true,
  maxHeight = '65%',
}) => {
  /* ========================================
     Hooks & コンテキスト
     ======================================== */
  const { colors, spacing, typography } = useTheme();

  /* ========================================
     状態管理
     ======================================== */
  /** 単一選択時の一時的な選択値（確定前の値を保持） */
  const [tempValue, setTempValue] = useState(value);
  /** 複数選択時の一時的な選択値配列（確定前の値を保持） */
  const [selectedOptions, setSelectedOptions] = useState<PickerValue[]>(
    Array.isArray(value) ? value : []
  );

  /* ========================================
     副作用
     ======================================== */

  /**
   * 親から渡されたvalueが変更されたら内部状態を同期
   */
  useEffect(() => {
    setTempValue(value);
    if (Array.isArray(value)) {
      setSelectedOptions(value);
    }
  }, [value]);

  /* ========================================
     イベントハンドラ
     ======================================== */

  /**
   * 確定ボタン押下時の処理
   */
  const handleConfirm = () => {
    const finalValue = multiSelect ? selectedOptions : tempValue;
    if (finalValue !== undefined) {
      onValueChange(finalValue);
    }
    onClose();
  };

  /* ========================================
     レンダリング
     ======================================== */

  if (!visible) return null;

  if (multiSelect) {
    /* 複数選択ピッカー（ボトムシート形式） */
    return (
      <BottomSheetModal
        visible={visible}
        onClose={onClose}
        title={title}
        showCloseButton={false}
        showHandle={true}
        maxHeight={maxHeight}
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

        {/* オプションリスト（スクロール可能） */}
        <ScrollView style={{
          minHeight: 300,
          maxHeight: 350,
          paddingVertical: spacing.md
        }}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
        showsVerticalScrollIndicator={true}>
          {options.map((option, index) => {
            const isSelected = selectedOptions.includes(option.value);
            const canSelect = !maxSelections || selectedOptions.length < maxSelections || isSelected;

            /* オプションアイテム（チェックボックス形式） */
            return (
              <TouchableOpacity
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  backgroundColor: isSelected ? colors.primary + '20' : 'transparent',
                  borderRadius: UI_CONSTANTS.BORDER_RADIUS.MD,
                  marginBottom: spacing.xs,
                  opacity: canSelect ? 1 : 0.5,
                }}
                onPress={() => {
                  if (!canSelect && !isSelected) return;

                  let newSelected = [...selectedOptions];
                  if (isSelected) {
                    newSelected = newSelected.filter(v => v !== option.value);
                  } else {
                    newSelected.push(option.value);
                  }
                  setSelectedOptions(newSelected);
                }}
                disabled={option.disabled}
              >
                {/* チェックボックス */}
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
                  borderWidth: UI_CONSTANTS.BORDER_WIDTH.THICK,
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? colors.primary : 'transparent',
                  marginRight: spacing.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {/* チェックマーク */}
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                  )}
                </View>
                {/* オプションラベル */}
                <Text style={[typography.bodyMedium, {
                  color: isSelected ? colors.primary : colors.textPrimary,
                  fontWeight: isSelected ? UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD : UI_CONSTANTS.FONT_WEIGHT.NORMAL,
                  flex: 1,
                }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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
  }

  /* 単一選択ピッカー（ボトムシート形式） */
  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={title}
      showCloseButton={false}
      showHandle={true}
      maxHeight={maxHeight}
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

      {/* オプションリスト（スクロール可能） */}
      <ScrollView style={{
        minHeight: 280,
        maxHeight: 320,
        paddingVertical: spacing.md
      }}
      contentContainerStyle={{ paddingBottom: spacing.lg }}
      showsVerticalScrollIndicator={true}>
        {options.map((option, index) => {
          const isSelected = tempValue === option.value;

          /* オプションアイテム（ラジオボタン形式） */
          return (
            <TouchableOpacity
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.lg,
                paddingHorizontal: spacing.lg,
                backgroundColor: isSelected ? colors.primary + '20' : 'transparent',
                borderRadius: UI_CONSTANTS.BORDER_RADIUS.MD,
                marginBottom: spacing.xs,
              }}
              onPress={() => setTempValue(option.value)}
              disabled={option.disabled}
            >
              {/* ラジオボタン */}
              <View style={{
                width: 24,
                height: 24,
                borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
                borderWidth: UI_CONSTANTS.BORDER_WIDTH.THICK,
                borderColor: isSelected ? colors.primary : colors.border,
                backgroundColor: isSelected ? colors.primary : 'transparent',
                marginRight: spacing.md,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {/* チェックマーク */}
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                )}
              </View>
              {/* オプションラベル */}
              <Text style={[typography.bodyLarge, {
                color: isSelected ? colors.primary : colors.textPrimary,
                fontWeight: isSelected ? UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD : UI_CONSTANTS.FONT_WEIGHT.NORMAL,
                flex: 1,
              }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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

export default SelectPicker;
