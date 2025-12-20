/**
 * @module VariablesScreen
 * @description カスタム変数管理画面
 *
 * 定型文内で使用するカスタム変数（{{変数名}}）を一覧表示・管理。
 *
 * @features
 * - カスタム変数一覧の表示
 * - 変数の新規作成/編集/削除
 * - プロファイルによる値のフィルタリング表示
 *
 * @limits
 * - 無料プラン: 最大5つまで（超過分はvalid=0で無効化）
 *
 * @see lib/hooks/screens/useVariablesScreen.ts - ビジネスロジック
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from '@cliptap/shared'
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { useVariablesScreen } from '@hooks/screens/useVariablesScreen';
import { Profile } from '@cliptap/shared';
import { Header } from '@components/common/Header';
import { commonStyles, listStyles } from '@lib/styles/commonStyles';
import { UI_CONSTANTS } from '@constants/ui';

export default function VariablesScreen() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();

  const {
    variables,
    selectedProfileId,
    setSelectedProfileId,
    profiles,
    handleAdd,
    handleEdit,
    handleDelete,
    isVariableEnabled,
    getVariableValue,
  } = useVariablesScreen();

  /* カスタム変数管理画面 */
  return (
    <View style={[commonStyles.container, { backgroundColor: colors.background }]}>
      {/* ヘッダー（タイトルと追加ボタン） */}
      <Header
        title={t('settings.variables')}
        backIcon="arrow-back"
        rightAction={
          <TouchableOpacity onPress={handleAdd} style={commonStyles.addButton}>
            <Ionicons name="add" size={28} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {/* 空状態または変数一覧 */}
      {variables.length === 0 ? (
        /* 空状態（変数がない場合） */
        <View style={styles.emptyState}>
          <Ionicons name="code-slash-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
            {t('settings.no_variables')}
          </Text>
          <Text style={[styles.emptyHint, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
            {t('settings.add_variable_hint')}
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* プロファイルフィルター（複数プロファイルがある場合のみ表示） */}
          {profiles.length > 0 && (
            <View style={[styles.filterSection, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterContent}
              >
                {profiles.map((profile: Profile) => {
                  const isSelected = selectedProfileId === profile.id;
                  /* プロファイルフィルターチップ */
                  return (
                    <TouchableOpacity
                      key={profile.id}
                      style={[
                        styles.filterChip,
                        { borderColor: isSelected ? colors.primary : colors.border },
                        isSelected && { backgroundColor: colors.primary }
                      ]}
                      onPress={() => setSelectedProfileId(profile.id)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.textSecondary,
                          fontSize: responsiveFontSizes.sm
                        }
                      ]}>
                        {profile.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 変数一覧（スクロール可能） */}
          <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
            <View style={styles.variableList}>
              {variables.map((variable, index) => {
                const enabled = isVariableEnabled(variable);
                const value = getVariableValue(variable);

                return (
                  <React.Fragment key={variable.id}>
                    {/* 変数アイテム */}
                    <TouchableOpacity
                      onPress={() => handleEdit(variable, enabled)}
                      activeOpacity={0.7}
                      style={[
                        listStyles.listItem,
                        { opacity: enabled ? 1 : 0.5 },
                      ]}
                    >
                      <View style={styles.variableContent}>
                        {/* 変数アイコン */}
                        <View style={styles.variableIcon}>
                          <Ionicons
                            name={(variable.icon || 'code-outline') as any}
                            size={24}
                            color={enabled ? colors.primary : colors.textSecondary}
                          />
                        </View>
                        <View style={styles.variableInfo}>
                          <View style={styles.variableMain}>
                            {/* 変数名 */}
                            <Text style={[styles.variableName, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                              {variable.label || variable.name}
                            </Text>
                            {/* 無効化バッジ */}
                            {!enabled && (
                              <View style={[styles.disabledBadge, { backgroundColor: colors.error + '20' }]}>
                                <Text style={[styles.disabledBadgeText, { color: colors.error, fontSize: responsiveFontSizes.xs, lineHeight: responsiveLineHeights.xs }]}>
                                  {t('settings.variable_disabled')}
                                </Text>
                              </View>
                            )}
                          </View>
                          {/* 変数キー（{{変数名}}） */}
                          <Text style={[styles.variableKey, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]} numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.SINGLE}>
                            {`{{${variable.name}}}`}
                          </Text>
                          {/* 変数値 */}
                          <Text
                            style={[
                              styles.valueText,
                              {
                                color: value === t('common.not_set') ? colors.textSecondary + '80' : colors.textSecondary,
                                fontSize: responsiveFontSizes.sm,
                                fontStyle: value === t('common.not_set') ? 'italic' : 'normal'
                              }
                            ]}
                            numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.DOUBLE}
                          >
                            {value}
                          </Text>
                        </View>
                      </View>
                      {/* 削除ボタン */}
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(variable);
                        }}
                        style={commonStyles.deleteButton}
                      >
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                    {/* セパレーター（最後のアイテム以外） */}
                    {index < variables.length - 1 && (
                      <View style={[listStyles.separator, { backgroundColor: colors.border }]} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.GIANT,
    paddingHorizontal: UI_CONSTANTS.SPACING.XXXL,
  },
  emptyText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
    marginTop: UI_CONSTANTS.GAP.LG,
  },
  emptyHint: {
    textAlign: 'center',
    marginTop: UI_CONSTANTS.GAP.MD,
  },
  filterSection: {
    paddingVertical: UI_CONSTANTS.GAP.BASE,
  },
  filterContent: {
    paddingHorizontal: UI_CONSTANTS.GAP.LG,
    gap: UI_CONSTANTS.GAP.MD,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UI_CONSTANTS.GAP.BASE,
    paddingVertical: UI_CONSTANTS.GAP.SM,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.XL,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    gap: UI_CONSTANTS.GAP.XS,
  },
  filterChipIcon: {
    fontSize: UI_CONSTANTS.ICON_SIZE.XS,
  },
  filterChipText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  variableList: {
    flexGrow: 1,
  },
  variableContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.GAP.BASE,
    paddingRight: UI_CONSTANTS.GAP.BASE,
  },
  variableIcon: {
    width: UI_CONSTANTS.ICON_SIZE.XXL,
    height: UI_CONSTANTS.ICON_SIZE.XXL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  variableInfo: {
    flex: 1,
    gap: UI_CONSTANTS.GAP.XS,
  },
  variableMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.GAP.MD,
  },
  variableName: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
  },
  variableKey: {
    fontFamily: 'monospace',
  },
  valueText: {
    fontFamily: 'monospace',
    marginTop: UI_CONSTANTS.GAP.XS,
  },
  disabledBadge: {
    paddingHorizontal: UI_CONSTANTS.GAP.SM,
    paddingVertical: UI_CONSTANTS.GAP.XXS,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.XS,
  },
  disabledBadgeText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
});
