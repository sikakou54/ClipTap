/**
 * カテゴリ作成・編集モーダルコンポーネント
 *
 * カテゴリの新規作成と既存カテゴリの編集を行うモーダル。
 * 名前入力とカラー選択のUIを提供。
 *
 * 主な機能:
 * - カテゴリ名入力
 * - プリセットカラーからの色選択
 * - 新規作成/編集モードの自動切り替え
 * - バリデーション（名前必須）
 *
 * @see app/category/manage.tsx - カテゴリ管理画面での使用
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { useTranslation, type Category, CATEGORY_COLORS } from '@cliptap/shared';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { UI_CONSTANTS } from '@constants/ui';
import { useCategoryModal } from '@hooks/components/useCategoryModal';

/* ========================================
   Props定義
   ======================================== */

/**
 * CategoryModalのProps
 * @property visible - モーダル表示状態
 * @property category - 編集対象のカテゴリ（nullなら新規作成）
 * @property onClose - 閉じる時のコールバック
 * @property onSuccess - 保存成功時のコールバック
 */
interface CategoryModalProps {
  visible: boolean;
  category?: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryModal({
  visible,
  category,
  onClose,
  onSuccess,
}: CategoryModalProps) {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();

  /* フックからロジックを取得 */
  const {
    categoryName,
    selectedColor,
    saving,
    isEdit,
    setCategoryName,
    setSelectedColor,
    handleSave,
    handleClose,
  } = useCategoryModal({ visible, category, onClose, onSuccess });

  /* カテゴリ作成・編集モーダル */
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      {/* オーバーレイ */}
      <View style={styles.overlay}>
        {/* モーダルコンテンツ */}
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          {/* ヘッダー（タイトルと閉じるボタン） */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text, fontSize: responsiveFontSizes.md, lineHeight: responsiveLineHeights.md }]}>
              {isEdit ? t('category.edit') : t('category.create')}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* カテゴリ名入力欄 */}
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            value={categoryName}
            onChangeText={setCategoryName}
            placeholder={t('category.name_placeholder')}
            placeholderTextColor={colors.textSecondary}
            autoFocus
            onSubmitEditing={handleSave}
          />

          {/* カラー選択セクション */}
          <Text style={[styles.label, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
            {t('category.color')}
          </Text>
          {/* プリセットカラー一覧（水平スクロール） */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorPicker}
          >
            {CATEGORY_COLORS.map((color) => (
              /* カラーオプション */
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {/* 選択中のチェックマーク */}
                {selectedColor === color && (
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* アクションボタン（キャンセル/保存） */}
          <View style={styles.buttons}>
            {/* キャンセルボタン */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                { borderColor: colors.border }
              ]}
              onPress={handleClose}
            >
              <Text style={[styles.buttonText, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            {/* 保存ボタン */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                { backgroundColor: colors.primary }
              ]}
              onPress={handleSave}
              disabled={saving || !categoryName.trim()}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF', fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                {t('common.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ========================================
   スタイル定義
   ======================================== */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI_CONSTANTS.GAP.XL,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.XL,
    padding: UI_CONSTANTS.GAP.XL,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.GAP.LG,
  },
  title: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  input: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    padding: UI_CONSTANTS.GAP.BASE,
    marginBottom: UI_CONSTANTS.GAP.LG,
  },
  label: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
    marginBottom: UI_CONSTANTS.GAP.BASE,
  },
  colorPicker: {
    paddingVertical: UI_CONSTANTS.GAP.XS,
    gap: UI_CONSTANTS.GAP.BASE,
    marginBottom: UI_CONSTANTS.GAP.XL,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.XL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.EXTRA_THICK,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: UI_CONSTANTS.GAP.XXS },
    shadowOpacity: 0.3,
    shadowRadius: UI_CONSTANTS.GAP.XS,
    elevation: UI_CONSTANTS.GAP.XS,
  },
  buttons: {
    flexDirection: 'row',
    gap: UI_CONSTANTS.GAP.BASE,
  },
  button: {
    flex: 1,
    paddingVertical: UI_CONSTANTS.GAP.BASE,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
  },
  saveButton: {},
  buttonText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
});
