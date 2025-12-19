import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/themeSystem';
import { Ionicons } from '@expo/vector-icons';
import { useVariables } from '../../lib/hooks/useVariables';
import { SYSTEM_VARIABLES, VariableOption } from '../../lib/types/variable';
import { Logger } from '../../lib/logger';

interface Props {
  onInsert: (variableName: string) => void;
  onShowMore?: () => void;
}

export function VariableToolbar({ onInsert }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { getEnabledCustomVariables, getStandardValue } = useVariables();
  const [allVariables, setAllVariables] = useState<VariableOption[]>([]);

  // カスタム変数を読み込み
  useEffect(() => {
    loadCustomVariables();

    // 10秒ごとにリフレッシュ（変数追加・編集・削除を反映）
    const interval = setInterval(() => {
      loadCustomVariables();
    }, 10000);

    return () => clearInterval(interval);
  }, [t]);

  const loadCustomVariables = () => {
    try {
      // システム変数を変換
      const systemVariables: VariableOption[] = SYSTEM_VARIABLES.map((v) => ({
        name: v.name,
        icon: v.icon,
        label: t(v.labelKey),
        description: t(v.descriptionKey),
        isSystem: true,
      }));

      // 有効なカスタム変数のみ取得（作成日時昇順でソート済み、無料版は上位5個のみ）
      const enabledCustomVars = getEnabledCustomVariables();

      // カスタム変数をVariableOption形式に変換
      const customOptions: VariableOption[] = enabledCustomVars.map((v) => ({
        name: v.name,
        icon: (v.icon || 'code-outline') as keyof typeof Ionicons.glyphMap,
        label: v.label || v.name,
        description: getStandardValue(v.name),
        isSystem: false,
      }));

      setAllVariables([...systemVariables, ...customOptions]);
    } catch (error) {
      Logger.error('Failed to load custom variables:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {allVariables.map((variable) => (
          <VariableButton
            key={variable.name}
            variable={variable}
            onPress={() => onInsert(variable.name)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface VariableButtonProps {
  variable: VariableOption;
  onPress: () => void;
}

function VariableButton({ variable, onPress }: VariableButtonProps) {
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.buttonContent}>
        <Ionicons name={variable.icon} size={16} color={colors.primary} />
        <Text style={[styles.buttonLabel, { color: colors.text, fontSize: responsiveFontSizes.xs, lineHeight: responsiveLineHeights.xs }]}>
          {variable.label}
        </Text>
      </View>
      <Text style={[styles.buttonVariable, { color: colors.textSecondary, fontSize: responsiveFontSizes.xs - 2, lineHeight: Math.round((responsiveFontSizes.xs - 2) * 1.5) }]}>
        {`{{${variable.name}}}`}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 6,
    paddingBottom: 6,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 0,
    gap: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    gap: 4,
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonLabel: {
    fontWeight: '600',
  },
  buttonVariable: {
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});
