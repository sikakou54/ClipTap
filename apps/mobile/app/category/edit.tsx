/**
 * @module CategoryEditModal
 * @description カテゴリ編集モーダル
 *
 * カテゴリの新規作成・編集を行うモーダル画面。
 *
 * @features
 * - カテゴリ名の入力（最大50文字）
 * - カテゴリカラーの選択（15色のプリセットカラー）
 * - カスタムRGBカラーの入力
 * - 新規作成/編集モードの自動判定
 *
 * @see src/hooks/screens/useCategoryEditScreen.ts - ビジネスロジック
 */

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from '@cliptap/shared'
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_COLORS } from '@cliptap/shared';
import { useTheme } from '@lib/themeSystem';
import { useCategoryEditScreen } from '@hooks/screens/useCategoryEditScreen';
import { UI_CONSTANTS } from '@constants/ui';
import { ScreenContainer } from '@components/common/ScreenContainer';

export default function CategoryEditModal() {
  const { t } = useTranslation();
  const { colors, isTablet, responsiveFontSizes } = useTheme();
  const params = useLocalSearchParams();

  const categoryId = params.id as string | undefined;

  const {
    categoryName,
    setCategoryName,
    selectedColor,
    useCustomColor,
    customR,
    customG,
    customB,
    saving,
    isEdit,
    canSave,
    currentColor,
    validation,
    handleSave,
    handleColorSelect,
    handlePresetColorToggle,
    handleCustomColorToggle,
    handleRGBChange,
  } = useCategoryEditScreen({ categoryId });

  /* カテゴリ編集モーダル */
  return (
    <ScreenContainer
      title={isEdit ? t('category.edit') : t('category.create')}
      isModal={true}
      rightAction={
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !canSave}
          style={styles.saveButton}
        >
          <Text
            style={[
              styles.saveText,
              {
                color: saving || !canSave ? colors.textSecondary : colors.primary,
                fontSize: responsiveFontSizes.base,
              },
            ]}
          >
            {t('common.save')}
          </Text>
        </TouchableOpacity>
      }
    >
      {/* スクロール可能なコンテンツエリア */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* カテゴリ名入力セクション */}
        <View style={styles.inputContainer}>
          {/* ラベルと文字数カウンター */}
          <View style={styles.labelRow}>
            <Text
              style={[
                styles.label,
                { color: colors.textSecondary, fontSize: responsiveFontSizes.sm },
              ]}
            >
              {t('category.title')}
            </Text>
            <Text
              style={[
                styles.charCount,
                { color: colors.textSecondary, fontSize: responsiveFontSizes.xs },
              ]}
            >
              {categoryName.length}/{UI_CONSTANTS.INPUT_LIMITS.CATEGORY_NAME_MAX}
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
            value={categoryName}
            onChangeText={setCategoryName}
            placeholder={t('category.name_placeholder')}
            placeholderTextColor={colors.textSecondary}
            autoFocus
            onSubmitEditing={handleSave}
            maxLength={UI_CONSTANTS.INPUT_LIMITS.CATEGORY_NAME_MAX}
          />
        </View>

        {/* カラー選択セクション */}
        <View style={styles.colorSection}>
          {/* プリセット/カスタムカラーの切り替えボタン */}
          <View style={styles.colorModeSwitch}>
            <TouchableOpacity
              style={[
                styles.modeSwitchButton,
                !useCustomColor && { backgroundColor: colors.primary },
                { borderColor: colors.border },
              ]}
              onPress={handlePresetColorToggle}
            >
              <Text
                style={[
                  styles.modeSwitchText,
                  {
                    color: !useCustomColor ? colors.onPrimary : colors.textSecondary,
                    fontSize: responsiveFontSizes.sm,
                  },
                ]}
              >
                {t('category.preset_colors')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeSwitchButton,
                useCustomColor && { backgroundColor: colors.primary },
                { borderColor: colors.border },
              ]}
              onPress={handleCustomColorToggle}
            >
              <Text
                style={[
                  styles.modeSwitchText,
                  {
                    color: useCustomColor ? colors.onPrimary : colors.textSecondary,
                    fontSize: responsiveFontSizes.sm,
                  },
                ]}
              >
                {t('category.custom_rgb')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* プリセットカラーグリッド */}
          {!useCustomColor ? (
            <View style={styles.colorGrid}>
              {CATEGORY_COLORS.map((color) => {
                /* 保存値の表記ゆれ（小文字・前後の空白）を吸収して選択中かを判定する。
                   判定規則は resolveCategoryColorForm のプリセット判定と揃えている */
                const isColorSelected = selectedColor.trim().toUpperCase() === color.toUpperCase();

                /* プリセットカラーの選択肢 */
                return (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      {
                        backgroundColor: color,
                        width: isTablet ? 48 : 40,
                        height: isTablet ? 48 : 40,
                        borderRadius: isTablet ? 24 : 20,
                      },
                      isColorSelected && !useCustomColor && [
                        styles.colorOptionSelected,
                        { borderColor: colors.onPrimary, shadowColor: colors.shadow },
                      ],
                    ]}
                    onPress={() => handleColorSelect(color)}
                  >
                    {/* 選択中のチェックマーク */}
                    {isColorSelected && (
                      <Ionicons name="checkmark" size={isTablet ? 24 : 20} color={colors.onPrimary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            /* カスタムRGB入力セクション */
            <View style={styles.rgbInputSection}>
              <View style={styles.rgbInputRow}>
                {/* RGB入力カラム */}
                <View style={styles.rgbInputColumn}>
                  {/* R/G/B の3入力は同じ規則で、不正値のときは枠線色を colors.error にするだけでなく太さも 1→2 にし、色と太さの両方で異常を示している */}
                  {/* R値入力 */}
                  <View style={styles.rgbInputWrapper}>
                    <Text
                      style={[
                        styles.rgbLabel,
                        { color: colors.text, fontSize: responsiveFontSizes.sm },
                      ]}
                    >
                      R
                    </Text>
                    <TextInput
                      style={[
                        styles.rgbInput,
                        {
                          backgroundColor: colors.surface,
                          color: colors.text,
                          fontSize: responsiveFontSizes.base,
                          borderColor: !validation.isRValid ? colors.error : colors.border,
                          borderWidth: !validation.isRValid ? 2 : 1,
                        },
                      ]}
                      value={customR}
                      onChangeText={(text) => handleRGBChange('R', text)}
                      keyboardType="number-pad"
                      placeholder="0-255"
                      placeholderTextColor={colors.textSecondary}
                      maxLength={3}
                    />
                  </View>
                  {/* G値入力 */}
                  <View style={styles.rgbInputWrapper}>
                    <Text
                      style={[
                        styles.rgbLabel,
                        { color: colors.text, fontSize: responsiveFontSizes.sm },
                      ]}
                    >
                      G
                    </Text>
                    <TextInput
                      style={[
                        styles.rgbInput,
                        {
                          backgroundColor: colors.surface,
                          color: colors.text,
                          fontSize: responsiveFontSizes.base,
                          borderColor: !validation.isGValid ? colors.error : colors.border,
                          borderWidth: !validation.isGValid ? 2 : 1,
                        },
                      ]}
                      value={customG}
                      onChangeText={(text) => handleRGBChange('G', text)}
                      keyboardType="number-pad"
                      placeholder="0-255"
                      placeholderTextColor={colors.textSecondary}
                      maxLength={3}
                    />
                  </View>
                  {/* B値入力 */}
                  <View style={styles.rgbInputWrapper}>
                    <Text
                      style={[
                        styles.rgbLabel,
                        { color: colors.text, fontSize: responsiveFontSizes.sm },
                      ]}
                    >
                      B
                    </Text>
                    <TextInput
                      style={[
                        styles.rgbInput,
                        {
                          backgroundColor: colors.surface,
                          color: colors.text,
                          fontSize: responsiveFontSizes.base,
                          borderColor: !validation.isBValid ? colors.error : colors.border,
                          borderWidth: !validation.isBValid ? 2 : 1,
                        },
                      ]}
                      value={customB}
                      onChangeText={(text) => handleRGBChange('B', text)}
                      keyboardType="number-pad"
                      placeholder="0-255"
                      placeholderTextColor={colors.textSecondary}
                      maxLength={3}
                    />
                  </View>
                </View>

                {/* カラープレビューセクション */}
                <View style={styles.colorPreviewSection}>
                  <View
                    style={[
                      styles.colorPreview,
                      {
                        backgroundColor: currentColor,
                        borderColor: colors.border,
                        shadowColor: colors.shadow,
                      },
                    ]}
                  />
                  {/* 16進数カラー値表示 */}
                  <Text
                    style={[
                      styles.hexValue,
                      { color: colors.textSecondary, fontSize: responsiveFontSizes.sm },
                    ]}
                  >
                    {currentColor}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
  },
  input: {
    borderRadius: 10,
    padding: 12,
  },
  inputContainer: {
    marginBottom: 20,
  },
  charCount: {},
  colorSection: {
    marginBottom: 16,
  },
  colorModeSwitch: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modeSwitchButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modeSwitchText: {
    fontWeight: '600',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  /** 選択中のプリセットカラー（枠線色と影の色は使用箇所でテーマから重ねる） */
  colorOptionSelected: {
    borderWidth: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  rgbInputSection: {
    gap: 20,
  },
  rgbInputRow: {
    flexDirection: 'row',
    gap: 0,
    alignItems: 'center',
  },
  rgbInputColumn: {
    flex: 0.5,
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rgbInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rgbLabel: {
    fontWeight: '600',
    width: 20,
  },
  rgbInput: {
    width: 80,
    borderRadius: 8,
    padding: 12,
    textAlign: 'center',
    borderWidth: 1,
  },
  colorPreviewSection: {
    flex: 0.5,
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  /** 現在の色のプレビュー（枠線色と影の色は使用箇所でテーマから重ねる） */
  colorPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  hexValue: {
    fontFamily: 'monospace',
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  saveButton: {
    padding: 4,
  },
  saveText: {
    fontWeight: '600',
  },
});
