import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/themeSystem';
import { useSnippets } from '../../lib/hooks/useSnippets';
import { useProfiles } from '../../lib/hooks/useProfiles';
import { useVariables } from '../../lib/hooks/useVariables';
import { Profile } from '../../lib/types/profile';
import { VariableParser, CustomVariableResolver } from '../../lib/services/VariableParser';
import { Logger } from '../../lib/logger';
import { UI_CONSTANTS } from '../../lib/constants/ui';
import { showSuccess } from '../../lib/utils/alerts';

interface Props {
  title: string;
  content: string;
  selectedProfileIds?: string[];  // 選択中の環境ID
  copyWithTitle?: boolean;  // タイトルもコピーするか
}

export function VariablePreview({ title, content, selectedProfileIds = [], copyWithTitle = false }: Props) {
  const { t } = useTranslation();
  const { profiles } = useProfiles();
  const { createCustomVariableResolver } = useVariables();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();

  // コピー機能
  const handleCopy = async () => {
    try {
      let textToCopy: string;
      if (copyWithTitle && previewTitle) {
        textToCopy = `${previewTitle}\n${preview}`;
      } else {
        textToCopy = preview;
      }

      await Clipboard.setStringAsync(textToCopy);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsCopied(true);
      showSuccess(t('snippet.copied'));

      // 2秒後にアイコンを元に戻す
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      Logger.error('Failed to copy preview:', error);
    }
  };

  // フィルタリングされた環境リスト（選択中の環境のみ、または環境が選択されていない場合は有効な環境のみ）
  const filteredProfiles = selectedProfileIds.length > 0
    ? profiles.filter((p: Profile) => selectedProfileIds.includes(p.id))
    : profiles;

  // 最初の環境を初期値として設定
  useEffect(() => {
    if (selectedProfileId === null && filteredProfiles.length > 0) {
      setSelectedProfileId(filteredProfiles[0].id);
    }
  }, [selectedProfileId, filteredProfiles]);

  // 特定の環境用のカスタムリゾルバを作成（共通ロジックを使用）
  const createProfileResolver = (profileId: string | null): CustomVariableResolver => {
    Logger.debug(`[VariablePreview] Creating resolver for profile: ${profileId || 'null'}`);
    return createCustomVariableResolver(profileId || undefined);
  };

  useEffect(() => {
    let isMounted = true;

    const generatePreview = async () => {
      setLoading(true);
      try {
        Logger.debug(`[VariablePreview] Generating preview for profile: ${selectedProfileId || 'null'}`);
        Logger.debug(`[VariablePreview] Title: ${title}`);
        Logger.debug(`[VariablePreview] Content: ${content}`);

        const customResolver = createProfileResolver(selectedProfileId);

        const titleHasVars = VariableParser.hasVariables(title);
        const contentHasVars = VariableParser.hasVariables(content);

        Logger.debug(`[VariablePreview] Title has variables: ${titleHasVars}`);
        Logger.debug(`[VariablePreview] Content has variables: ${contentHasVars}`);

        // タイトルの変数を置換
        const resolvedTitle = titleHasVars
          ? await VariableParser.replaceVariables(title, customResolver)
          : title;

        // コンテンツの変数を置換
        const resolvedContent = contentHasVars
          ? await VariableParser.replaceVariables(content, customResolver)
          : content;

        Logger.debug(`[VariablePreview] Resolved title: ${resolvedTitle}`);
        Logger.debug(`[VariablePreview] Resolved content: ${resolvedContent}`);

        if (isMounted) {
          setPreviewTitle(resolvedTitle);
          setPreview(resolvedContent);
        }
      } catch (error) {
        Logger.error('Failed to generate preview:', error);
        if (isMounted) {
          setPreviewTitle(title);
          setPreview(content);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    generatePreview();

    return () => {
      isMounted = false;
    };
  }, [title, content, selectedProfileId]);

  return (
    <View style={[styles.previewBox, { backgroundColor: colors.card, borderColor: colors.primary }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[styles.label, { color: colors.primary, fontSize: responsiveFontSizes.xs, lineHeight: responsiveLineHeights.xs }]}>
            {t('common.preview')}
          </Text>
          <TouchableOpacity
            onPress={handleCopy}
            style={styles.copyButton}
            disabled={loading || !preview}
          >
            <Ionicons
              name={isCopied ? "checkmark-circle" : "copy-outline"}
              size={18}
              color={isCopied ? "#34C759" : colors.primary}
            />
            <Text style={[
              styles.copyButtonText,
              {
                color: isCopied ? "#34C759" : colors.primary,
                fontSize: responsiveFontSizes.sm,
              }
            ]}>
              {t('common.copy')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 環境選択ドロップダウン（選択中の環境のみ表示） */}
        {filteredProfiles.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.profileSelector}
            contentContainerStyle={styles.profileSelectorContent}
          >
            {filteredProfiles.map((profile: Profile) => {
              const isSelected = selectedProfileId === profile.id;
              return (
                <TouchableOpacity
                  key={profile.id}
                  style={[
                    styles.profileChip,
                    { borderColor: isSelected ? colors.primary : colors.border },
                    isSelected && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setSelectedProfileId(profile.id)}
                >
                  <Text style={[
                    styles.profileChipText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      fontSize: responsiveFontSizes.xs
                    }
                  ]}>
                    {profile.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      ) : (
        <View>
          {previewTitle && <Text style={[styles.previewTitle, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>{previewTitle}</Text>}
          <Text style={[styles.preview, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>{preview}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  previewBox: {
    padding: UI_CONSTANTS.GAP.BASE,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THICK,
    marginBottom: 16,
  },
  header: {
    marginBottom: UI_CONSTANTS.GAP.BASE,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.GAP.MD,
  },
  label: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.BOLD,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.GAP.XS,
    padding: UI_CONSTANTS.GAP.XS,
  },
  copyButtonText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
  },
  profileSelector: {
    marginTop: UI_CONSTANTS.GAP.MD,
    marginBottom: UI_CONSTANTS.GAP.MD,
  },
  profileSelectorContent: {
    gap: UI_CONSTANTS.GAP.MD,
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UI_CONSTANTS.GAP.BASE,
    paddingVertical: UI_CONSTANTS.GAP.SM,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.XL,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    gap: UI_CONSTANTS.GAP.XS,
  },
  profileChipIcon: {
    fontSize: 14,
  },
  profileChipText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  previewTitle: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.BOLD,
    marginBottom: UI_CONSTANTS.GAP.MD,
  },
  preview: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
  },
  loader: {
    marginVertical: UI_CONSTANTS.GAP.MD,
  },
});
