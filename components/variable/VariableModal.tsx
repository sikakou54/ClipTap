import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { Variable } from '../../lib/types/variable';
import { RESERVED_VARIABLE_NAMES, MAX_VARIABLE_NAME_LENGTH } from '../../lib/constants/variables';
import { useVariables } from '../../lib/hooks/useVariables';
import { UI_CONSTANTS } from '../../lib/constants/ui';

// 利用可能なアイコン（カテゴリ別に整理）
const AVAILABLE_ICONS = [
  // 人物・連絡先
  'person-outline',
  'people-outline',
  'person-circle-outline',
  'mail-outline',
  'call-outline',
  'chatbubble-outline',
  'at-outline',

  // 場所・施設
  'home-outline',
  'business-outline',
  'location-outline',
  'map-outline',
  'navigate-outline',
  'globe-outline',

  // ドキュメント・テキスト
  'document-outline',
  'document-text-outline',
  'documents-outline',
  'newspaper-outline',
  'reader-outline',
  'text-outline',
  'create-outline',
  'pencil-outline',

  // ビジネス・金融
  'card-outline',
  'wallet-outline',
  'cash-outline',
  'calculator-outline',
  'briefcase-outline',
  'receipt-outline',

  // 技術・開発
  'code-outline',
  'code-slash-outline',
  'terminal-outline',
  'bug-outline',
  'construct-outline',
  'hammer-outline',

  // メディア・エンターテインメント
  'musical-notes-outline',
  'headset-outline',
  'image-outline',
  'camera-outline',
  'film-outline',
  'videocam-outline',

  // 時間・スケジュール
  'time-outline',
  'calendar-outline',
  'alarm-outline',
  'stopwatch-outline',
  'hourglass-outline',

  // アクション・状態
  'heart-outline',
  'heart-circle-outline',
  'star-outline',
  'bookmark-outline',
  'flag-outline',
  'trophy-outline',
  'ribbon-outline',

  // オブジェクト
  'gift-outline',
  'basket-outline',
  'cart-outline',
  'bag-outline',
  'pizza-outline',
  'cafe-outline',
  'restaurant-outline',

  // 移動・交通
  'car-outline',
  'bicycle-outline',
  'airplane-outline',
  'train-outline',
  'boat-outline',

  // ツール・設定
  'settings-outline',
  'cog-outline',
  'options-outline',
  'build-outline',
  'flash-outline',
  'key-outline',
  'lock-closed-outline',

  // 天気・自然
  'sunny-outline',
  'moon-outline',
  'cloud-outline',
  'rainy-outline',
  'leaf-outline',
  'flower-outline',

  // その他
  'link-outline',
  'infinite-outline',
  'funnel-outline',
  'analytics-outline',
  'stats-chart-outline',
  'pie-chart-outline',
  'barcode-outline',
  'qr-code-outline',
] as const;

interface Props {
  visible: boolean;
  editingVariable: Variable | null;
  onSave: (name: string, value: string, label: string, icon: string) => void;
  onClose: () => void;
}

export function VariableModal({ visible, editingVariable, onSave, onClose }: Props) {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const { isVariableNameDuplicate, getStandardValue } = useVariables();

  const [name, setName] = useState('');
  const [originalName, setOriginalName] = useState(''); // 編集時の元の変数名を保持
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('code-outline');

  useEffect(() => {
    if (editingVariable) {
      setName(editingVariable.name);
      setOriginalName(editingVariable.name);
      setLabel(editingVariable.label || '');
      setValue(getStandardValue(editingVariable.name));
      setSelectedIcon(editingVariable.icon || 'code-outline');
    } else {
      setName('');
      setOriginalName('');
      setLabel('');
      setValue('');
      setSelectedIcon('code-outline');
    }
  }, [editingVariable, visible]);

  // 予約語チェック
  const isReservedName = () => {
    return RESERVED_VARIABLE_NAMES.includes(name.trim() as any);
  };

  // 重複チェック（編集時は自分自身を除く）
  const isDuplicateName = () => {
    if (!name.trim()) return false;
    // 編集時で変数名が変わっていない場合は重複ではない
    if (editingVariable && name.trim() === originalName) return false;
    // 重複チェック
    return isVariableNameDuplicate(name.trim(), editingVariable?.id);
  };

  // 変数名のバリデーション
  const isNameValid = () => {
    if (!name.trim()) return true; // 空の場合はエラー表示しない
    if (name.length > MAX_VARIABLE_NAME_LENGTH) return false; // 長さチェック
    if (isReservedName()) return false; // 予約語はNG
    if (isDuplicateName()) return false; // 重複はNG
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  };

  // エラーメッセージを取得
  const getNameErrorMessage = () => {
    if (!name.trim()) return '';
    if (name.length > MAX_VARIABLE_NAME_LENGTH) {
      return t('error.variable_name_too_long', { max: MAX_VARIABLE_NAME_LENGTH });
    }
    if (isReservedName()) {
      return t('error.variable_name_reserved', { name });
    }
    if (isDuplicateName()) {
      return t('error.variable_name_exists', { name });
    }
    if (!isNameValid()) {
      return t('error.variable_name_invalid');
    }
    return '';
  };

  // 保存ボタンの有効/無効を判定
  const canSave = () => {
    if (!name.trim() || !value.trim()) return false;
    // 変数名のバリデーション（英数字とアンダースコアのみ）
    if (!isNameValid()) return false;
    // 予約語チェック
    if (isReservedName()) return false;
    return true;
  };

  const handleSave = () => {
    if (!canSave()) return;

    onSave(name.trim(), value.trim(), label.trim(), selectedIcon);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* ヘッダー */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
            {editingVariable ? t('settings.variable_edit') : t('settings.variable_add')}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveButton}
            disabled={!canSave()}
          >
            <Text style={[styles.saveText, { color: canSave() ? colors.primary : colors.textSecondary, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
              {t('common.save')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* 変数名 */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>{t('settings.variable_name')} *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderWidth: !isNameValid() ? 2 : 0,
                  borderColor: colors.error,
                }
              ]}
              value={name}
              onChangeText={setName}
              placeholder={t('settings.variable_name_placeholder')}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              editable={true} // 編集時も変数名変更可能
            />
            <Text style={[styles.hint, { color: !isNameValid() ? colors.error : colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
              {getNameErrorMessage() || t('settings.variable_name_hint')}
            </Text>
          </View>

          {/* 表示ラベル */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>{t('settings.variable_label')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
              value={label}
              onChangeText={setLabel}
              placeholder={t('settings.variable_label_placeholder')}
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={[styles.hint, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
              {t('settings.variable_label_hint')}
            </Text>
          </View>

          {/* 値 */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>{t('settings.variable_value')} *</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text }]}
              value={value}
              onChangeText={setValue}
              placeholder={t('settings.variable_value_placeholder')}
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.DESCRIPTION}
            />
            <Text style={[styles.hint, { color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
              {t('settings.variable_value_hint')}
            </Text>
          </View>

          {/* アイコン選択 */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>{t('settings.variable_icon')}</Text>
            <View style={styles.iconGrid}>
              {AVAILABLE_ICONS.map((icon) => (
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

          {/* プレビュー */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>{t('settings.variable_preview')}</Text>
            <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.previewContent}>
                <Ionicons name={selectedIcon as any} size={16} color={colors.primary} />
                <Text style={[styles.previewLabel, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                  {label || name || t('settings.variable_name')}
                </Text>
              </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    
    fontWeight: '600',
  },
  saveButton: {
    padding: 4,
  },
  saveText: {
    
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 10,
    padding: 12,
    
  },
  textArea: {
    borderRadius: 10,
    padding: 12,
    
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: {
    
    marginTop: 4,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    gap: 4,
    alignItems: 'center',
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewLabel: {
    
    fontWeight: '600',
  },
  previewVariable: {
    
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});
