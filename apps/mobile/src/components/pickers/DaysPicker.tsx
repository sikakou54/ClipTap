/**
 * @module DaysPicker
 * @description
 * 曜日選択ピッカーコンポーネント
 *
 * 複数の曜日を選択できるピッカー。
 * プリセット選択（平日/週末/毎日）と個別選択の両方に対応。
 *
 * 機能:
 * - プリセット選択（平日、週末、毎日）
 * - 個別曜日のトグル選択
 * - 最大選択数制限
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
import { BasePickerProps, PickerOption } from './PickerTypes';
import { useTranslation } from '@cliptap/shared';

/* ========================================
   Props定義
   ======================================== */

/**
 * DaysPickerのProps
 * @property value - 選択中の曜日配列（0=日曜〜6=土曜）
 * @property onValueChange - 曜日選択変更時のコールバック
 * @property maxSelections - 最大選択可能数（省略時は無制限）
 */
interface DaysPickerProps extends BasePickerProps {
  value?: number[];
  onValueChange: (days: number[]) => void;
  maxSelections?: number;
}

const DaysPicker: React.FC<DaysPickerProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  value,
  onValueChange,
  maxSelections,
  confirmText,
  cancelText,
  showCancel = true,
}) => {
  /* ========================================
     Hooks & コンテキスト
     ======================================== */
  const { colors, spacing, typography } = useTheme();
  const { t } = useTranslation();

  /* ========================================
     状態管理
     ======================================== */
  /** 選択中の曜日配列（0=日曜〜6=土曜、JavaScript Date準拠） */
  const [selectedDays, setSelectedDays] = useState<number[]>(value ?? []);

  /* ========================================
     定数定義
     ======================================== */

  /**
   * プリセット選択肢
   * よく使う曜日パターンをワンタップで選択可能
   */
  const presetOptions = [
    { label: t('common.weekdays'), value: [1, 2, 3, 4, 5] },      // 平日（月〜金）
    { label: t('common.weekends'), value: [0, 6] },               // 週末（日・土）
    { label: t('common.everyday'), value: [0, 1, 2, 3, 4, 5, 6] }, // 毎日（全曜日）
  ];

  /**
   * 曜日オプション
   * 0=日曜から始まり6=土曜で終わる（JavaScript Date準拠）
   */
  const dayOptions: PickerOption<number>[] = [
    { label: t('common.sunday'), value: 0 },    // 日曜
    { label: t('common.monday'), value: 1 },    // 月曜
    { label: t('common.tuesday'), value: 2 },   // 火曜
    { label: t('common.wednesday'), value: 3 }, // 水曜
    { label: t('common.thursday'), value: 4 },  // 木曜
    { label: t('common.friday'), value: 5 },    // 金曜
    { label: t('common.saturday'), value: 6 },  // 土曜
  ];

  /* ========================================
     副作用
     ======================================== */

  /**
   * 親から渡されたvalueが変更されたら内部状態を同期
   */
  useEffect(() => {
    setSelectedDays(value ?? []);
  }, [value]);

  /* ========================================
     イベントハンドラ
     ======================================== */

  /**
   * 確定ボタン押下時の処理
   */
  const handleConfirm = () => {
    onValueChange(selectedDays);
    onClose();
  };

  /**
   * プリセット選択時の処理
   */
  const handlePresetSelect = (presetDays: number[]) => {
    setSelectedDays(presetDays);
  };

  /* ========================================
     レンダリング
     ======================================== */

  if (!visible) return null;

  /* 曜日選択ピッカー（ボトムシート形式） */
  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={title}
      showCloseButton={false}
      showHandle={true}
      maxHeight="60%"
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

      {/* スクロール可能なコンテンツ */}
      <ScrollView
        style={{ maxHeight: 400 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingVertical: spacing.sm }}>
          {/* プリセット選択セクション（平日/週末/毎日） */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              {t('time.commonPresets', 'よく使う設定')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {presetOptions.map((preset, index) => (
                /* プリセットボタン */
                <TouchableOpacity
                  key={`preset-${index}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    backgroundColor: colors.primary + '10',
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: colors.primary + '30',
                    flexShrink: 1,
                  }}
                  onPress={() => handlePresetSelect(preset.value)}
                >
                  <Ionicons name="flash" size={16} color={colors.primary} style={{ marginRight: spacing.xs }} />
                  <Text style={[typography.caption, {
                    color: colors.primary,
                    fontWeight: '600',
                  }]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 個別曜日選択セクション */}
          <View>
            <Text style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              {t('time.individualSelect', '個別選択')}
            </Text>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.xs,
            }}>
              {dayOptions.map((option, index) => {
                const isSelected = selectedDays.includes(option.value);
                const canSelect = !maxSelections || selectedDays.length < maxSelections || isSelected;

                /* 曜日ボタン */
                return (
                  <TouchableOpacity
                    key={index}
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 1,
                      aspectRatio: 1,
                      marginHorizontal: spacing.xs / 2,
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                      opacity: canSelect ? 1 : 0.5,
                    }}
                    onPress={() => {
                      if (!canSelect && !isSelected) return;

                      let newSelected = [...selectedDays];
                      if (isSelected) {
                        newSelected = newSelected.filter(v => v !== option.value);
                      } else {
                        newSelected.push(option.value);
                      }
                      setSelectedDays(newSelected);
                    }}
                    disabled={option.disabled}
                  >
                    {/* 曜日名 */}
                    <Text style={[typography.caption, {
                      color: isSelected ? colors.textInverse : colors.textPrimary,
                      fontWeight: isSelected ? '700' : '600',
                      textAlign: 'center',
                    }]}>
                      {option.label}
                    </Text>
                    {/* 選択中のチェックマーク */}
                    {isSelected && (
                      <View style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: colors.textInverse,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Ionicons
                          name="checkmark"
                          size={8}
                          color={colors.primary}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
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

export default DaysPicker;
