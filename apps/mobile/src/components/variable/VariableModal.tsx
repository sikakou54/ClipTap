/**
 * 変数作成・編集モーダルコンポーネント
 *
 * カスタム変数の新規作成と既存変数の編集を行うページシート形式モーダル。
 * 変数名、表示ラベル、値、アイコンの設定が可能。
 *
 * 主な機能:
 * - 変数名入力（英数字・アンダースコアのみ）
 * - 表示ラベル設定（任意）
 * - 値の入力（複数行対応）
 * - アイコン選択（100種類以上）
 * - リアルタイムプレビュー
 * - 予約語・重複チェック
 *
 * バリデーション:
 * - 変数名: 英数字・アンダースコア、予約語不可、重複不可
 * - 値: 必須
 * - 変数名最大長: UI_CONSTANTS.INPUT_LIMITS.VARIABLE_NAME_MAX
 *
 * @see app/variable/index.tsx - 変数管理画面
 * @see useVariables - 変数管理フック
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useTranslation } from '@cliptap/shared';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { Variable } from '@cliptap/shared';
import { UI_CONSTANTS, VARIABLE_ICONS } from '@constants/ui';
import { useVariableModal } from '@hooks/components/useVariableModal';

/* ========================================
   Props定義
   ======================================== */

/**
 * VariableModalのProps
 * @property visible - モーダル表示状態
 * @property editingVariable - 編集対象の変数（nullなら新規作成）
 * @property onSave - 保存時のコールバック
 * @property onClose - 閉じる時のコールバック
 */
interface VariableModalProps {
  visible: boolean;
  editingVariable: Variable | null;
  onSave: (name: string, value: string, label: string, icon: string) => void;
  onClose: () => void;
}

export function VariableModal({ visible, editingVariable, onSave, onClose }: VariableModalProps) {
  /* ========================================
     Hooks & コンテキスト
     ======================================== */
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();

  /* フックからロジックを取得 */
  const {
    name,
    label,
    value,
    selectedIcon,
    isNameValid,
    nameErrorMessage,
    canSave,
    setName,
    setLabel,
    setValue,
    setSelectedIcon,
    handleSave,
  } = useVariableModal({
    visible,
    editingVariable,
    onSave,
    onClose,
  });

  /* ========================================
     レンダリング
     ======================================== */

  return (
    /* 変数作成・編集モーダル（ページシート形式） */
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* ヘッダー（閉じるボタン、タイトル、保存ボタン） */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {/* 閉じるボタン */}
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          {/* タイトル */}
          <Text style={[styles.headerTitle, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
            {editingVariable ? t('settings.variable_edit') : t('settings.variable_add')}
          </Text>
          {/* 保存ボタン */}
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveButton}
            disabled={!canSave}
          >
            <Text style={[styles.saveText, { color: canSave ? colors.primary : colors.textSecondary, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
              {t('common.save')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* スクロール可能なフォームコンテンツ */}
        <ScrollView style={styles.content}>
          {/* 変数名入力セクション */}
          <View style={styles.section}>
            {/* ラベルと文字数カウンター */}
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>{t('settings.variable_name')} *</Text>
              <Text style={[styles.charCount, { color: !isNameValid ? colors.error : colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
                {name.length}/{UI_CONSTANTS.INPUT_LIMITS.VARIABLE_NAME_MAX}
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderWidth: !isNameValid ? 2 : 0,
                  borderColor: colors.error,
                }
              ]}
              value={name}
              onChangeText={setName}
              placeholder={t('settings.variable_name_placeholder')}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              editable={true}
            />
            {/* エラーメッセージまたはヒント */}
            <Text style={[styles.hint, { color: !isNameValid ? colors.error : colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
              {nameErrorMessage || t('settings.variable_name_hint')}
            </Text>
          </View>

          {/* 表示ラベルセクション */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base, marginBottom: 8 }]}>{t('settings.variable_label')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
              value={label}
              onChangeText={setLabel}
              placeholder={t('settings.variable_label_placeholder')}
              placeholderTextColor={colors.textSecondary}
            />
            {/* ヒント */}
            <Text style={[styles.hint, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
              {t('settings.variable_label_hint')}
            </Text>
          </View>

          {/* 値入力セクション */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base, marginBottom: 8 }]}>{t('settings.variable_value')} *</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text }]}
              value={value}
              onChangeText={setValue}
              placeholder={t('settings.variable_value_placeholder')}
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.DESCRIPTION}
            />
            {/* ヒント */}
            <Text style={[styles.hint, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
              {t('settings.variable_value_hint')}
            </Text>
          </View>

          {/* アイコン選択セクション */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base, marginBottom: 8 }]}>{t('settings.variable_icon')}</Text>
            {/* アイコン選択グリッド */}
            <View style={styles.iconGrid}>
              {VARIABLE_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconButton,
                    {
                      backgroundColor: selectedIcon === icon ? colors.primary : colors.surface,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Ionicons
                    name={icon}
                    size={24}
                    color={selectedIcon === icon ? '#fff' : colors.text}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* プレビューセクション */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base, marginBottom: 8 }]}>{t('settings.variable_preview')}</Text>
            <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.previewContent}>
                {/* プレビューアイコン */}
                <Ionicons name={selectedIcon} size={16} color={colors.primary} />
                {/* プレビューラベル */}
                <Text style={[styles.previewLabel, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                  {label || name || t('settings.variable_name')}
                </Text>
              </View>
              {/* プレビュー変数コード（{{変数名}}） */}
              <Text style={[styles.previewVariable, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
                {`{{${name || 'variable'}}}`}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ========================================
   スタイル定義
   ======================================== */
const styles = StyleSheet.create({
  /** モーダルコンテナ */
  container: {
    flex: 1,
  },
  /** ヘッダー（閉じる・タイトル・保存） */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  /** 閉じるボタン */
  backButton: {
    padding: 4,
  },
  /** ヘッダータイトル */
  headerTitle: {
    fontWeight: '600',
  },
  /** 保存ボタン */
  saveButton: {
    padding: 4,
  },
  /** 保存ボタンテキスト */
  saveText: {
    fontWeight: '600',
  },
  /** スクロールコンテンツ */
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  /** 入力セクション */
  section: {
    marginBottom: 24,
  },
  /** ラベル行（ラベルと文字数カウンターを横並び） */
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  /** セクションラベル */
  label: {
    fontWeight: '600',
  },
  /** 文字数カウンター */
  charCount: {},
  /** テキスト入力欄 */
  input: {
    borderRadius: 10,
    padding: 12,
  },
  /** 複数行テキスト入力欄 */
  textArea: {
    borderRadius: 10,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  /** ヒント/エラーテキスト */
  hint: {
    marginTop: 4,
  },
  /** アイコン選択グリッド */
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  /** アイコン選択ボタン */
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /** プレビューコンテナ */
  preview: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    gap: 4,
    alignItems: 'center',
  },
  /** プレビュー内コンテンツ */
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  /** プレビューラベル */
  previewLabel: {
    fontWeight: '600',
  },
  /** プレビュー変数表示（等幅フォント） */
  previewVariable: {
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});
