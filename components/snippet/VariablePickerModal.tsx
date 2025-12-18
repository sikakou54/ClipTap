import React, { useMemo } from 'react';
import { View, Modal, TouchableOpacity, Text, FlatList, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/themeSystem';
import { Ionicons } from '@expo/vector-icons';
import { useVariables } from '../../lib/hooks/useVariables';
import { SYSTEM_VARIABLES, VariableOption } from '../../lib/types/variable';
import { UI_CONSTANTS } from '../../lib/constants/ui';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (variableName: string) => void;
}

export function VariablePickerModal({ visible, onClose, onSelect }: Props) {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const { getEnabledCustomVariables, getStandardValue } = useVariables();

  const variables = useMemo(() => {
    // システム変数を変換
    const systemVars: VariableOption[] = SYSTEM_VARIABLES.map((v) => ({
      name: v.name,
      icon: v.icon,
      label: t(v.labelKey),
      description: t(v.descriptionKey),
      isSystem: true,
    }));

    // 有効なカスタム変数のみ取得（作成日時昇順でソート済み、無料版は上位5個のみ）
    const enabledCustomVars = getEnabledCustomVariables();

    // カスタム変数をVariableOption形式に変換
    const customVarOptions: VariableOption[] = enabledCustomVars.map((v) => ({
      name: v.name,
      icon: (v.icon as keyof typeof Ionicons.glyphMap) || 'code-outline',
      label: v.label || v.name,
      description: getStandardValue(v.name),
      isSystem: false,
    }));

    return [...systemVars, ...customVarOptions];
  }, [t, getEnabledCustomVariables]);

  const handleSelect = (variableName: string) => {
    onSelect(variableName);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text, fontSize: responsiveFontSizes.md, lineHeight: responsiveLineHeights.md }]}>{t('variables.select_variable')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* 変数リスト */}
          <FlatList
            data={variables}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.variableItem, { borderBottomColor: colors.border }]}
                onPress={() => handleSelect(item.name)}
              >
                <View style={[styles.variableIcon, { backgroundColor: colors.surface }]}>
                  <Ionicons name={item.icon} size={24} color={colors.primary} />
                </View>
                <View style={styles.variableInfo}>
                  <Text style={[styles.variableLabel, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>{item.label}</Text>
                  <Text style={[styles.variableDescription, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]} numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.SINGLE}>
                    {item.description}
                  </Text>
                  <Text style={[styles.variableCode, { color: colors.textSecondary, fontSize: responsiveFontSizes.xs, lineHeight: responsiveLineHeights.xs }]}>
                    {`{{${item.name}}}`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    
    fontWeight: 'bold',
  },
  variableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 16,
  },
  variableIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variableInfo: {
    flex: 1,
    gap: 4,
  },
  variableLabel: {
    
    fontWeight: '600',
  },
  variableDescription: {
    
  },
  variableCode: {
    
    fontFamily: 'monospace',
    marginTop: 2,
  },
});
