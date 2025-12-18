import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { useSubscription } from '../../lib/hooks/useSubscription';
import { useVariables } from '../../lib/hooks/useVariables';
import { useProfiles } from '../../lib/hooks/useProfiles';
import { Variable } from '../../lib/types/variable';
import { Profile } from '../../lib/types/profile';
import { Header } from '../../components/common/Header';
import { commonStyles, listStyles } from '../../lib/styles/commonStyles';
import { UI_CONSTANTS } from '../../lib/constants/ui';
import { showConfirm } from '../../lib/utils/alerts';

export default function VariablesScreen() {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const router = useRouter();
  const { isSubscribed, canAddCustomVariable } = useSubscription();
  const {
    getAllCustomVariablesIncludingInvalid,
    deleteVariable: deleteVar,
    getStandardValue,
  } = useVariables();
  const { profiles, getProfileVariablesMap } = useProfiles();

  const [variables, setVariables] = useState<Variable[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    profiles.length > 0 ? profiles[0].id : null
  );

  // カスタム変数一覧を読み込み（無効なものも含む）
  const loadVariables = () => {
    const customVars = getAllCustomVariablesIncludingInvalid();
    setVariables(customVars);
  };

  // 変数が有効かどうかを判定（validフラグで判定）
  const isVariableEnabled = (variable: Variable): boolean => {
    return variable.valid;
  };

  // 画面にフォーカスが当たった時に変数一覧を再読み込み
  useFocusEffect(
    useCallback(() => {
      loadVariables();
    }, [])
  );

  // 変数削除
  const handleDelete = (variable: Variable) => {
    showConfirm(
      t('settings.delete_variable_confirm', { name: variable.name }),
      () => {
        deleteVar(variable.id);
        loadVariables();
      },
      undefined,
      'danger'
    );
  };

  // 変数編集
  const handleEdit = (variable: Variable, enabled: boolean) => {
    if (!enabled) {
      // 無効な変数をタップした場合はPaywallに誘導
      showConfirm(
        t('settings.variable_disabled_message'),
        () => router.push('/subscription/paywall'),
        undefined,
        'warning'
      );
      return;
    }

    // expo-routerで編集画面に遷移
    router.push({
      pathname: '/variable/edit',
      params: { id: variable.id },
    });
  };

  // 新規追加
  const handleAdd = () => {
    // 5つ制限チェック（無料版）
    if (!canAddCustomVariable(variables.length)) {
      showConfirm(
        t('settings.variable_limit_message', { limit: 5 }),
        () => router.push('/subscription/paywall'),
        undefined,
        'warning'
      );
      return;
    }

    // expo-routerで新規作成画面に遷移
    router.push('/variable/edit');
  };

  // 変数の値を取得（環境に応じて標準値または環境固有の値）
  const getVariableValue = (variable: Variable): string => {
    if (!selectedProfileId) {
      // 環境が選択されていない場合はデフォルトプロファイルの値を取得
      return getStandardValue(variable.name) || t('common.not_set');
    }

    // 環境が選択されている場合
    const profileVariablesMap = getProfileVariablesMap(selectedProfileId);
    const profileValue = profileVariablesMap[variable.name];

    // 環境固有の値があればそれを返す
    if (profileValue) {
      return profileValue;
    }

    // 環境固有の値がなければデフォルトプロファイルの値を返す
    const standardValue = getStandardValue(variable.name);
    if (standardValue) {
      return standardValue;
    }

    // 標準値も環境固有の値もない場合は「未設定」
    return t('common.not_set');
  };

  return (
    <View style={[commonStyles.container, { backgroundColor: colors.background }]}>
      <Header
        title={t('settings.variables')}
        backIcon="arrow-back"
        rightAction={
          <TouchableOpacity onPress={handleAdd} style={commonStyles.addButton}>
            <Ionicons name="add" size={28} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {variables.length === 0 ? (
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
          {/* 環境フィルター（有効な環境のみ） */}
          {profiles.length > 0 && (
            <View style={[styles.filterSection, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterContent}
              >
                {profiles.map((profile: Profile) => {
                  const isSelected = selectedProfileId === profile.id;
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

          <ScrollView style={[styles.content, { backgroundColor: colors.surface }]}>
            <View style={styles.variableList}>
              {variables.map((variable, index) => {
                const enabled = isVariableEnabled(variable);
                const value = getVariableValue(variable);

                return (
                  <React.Fragment key={variable.id}>
                    <TouchableOpacity
                      onPress={() => handleEdit(variable, enabled)}
                      activeOpacity={0.7}
                      style={[
                        listStyles.listItem,
                        {
                          opacity: enabled ? 1 : 0.5,
                        },
                      ]}
                    >
                      <View style={styles.variableContent}>
                        <View style={styles.variableIcon}>
                          <Ionicons
                            name={(variable.icon || 'code-outline') as any}
                            size={24}
                            color={enabled ? colors.primary : colors.textSecondary}
                          />
                        </View>
                        <View style={styles.variableInfo}>
                          <View style={styles.variableMain}>
                            <Text style={[styles.variableName, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                              {variable.label || variable.name}
                            </Text>
                            {!enabled && (
                              <View style={[styles.disabledBadge, { backgroundColor: colors.error + '20' }]}>
                                <Text style={[styles.disabledBadgeText, { color: colors.error, fontSize: responsiveFontSizes.xs, lineHeight: responsiveLineHeights.xs }]}>
                                  {t('settings.variable_disabled')}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.variableKey, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]} numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.SINGLE}>
                            {`{{${variable.name}}}`}
                          </Text>
                          {/* 値の表示 */}
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
