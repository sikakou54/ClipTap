/**
 * カスタム変数編集モーダル（expo-router modal）
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { RESERVED_VARIABLE_NAMES, MAX_VARIABLE_NAME_LENGTH } from '../../lib/constants/variables';
import { useVariables } from '../../lib/hooks/useVariables';
import { useProfiles } from '../../lib/hooks/useProfiles';
import { Variable } from '../../lib/types/variable';
import { Profile, ProfileVariable } from '../../lib/types/profile';
import { Header } from '../../components/common/Header';
import { commonStyles } from '../../lib/styles/commonStyles';
import { UI_CONSTANTS } from '../../lib/constants/ui';
import { showAlert, showConfirm } from '../../lib/utils/alerts';
import { Logger } from '../../lib/logger';

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

export default function VariableEditModal() {
  const { t } = useTranslation();
  const { colors, isTablet, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getAllCustomVariables, isVariableNameDuplicate, upsertVariableMetadata, upsertVariableValuesForProfiles, getStandardValue } = useVariables();
  const {
    profiles,
    getProfileWithVariables,
    defaultProfile
  } = useProfiles();

  const [name, setName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('code-outline');
  const [showIconModal, setShowIconModal] = useState(false);

  // 各プロファイルの値を管理
  const [profileValues, setProfileValues] = useState<Record<string, string>>({});

  // 編集対象の変数を取得
  const variableId = params.id as string | undefined;
  const isEdit = !!variableId;
  const customVariables = getAllCustomVariables();
  const editingVariable = customVariables.find((v: Variable) => v.id === variableId);

  useEffect(() => {
    if (editingVariable) {
      setName(editingVariable.name);
      setOriginalName(editingVariable.name);
      setLabel(editingVariable.label || '');

      // デフォルトプロファイルの値を標準値として設定
      setValue(getStandardValue(editingVariable.name));
      setSelectedIcon(editingVariable.icon || 'code-outline');

      // 各プロファイルの変数値を読み込む（有効な環境のみ）
      const values: Record<string, string> = {};
      profiles.forEach((profile: Profile) => {
        const profileWithVars = getProfileWithVariables(profile.id);
        const variable = profileWithVars?.variables.find((v: ProfileVariable) => v.variableId === editingVariable.id);
        values[profile.id] = variable?.value || '';
      });
      setProfileValues(values);
    } else {
      setName('');
      setOriginalName('');
      setLabel('');
      setValue('');
      setSelectedIcon('code-outline');

      // 新規作成時は空の値でプロファイルを初期化（有効な環境のみ）
      const values: Record<string, string> = {};
      profiles.forEach((profile: Profile) => {
        values[profile.id] = '';
      });
      setProfileValues(values);
    }
  }, [variableId, profiles.length, getStandardValue, getProfileWithVariables, profiles]);

  // 予約語チェック
  const isReservedName = () => {
    return RESERVED_VARIABLE_NAMES.includes(name.trim() as any);
  };

  // 重複チェック（編集時は自分自身を除く）
  const isDuplicateName = () => {
    if (!name.trim()) return false;
    if (editingVariable && name.trim() === originalName) return false;
    return isVariableNameDuplicate(name.trim(), editingVariable?.id);
  };

  // 変数名のバリデーション
  const isNameValid = () => {
    if (!name.trim()) return true;
    if (name.length > MAX_VARIABLE_NAME_LENGTH) return false;
    if (isReservedName()) return false;
    if (isDuplicateName()) return false;
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
    if (!name.trim()) return false;
    if (!label.trim()) return false; // 表示ラベル必須
    if (!isNameValid()) return false;
    if (isReservedName()) return false;
    // 標準値または少なくとも1つの環境に値が入力されている必要がある
    const hasStandardValue = value.trim() !== '';
    const hasProfileValue = Object.values(profileValues).some(val => val.trim() !== '');
    return hasStandardValue || hasProfileValue;
  };

  // 画面フォーカス時に変数値コールバックをチェックして処理
  useFocusEffect(
    useCallback(() => {
      // グローバルコールバックから値を取得（新規作成時用）
      if (global.variableValueCallbackData) {
        const { profileId, isStandard, newValue } = global.variableValueCallbackData;

        Logger.info('[VariableEdit] Received callback data:', { profileId, isStandard, newValue });

        if (isStandard === 'true' || isStandard === true) {
          Logger.info('[VariableEdit] Setting standard value:', newValue);
          setValue(newValue);
        } else {
          Logger.info('[VariableEdit] Setting profile value:', { profileId, newValue });
          setProfileValues(prev => {
            const updated = {
              ...prev,
              [profileId]: newValue
            };
            Logger.info('[VariableEdit] Updated profileValues:', updated);
            return updated;
          });
        }

        // コールバックデータをクリア
        global.variableValueCallbackData = undefined;
      }
    }, [setValue, setProfileValues, global.variableValueCallbackData])
  );

  // 値編集モーダルを開く（expo-routerでナビゲート）
  const openValueEditModal = (profile: Profile) => {
    // 変数名が未入力の場合は編集不可
    if (!name.trim()) {
      showAlert(t('error.generic'), t('variables.name_required'));
      return;
    }

    router.push({
      pathname: '/variable/profile-value-edit',
      params: {
        profileId: profile.id,
        variableName: name.trim(),
        profileName: profile.name,
        isStandard: profile.isDefault ? 'true' : 'false',
        currentValue: profile.isDefault ? value : (profileValues[profile.id] || ''),
      }
    });
  };

  // プロファイル値入力アイテムのレンダリング（横並び）
  const renderProfileValueItem = ({ item: profile, index }: { item: Profile; index: number }) => {
    // メイン環境の場合は標準値、それ以外は環境固有の値を表示
    const displayValue = profile.isDefault ? value : (profileValues[profile.id] || '');

    Logger.info('[VariableEdit] Rendering profile:', {
      profileId: profile.id,
      profileName: profile.name,
      isDefault: profile.isDefault,
      displayValue: displayValue,
      value: value,
      profileValuesForThisProfile: profileValues[profile.id],
      allProfileValues: profileValues
    });

    return (
      <View style={[
        styles.tableRow,
        {
          borderBottomColor: colors.border,
        }
      ]}>
        <View style={styles.tableCell}>
          <View style={styles.profileNameContainer}>
            <Text
              style={[styles.tableCellText, { color: colors.text, fontSize: responsiveFontSizes.sm }]}
              numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.SINGLE}
              ellipsizeMode="tail"
            >
              {profile.name}
            </Text>
            {profile.isDefault && (
              <View style={[styles.standardBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.standardBadgeText, { color: colors.primary, fontSize: responsiveFontSizes.xs }]}>
                  {t('profile.default_badge')}
                </Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.tableCell, styles.valueCell]}
          onPress={() => {
            openValueEditModal(profile);
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.valueText,
              {
                color: displayValue ? colors.text : colors.textSecondary,
                fontSize: responsiveFontSizes.sm,
              }
            ]}
            numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.DOUBLE}
          >
            {displayValue || t('variables.enter_value')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleSave = async () => {
    if (!canSave()) return;

    // 標準値が未設定の場合は警告を表示
    const standardValue = value.trim();
    if (!standardValue) {
      showConfirm(
        t('variables.standard_value_empty_warning'),
        () => performSave(),
        undefined,
        'warning'
      );
      return;
    }

    await performSave();
  };

  const performSave = async () => {
    try {
      if (!defaultProfile) {
        throw new Error('Default profile not found');
      }

      // 1. カスタム変数を作成または更新
      const savedVariable = await upsertVariableMetadata(
        isEdit && editingVariable ? editingVariable.id : undefined,
        name.trim(),
        label.trim() || undefined,
        selectedIcon
      );

      // 2. 全プロファイルの変数値を一括で作成/更新/削除
      const allProfileValues: Record<string, string> = {
        // 各プロファイルの個別値
        ...profileValues,
        // デフォルトプロファイルの標準値（最後に上書きして確実に設定）
        [defaultProfile.id]: value.trim(),
      };

      await upsertVariableValuesForProfiles(savedVariable.id, allProfileValues);

      router.back();
    } catch (error: any) {
      showAlert(t('error.generic'), error.message || 'Failed to save variable', undefined, 'error');
    }
  };

  const renderContent = () => (
    <>
      {/* 変数名 */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
          {t('settings.variable_name')} *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderWidth: !isNameValid() ? 2 : 0,
              borderColor: colors.error,
              fontSize: responsiveFontSizes.base,
              padding: isTablet ? 16 : 12,
            }
          ]}
          value={name}
          onChangeText={setName}
          placeholder={t('settings.variable_name_placeholder')}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          editable={true}
        />
        <Text style={[
          styles.hint,
          {
            color: !isNameValid() ? colors.error : colors.textSecondary,
            fontSize: responsiveFontSizes.xs,
          }
        ]}>
          {getNameErrorMessage() || t('settings.variable_name_hint')}
        </Text>
      </View>

      {/* 表示ラベルとアイコン */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
          {t('settings.variable_label')} *
        </Text>
        <View style={styles.labelWithIconRow}>
          <TouchableOpacity
            style={[
              styles.iconSelectButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                padding: isTablet ? 16 : 12,
              }
            ]}
            onPress={() => setShowIconModal(true)}
          >
            <Ionicons
              name={selectedIcon as any}
              size={isTablet ? 20 : 18}
              color={colors.primary}
            />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              styles.labelInput,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                fontSize: responsiveFontSizes.base,
                padding: isTablet ? 16 : 12,
              }
            ]}
            value={label}
            onChangeText={setLabel}
            placeholder={t('settings.variable_label_placeholder')}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <Text style={[styles.hint, { color: colors.textSecondary, fontSize: responsiveFontSizes.xs, lineHeight: responsiveLineHeights.xs }]}>
          {t('settings.variable_label_hint')}
        </Text>
      </View>

      {/* 環境ごとの値（標準を含む） */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
          {t('settings.variable_value')} *
        </Text>

        {(
          <>
            <View style={[styles.tableContainer, { borderColor: colors.border }]}>
              {/* テーブルヘッダー */}
              <View style={[styles.tableHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <View style={styles.tableCell}>
                  <Text style={[styles.tableHeaderText, { color: colors.text, fontSize: responsiveFontSizes.sm }]}>
                    {t('variables.environment_header')}
                  </Text>
                </View>
                <View style={[styles.tableCell, styles.valueCell]}>
                  <Text style={[styles.tableHeaderText, { color: colors.text, fontSize: responsiveFontSizes.sm }]}>
                    {t('variables.value_header')}
                  </Text>
                </View>
              </View>

              {/* テーブルボディ */}
              <FlatList
                data={profiles}
                renderItem={renderProfileValueItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                extraData={[value, profileValues]}
              />
            </View>

            {/* ヒントテキスト */}
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.hint, { color: colors.textSecondary, fontSize: responsiveFontSizes.xs, lineHeight: responsiveLineHeights.xs }]}>
                {t('variables.environment_values_hint_1')}
              </Text>
              <Text style={[styles.hint, { color: colors.textSecondary, fontSize: responsiveFontSizes.xs, lineHeight: responsiveLineHeights.xs }]}>
                {t('variables.environment_values_hint_2')}
              </Text>
            </View>
          </>
        )}
      </View>

    </>
  );

  // expo-routerのStackモーダルとして表示
  return (
    <SafeAreaView style={[commonStyles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
      <Header
        title={isEdit ? t('settings.variable_edit') : t('settings.variable_add')}
        isModal={true}
        rightAction={
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveButton}
            disabled={!canSave()}
          >
            <Text style={[
              styles.saveText,
              {
                color: canSave() ? colors.primary : colors.textSecondary,
                fontSize: responsiveFontSizes.base,
              }
            ]}>
              {t('common.save')}
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingHorizontal: isTablet ? 32 : 12 }}
        keyboardShouldPersistTaps="handled"
      >
        {renderContent()}
      </ScrollView>

      {/* アイコン選択モーダル */}
      <Modal
        visible={showIconModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowIconModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: responsiveFontSizes.lg }]}>
                {t('settings.variable_icon')}
              </Text>
              <TouchableOpacity onPress={() => setShowIconModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.iconGrid}>
                {AVAILABLE_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconButton,
                      {
                        backgroundColor: selectedIcon === icon ? colors.primary : colors.surface,
                        borderColor: colors.border,
                        width: isTablet ? 64 : 56,
                        height: isTablet ? 64 : 56,
                      }
                    ]}
                    onPress={() => {
                      setSelectedIcon(icon);
                      setShowIconModal(false);
                    }}
                  >
                    <Ionicons
                      name={icon}
                      size={isTablet ? 28 : 24}
                      color={selectedIcon === icon ? '#fff' : colors.text}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  saveButton: {
    padding: UI_CONSTANTS.GAP.XS,
  },
  saveText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  content: {
    flex: 1,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
    marginBottom: UI_CONSTANTS.GAP.MD,
  },
  labelWithIconRow: {
    flexDirection: 'row',
    gap: UI_CONSTANTS.GAP.BASE,
    alignItems: 'center',
  },
  iconSelectButton: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 1,
  },
  labelInput: {
    flex: 1,
  },
  input: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
  },
  textArea: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    textAlignVertical: 'top',
  },
  hint: {
    marginTop: UI_CONSTANTS.GAP.XS,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: UI_CONSTANTS.GAP.BASE,
    padding: 16,
  },
  iconButton: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.LG,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyProfilesContainer: {
    padding: 16,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    alignItems: 'center',
  },
  emptyProfilesText: {
    textAlign: 'center',
  },
  tableContainer: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: UI_CONSTANTS.BORDER_WIDTH.THICK,
  },
  tableHeaderText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    minHeight: 60,
  },
  tableCell: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: UI_CONSTANTS.GAP.MD,
  },
  valueCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: UI_CONSTANTS.GAP.MD,
    paddingRight: 0,
  },
  tableCellText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
    flexShrink: 1,
  },
  profileNameContainer: {
    flexDirection: 'column',
    gap: UI_CONSTANTS.GAP.XS,
    width: '100%',
  },
  standardBadge: {
    paddingHorizontal: UI_CONSTANTS.GAP.SM,
    paddingVertical: UI_CONSTANTS.GAP.XXS,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
    alignSelf: 'flex-start',
  },
  standardBadgeText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  valueText: {
    flex: 1,
    textAlign: 'left',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: UI_CONSTANTS.BORDER_RADIUS.XXL,
    borderTopRightRadius: UI_CONSTANTS.BORDER_RADIUS.XXL,
    minHeight: '60%',
    maxHeight: '80%',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
  },
  modalTitle: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  modalCloseButton: {
    padding: UI_CONSTANTS.GAP.XS,
  },
  modalScrollView: {
    flex: 1,
  },
});
