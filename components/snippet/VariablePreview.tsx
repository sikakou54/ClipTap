/**
 * 変数プレビューコンポーネント
 *
 * スニペット内の変数（{{変数名}}）を解決し、実際の値に置換した
 * プレビューを表示するコンポーネント。
 *
 * 主な機能:
 * - 変数の自動解決（システム変数 + カスタム変数）
 * - プロファイル切り替えによるプレビュー変更
 * - プレビューのコピー機能
 * - タイトル付きコピー対応
 *
 * 使用場所:
 * - スニペット作成・編集画面のプレビュー表示
 *
 * @see VariableParser - 変数解決ロジック
 * @see SnippetFormScreen - 親コンポーネント
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from '@cliptap/shared';
import { Ionicons } from '@expo/vector-icons';
import { VariableService, type VariableResolver, useProfiles, useVariables } from '@cliptap/shared';
import { useTheme } from '@lib/themeSystem';
import { Profile } from '@cliptap/shared';
import { copyToClipboard } from '@utils/clipboard';
import i18next from '@i18n/config';
import { Logger } from '@cliptap/shared';
import { UI_CONSTANTS } from '@constants/ui';

/* ========================================
   Props定義
   ======================================== */

/**
 * VariablePreviewのProps
 * @property title - スニペットタイトル
 * @property content - スニペットコンテンツ
 * @property selectedProfileIds - 選択中のプロファイルID配列
 * @property copyWithTitle - タイトル付きでコピーするか
 */
interface VariablePreviewProps {
  title: string;
  content: string;
  selectedProfileIds?: string[];
  copyWithTitle?: boolean;
}

export function VariablePreview({ title, content, selectedProfileIds = [], copyWithTitle = false }: VariablePreviewProps) {
  const { t } = useTranslation();
  const { profiles, profileVariables, defaultProfile } = useProfiles();
  const { variables } = useVariables();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  /**
   * プレビューをクリップボードにコピー
   * タイトル付きコピーが有効な場合は「タイトル\nコンテンツ」形式でコピー
   */
  const handleCopy = useCallback(async () => {
    try {
      const textToCopy = copyWithTitle && previewTitle
        ? `${previewTitle}\n${preview}`
        : preview;

      await copyToClipboard(textToCopy);
      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      Logger.error('Failed to copy preview:', error);
    }
  }, [copyWithTitle, previewTitle, preview]);

  const handleSelectProfile = useCallback((profileId: string) => {
    setSelectedProfileId(profileId);
  }, []);

  /**
   * フィルタリングされたプロファイルリスト
   * 選択中のプロファイルがある場合はそれのみ、ない場合は全プロファイルを表示
   */
  const filteredProfiles = useMemo(() =>
    selectedProfileIds.length > 0
      ? profiles.filter((p: Profile) => selectedProfileIds.includes(p.id))
      : profiles,
    [profiles, selectedProfileIds]
  );

  useEffect(() => {
    if (selectedProfileId === null && filteredProfiles.length > 0) {
      setSelectedProfileId(filteredProfiles[0].id);
    }
  }, [selectedProfileId, filteredProfiles]);

  /**
   * profileIdに対応する変数マップを構築
   */
  const buildProfileVariablesMap = useCallback(
    (profileId: string | null): Record<string, string> => {
      if (!profileId) return {};
      const map: Record<string, string> = {};
      for (const pv of profileVariables) {
        if (pv.profileId === profileId) {
          const variable = variables.find((v) => v.id === pv.variableId);
          if (variable) {
            map[variable.name] = pv.value;
          }
        }
      }
      return map;
    },
    [profileVariables, variables]
  );

  /**
   * 特定のプロファイル用のカスタム変数リゾルバを作成
   * プレビューでは全変数を展開（isSubscribed: true固定）
   */
  const createProfileResolver = useCallback(
    (profileId: string | null): VariableResolver => {
      Logger.debug(`[VariablePreview] Creating resolver for profile: ${profileId || 'null'}`);
      const profileVariablesMap = buildProfileVariablesMap(profileId);
      const defaultProfileVariablesMap = buildProfileVariablesMap(defaultProfile?.id || null);
      return VariableService.createCustomVariableResolver({
        isSubscribed: true,
        profileVariablesMap,
        defaultProfileVariablesMap,
      });
    },
    [buildProfileVariablesMap, defaultProfile]
  );

  /**
   * プレビュー生成の副作用
   * タイトル、コンテンツ、プロファイルが変更されたときに再生成
   */
  useEffect(() => {
    let isMounted = true;

    const generatePreview = async () => {
      setLoading(true);
      try {
        Logger.debug(`[VariablePreview] Generating preview for profile: ${selectedProfileId || 'null'}`);
        Logger.debug(`[VariablePreview] Title: ${title}`);
        Logger.debug(`[VariablePreview] Content: ${content}`);

        const customResolver = createProfileResolver(selectedProfileId);
        const locale = i18next.language || 'en';

        const result = await VariableService.resolvePreviewText(title, content, {
          locale,
          customResolver,
          preserveUnknown: true,
        });

        Logger.debug(`[VariablePreview] Resolved title: ${result.title}`);
        Logger.debug(`[VariablePreview] Resolved content: ${result.content}`);

        if (isMounted) {
          setPreviewTitle(result.title);
          setPreview(result.content);
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

    generatePreview().catch((error) => Logger.error('Generate preview failed:', error));

    return () => {
      isMounted = false;
    };
  }, [title, content, selectedProfileId]);

  /* 変数プレビューボックス */
  return (
    <View style={[styles.previewBox, { backgroundColor: colors.card, borderColor: colors.primary }]}>
      {/* ヘッダー（ラベルとコピーボタン） */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {/* プレビューラベル */}
          <Text style={[styles.label, { color: colors.primary, fontSize: responsiveFontSizes.xs, lineHeight: responsiveLineHeights.xs }]}>
            {t('common.preview')}
          </Text>
          {/* コピーボタン */}
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

        {/* プロファイル選択（選択中のプロファイルのみ表示） */}
        {filteredProfiles.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.profileSelector}
            contentContainerStyle={styles.profileSelectorContent}
          >
            {filteredProfiles.map((profile: Profile) => {
              const isSelected = selectedProfileId === profile.id;
              /* プロファイルチップ */
              return (
                <TouchableOpacity
                  key={profile.id}
                  style={[
                    styles.profileChip,
                    { borderColor: isSelected ? colors.primary : colors.border },
                    isSelected && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => handleSelectProfile(profile.id)}
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

      {/* プレビューコンテンツ（ローディング中はスピナー表示） */}
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      ) : (
        <View>
          {/* プレビュータイトル（タイトル付きコピーが有効な場合） */}
          {copyWithTitle && previewTitle && <Text style={[styles.previewTitle, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>{previewTitle}</Text>}
          {/* プレビューコンテンツ（変数解決済み） */}
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
