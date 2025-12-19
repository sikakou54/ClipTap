/**
 * ソートメニューコンポーネント
 *
 * スニペット一覧のソート順を変更するドロップダウンメニュー。
 * 現在のソート順を表示し、タップでモーダルを開いて変更可能。
 *
 * ソートオプション:
 * - recent: 最近使用した順（デフォルト）
 * - title: タイトル順（アルファベット/あいうえお順）
 *
 * @see app/(tabs)/index.tsx - メイン画面での使用例
 */

import React from 'react';
import { Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@cliptap/shared';
import { useTheme } from '@lib/themeSystem';
import { SnippetSortBy } from '@cliptap/shared';
import { UI_CONSTANTS } from '@constants/ui';
import { useSortMenu } from '@hooks/components/useSortMenu';

/* ========================================
   Props定義
   ======================================== */

/**
 * SortMenuのProps
 * @property currentSort - 現在のソート順
 * @property onSortChange - ソート順変更時のコールバック
 */
interface SortMenuProps {
  currentSort: SnippetSortBy;
  onSortChange: (sort: SnippetSortBy) => void;
}

export function SortMenu({ currentSort, onSortChange }: SortMenuProps) {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();

  /* フックからロジックを取得 */
  const {
    visible,
    sortOptions,
    currentOption,
    handlePress,
    handleSelect,
    handleClose,
  } = useSortMenu({ currentSort, onSortChange });

  return (
    <>
      {/* ソートボタン（現在のソート順を表示） */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.surface }]}
        onPress={handlePress}
      >
        {/* ソートアイコン */}
        <Ionicons
          name={currentOption?.icon}
          size={18}
          color={colors.text}
        />
        {/* ソートラベル */}
        <Text style={[styles.label, { color: colors.text, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
          {currentOption?.label}
        </Text>
        {/* ドロップダウンアイコン */}
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* ソート選択モーダル */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        {/* オーバーレイ（背景タップで閉じる） */}
        <Pressable style={styles.overlay} onPress={handleClose}>
          {/* モーダルコンテンツ */}
          <Pressable style={[styles.modal, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            {/* モーダルタイトル */}
            <Text style={[styles.modalTitle, { color: colors.text, fontSize: responsiveFontSizes.lg, lineHeight: responsiveLineHeights.lg }]}>
              {t('sort.title')}
            </Text>
            {/* ソートオプション一覧 */}
            {sortOptions.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  index < sortOptions.length - 1 && styles.optionBorder,
                  { borderBottomColor: colors.border }
                ]}
                onPress={() => handleSelect(option.value)}
              >
                {/* オプションアイコン */}
                <Ionicons
                  name={option.icon}
                  size={22}
                  color={currentSort === option.value ? colors.primary : colors.text}
                />
                {/* オプションラベル */}
                <Text style={[
                  styles.optionText,
                  {
                    color: currentSort === option.value ? colors.primary : colors.text,
                    fontSize: responsiveFontSizes.base,
                    lineHeight: responsiveLineHeights.base
                  }
                ]}>
                  {option.label}
                </Text>
                {/* 選択中のチェックマーク */}
                {currentSort === option.value && (
                  <Ionicons name="checkmark" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  label: {
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '80%',
    maxWidth: 360,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.LG,
    padding: UI_CONSTANTS.SPACING.LG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.BOLD,
    marginBottom: UI_CONSTANTS.GAP.LG,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.GAP.MD,
    paddingVertical: UI_CONSTANTS.GAP.LG,
  },
  optionBorder: {
    borderBottomWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
  },
  optionText: {
    flex: 1,
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
  },
});
