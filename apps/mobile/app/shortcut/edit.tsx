/**
 * @module ShortcutEditModal
 * @description ショートカット作成・編集モーダル
 *
 * ショートカット名と、そのショートカットが持つ値一覧を編集するモーダル画面。
 *
 * @features
 * - ショートカット名の入力
 * - 値の追加/編集/削除（値の実体は保存時にまとめてDBへ反映）
 * - 値が1件も無い状態では保存できない
 *
 * @see src/hooks/screens/useShortcutEditScreen.ts - ビジネスロジック
 * @see docs/機能仕様書.md §8.24 ショートカット管理
 */

import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from '@cliptap/shared';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { useShortcutEditScreen } from '@hooks/screens/useShortcutEditScreen';
import { ProfileChipSelector } from '@components/profile/ProfileChipSelector';
import { ScreenContainer } from '@components/common/ScreenContainer';
import { UI_CONSTANTS } from '@constants/ui';

export default function ShortcutEditModal() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const params = useLocalSearchParams();

  const shortcutId = params.id as string | undefined;

  const {
    name,
    setName,
    profileId,
    setProfileId,
    selectableProfiles,
    values,
    saving,
    isEdit,
    canSave,
    handleAddValue,
    handleEditValue,
    handleDeleteValue,
    handleSave,
  } = useShortcutEditScreen({ shortcutId });

  /* ショートカット作成・編集モーダル */
  return (
    <ScreenContainer
      title={isEdit ? t('shortcut.edit') : t('shortcut.create')}
      isModal={true}
      rightAction={
        <TouchableOpacity onPress={handleSave} disabled={saving || !canSave} style={styles.saveButton}>
          <Text
            style={[
              styles.saveText,
              {
                color: saving || !canSave ? colors.textSecondary : colors.primary,
                fontSize: responsiveFontSizes.base,
                lineHeight: responsiveLineHeights.base,
              },
            ]}
          >
            {t('shortcut.register')}
          </Text>
        </TouchableOpacity>
      }
    >
      {/* スクロール可能なコンテンツエリア */}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* ショートカット名入力セクション */}
        <View style={styles.section}>
          {/* ラベルと文字数カウンター */}
          <View style={styles.labelRow}>
            <Text
              style={[
                styles.label,
                { color: colors.textSecondary, fontSize: responsiveFontSizes.sm },
              ]}
            >
              {t('shortcut.name')}
            </Text>
            <Text
              style={[
                styles.charCount,
                { color: colors.textSecondary, fontSize: responsiveFontSizes.xs },
              ]}
            >
              {name.length}/{UI_CONSTANTS.INPUT_LIMITS.SHORTCUT_NAME_MAX}
            </Text>
          </View>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                fontSize: responsiveFontSizes.base,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder={t('shortcut.name_placeholder')}
            placeholderTextColor={colors.textSecondary}
            maxLength={UI_CONSTANTS.INPUT_LIMITS.SHORTCUT_NAME_MAX}
          />
        </View>

        {/* 所属プロファイル選択セクション（プロファイルが複数ある場合のみ表示）。
            新規作成ではアクティブなプロファイルが初期選択され、ここで別のプロファイルへ移せる */}
        {selectableProfiles.length > 1 && (
          <View style={styles.section}>
            <Text
              style={[
                styles.label,
                { color: colors.textSecondary, fontSize: responsiveFontSizes.sm },
              ]}
            >
              {t('shortcut.profile')}
            </Text>
            <ProfileChipSelector
              profiles={selectableProfiles}
              selectedProfileId={profileId}
              onSelectProfile={setProfileId}
            />
          </View>
        )}

        {/* 値一覧セクション */}
        <View style={styles.section}>
          <Text
            style={[
              styles.label,
              { color: colors.textSecondary, fontSize: responsiveFontSizes.sm },
            ]}
          >
            {t('shortcut.values')}
          </Text>

          {/* 登録済みの値（タップで編集） */}
          {values.map((draft) => (
            <TouchableOpacity
              key={draft.key}
              style={[styles.valueCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleEditValue(draft)}
              activeOpacity={0.7}
            >
              <View style={styles.valueCardMain}>
                {/* 値名 */}
                <Text
                  style={[
                    styles.valueName,
                    {
                      color: colors.text,
                      fontSize: responsiveFontSizes.base,
                      lineHeight: responsiveLineHeights.base,
                    },
                  ]}
                  numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.SINGLE}
                >
                  {draft.name}
                </Text>
                {/* 挿入する値 */}
                <Text
                  style={[
                    styles.valueText,
                    {
                      color: colors.textSecondary,
                      fontSize: responsiveFontSizes.sm,
                      lineHeight: responsiveLineHeights.sm,
                    },
                  ]}
                  numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.DOUBLE}
                >
                  {draft.value}
                </Text>
              </View>

              {/* 削除ボタン */}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteValue(draft);
                }}
                hitSlop={UI_CONSTANTS.HIT_SLOP.DEFAULT}
                style={styles.valueDeleteButton}
              >
                <Ionicons name="trash-outline" size={UI_CONSTANTS.ICON_SIZE.SM} color={colors.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          {/* 値を追加 */}
          <TouchableOpacity
            style={[styles.addValueButton, { borderColor: colors.primary }]}
            onPress={handleAddValue}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={UI_CONSTANTS.ICON_SIZE.SM} color={colors.primary} />
            <Text
              style={[
                styles.addValueText,
                {
                  color: colors.primary,
                  fontSize: responsiveFontSizes.base,
                  lineHeight: responsiveLineHeights.base,
                },
              ]}
            >
              {t('shortcut.value_create')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: UI_CONSTANTS.SPACING.LG,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    paddingBottom: UI_CONSTANTS.SPACING.XXXL,
  },
  saveButton: {
    padding: UI_CONSTANTS.SPACING.XS,
  },
  saveText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  section: {
    marginBottom: UI_CONSTANTS.SPACING.XXL,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.GAP.MD,
  },
  label: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
    marginBottom: UI_CONSTANTS.GAP.MD,
  },
  charCount: {
    marginBottom: UI_CONSTANTS.GAP.MD,
  },
  input: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    padding: UI_CONSTANTS.SPACING.BASE,
    minHeight: UI_CONSTANTS.BUTTON_HEIGHT.MEDIUM,
  },
  valueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    padding: UI_CONSTANTS.SPACING.BASE,
    marginBottom: UI_CONSTANTS.GAP.MD,
    minHeight: UI_CONSTANTS.BUTTON_HEIGHT.LARGE,
  },
  valueCardMain: {
    flex: 1,
    gap: UI_CONSTANTS.GAP.XS,
    paddingRight: UI_CONSTANTS.GAP.MD,
  },
  valueName: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
  },
  valueText: {
    fontFamily: 'monospace',
  },
  valueDeleteButton: {
    padding: UI_CONSTANTS.SPACING.XS,
  },
  addValueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: UI_CONSTANTS.GAP.XS,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    borderStyle: 'dashed',
    minHeight: UI_CONSTANTS.BUTTON_HEIGHT.MEDIUM,
  },
  addValueText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
  },
});
