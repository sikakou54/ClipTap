/**
 * 変数選択モーダルコンポーネント
 *
 * 変数を一覧から選択するためのボトムシートモーダル。
 * システム変数とカスタム変数を表示し、タップで選択。
 *
 * 主な機能:
 * - システム変数リスト表示（date, time, datetime等）
 * - カスタム変数リスト表示
 * - 変数の説明と構文を表示
 * - FlashListによる仮想化リスト
 *
 * @see VariableToolbar - 簡易版の変数挿入UI
 */

import React from 'react';
import { View, Modal, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from '@cliptap/shared';
import { FlashList } from '@mobile-types/flashlist';
import { useTheme } from '@lib/themeSystem';
import { Ionicons } from '@expo/vector-icons';
import { UI_CONSTANTS } from '@constants/ui';
import { useVariablePickerModal } from '@hooks/components/useVariablePickerModal';

/* ========================================
   Props定義
   ======================================== */

/**
 * VariablePickerModalのProps
 * @property visible - モーダル表示状態
 * @property onClose - 閉じるボタン押下時のコールバック
 * @property onSelect - 変数選択時のコールバック（変数名を受け取る）
 */
interface VariablePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (variableName: string) => void;
}

export function VariablePickerModal({ visible, onClose, onSelect }: VariablePickerModalProps) {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();

  /* フックからロジックを取得 */
  const { variables, handleSelect } = useVariablePickerModal({ onClose, onSelect });

  /* 変数選択モーダル（ボトムシート形式） */
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {/* オーバーレイ */}
      <View style={styles.modalOverlay}>
        {/* モーダルコンテンツ */}
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* ヘッダー（タイトルと閉じるボタン） */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text, fontSize: responsiveFontSizes.md, lineHeight: responsiveLineHeights.md }]}>{t('variables.select_variable')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* FlashListで仮想化（大量の変数でも高速） */}
          <FlashList
            data={variables}
            keyExtractor={(item) => item.name}
            estimatedItemSize={100}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.variableItem, { borderBottomColor: colors.border }]}
                onPress={() => handleSelect(item.name)}
              >
                {/* 変数アイコン */}
                <View style={[styles.variableIcon, { backgroundColor: colors.surface }]}>
                  <Ionicons name={item.icon} size={24} color={colors.primary} />
                </View>
                <View style={styles.variableInfo}>
                  {/* 変数ラベル */}
                  <Text style={[styles.variableLabel, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>{item.label}</Text>
                  {/* 変数説明 */}
                  <Text style={[styles.variableDescription, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]} numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.SINGLE}>
                    {item.description}
                  </Text>
                  {/* 変数コード（{{変数名}}） */}
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
