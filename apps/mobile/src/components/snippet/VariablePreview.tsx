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

import { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from '@cliptap/shared';
import { Ionicons } from '@expo/vector-icons';
import { VariableService, type VariableResolver, useProfiles, useVariables, FREE_VARIABLES_LIMIT, joinSnippetTextForClipboard, useSharedSubscription } from '@cliptap/shared';
import { useTheme } from '@lib/themeSystem';
import { Profile } from '@cliptap/shared';
import { copyToClipboard } from '@utils/clipboard';
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
  const { t, language } = useTranslation();
  /* プレビュー候補は有効なプロファイルだけとする（Web版と同一の扱い） */
  const { validProfiles: profiles, profileVariables, defaultProfile } = useProfiles();
  const { variables } = useVariables();
  const { isSubscribed } = useSharedSubscription();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  /**
   * クリップボードへ渡す展開済みテキスト
   *
   * @remarks
   * 連結規則は共有の joinSnippetTextForClipboard を唯一の正本とする。
   * 一覧のコピーも同じ関数を通るため、同じ定型文ならプレビューからコピーしても
   * 一覧からコピーしても同じ文字列になる。
   */
  const copyText = useMemo(
    () => joinSnippetTextForClipboard({ title: previewTitle, content: preview, copyWithTitle }),
    [copyWithTitle, previewTitle, preview]
  );

  /**
   * プレビューをクリップボードにコピー
   */
  const handleCopy = useCallback(async () => {
    /* コピー対象が無いときはクリップボードAPIを呼ばない */
    if (!copyText) return;

    try {
      await copyToClipboard(copyText);
      setIsCopied(true);
    } catch (error) {
      Logger.error('Failed to copy preview:', error);
    }
  }, [copyText]);

  /**
   * コピー完了アイコンの自動リセット
   *
   * @remarks
   * コピー完了アイコンは UI_CONSTANTS.COPY_SUCCESS_DURATION_MS 後に自動で消す。
   * クリーンアップでタイマーを解除するのは、アンマウント後や次のコピーでフラグが立ち直した後に
   * 前回のタイマーが発火して表示を戻してしまわないようにするため。
   */
  useEffect(() => {
    if (!isCopied) return;

    const timeoutId = setTimeout(() => {
      setIsCopied(false);
    }, UI_CONSTANTS.COPY_SUCCESS_DURATION_MS);

    return () => clearTimeout(timeoutId);
  }, [isCopied]);

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

  /**
   * 選択中プロファイルの追従
   *
   * @remarks
   * 候補が空になったら選択を外し、選択中のプロファイルが候補から消えたら先頭へ移す。
   * 候補から消えたIDを保持したままにすると、どのチップも選択表示にならないのに
   * 消えたプロファイルで展開し続けてしまうため。Web版のプレビューと同じ規則。
   */
  useEffect(() => {
    if (filteredProfiles.length === 0) {
      setSelectedProfileId(null);
      return;
    }

    if (!selectedProfileId || !filteredProfiles.some((p: Profile) => p.id === selectedProfileId)) {
      setSelectedProfileId(filteredProfiles[0].id);
    }
  }, [selectedProfileId, filteredProfiles]);

  /**
   * profileIdに対応する「変数名 → 値」のマップを構築する
   *
   * @remarks
   * 組み立て規則は Web版のプレビュー（SnippetPreview）と同一でなければならない。
   * 片方だけ規則が変わるとプラットフォーム間で展開結果が食い違うため、
   * 実体は shared の VariableService に置き、両アプリはそれを呼ぶだけにしている。
   */
  const buildProfileVariablesMap = useCallback(
    (profileId: string | null): Record<string, string> =>
      VariableService.buildProfileVariablesMapFromArrays(profileId, variables, profileVariables),
    [profileVariables, variables]
  );

  /**
   * 特定のプロファイル用のカスタム変数リゾルバを作成
   *
   * プレビューの展開結果をコピー・キーボード入力と一致させるため、
   * 実際のプラン状態と同じ上限で解決する。
   */
  const createProfileResolver = useCallback(
    (profileId: string | null): VariableResolver => {
      Logger.debug(`[VariablePreview] Creating resolver for profile: ${profileId || 'null'}`);
      const profileVariablesMap = buildProfileVariablesMap(profileId);
      const defaultProfileVariablesMap = buildProfileVariablesMap(defaultProfile?.id || null);
      return VariableService.createCustomVariableResolver(
        {
          isSubscribed,
          profileVariablesMap,
          defaultProfileVariablesMap,
        },
        { freeTierLimit: FREE_VARIABLES_LIMIT }
      );
    },
    [buildProfileVariablesMap, defaultProfile, isSubscribed]
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
        const locale = language || 'en';

        const result = await VariableService.resolvePreviewText(title, content, {
          locale,
          customResolver,
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
    /* createProfileResolverは変数定義・変数値が変わったときだけ再生成されるため、依存に含めてよい */
    /* languageを依存に含めるのは、曜日などロケール依存のシステム変数を切替後の言語で出し直すため */
  }, [title, content, selectedProfileId, createProfileResolver, language]);

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
            disabled={loading || !copyText}
          >
            <Ionicons
              name={isCopied ? "checkmark-circle" : "copy-outline"}
              size={18}
              color={isCopied ? colors.success : colors.primary}
            />
            <Text style={[
              styles.copyButtonText,
              {
                color: isCopied ? colors.success : colors.primary,
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
                      color: isSelected ? colors.onPrimary : colors.textSecondary,
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
          {/* プレビューコンテンツ（変数解決済み、空の場合は空状態メッセージ） */}
          <Text style={[styles.preview, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>{preview || t('common.preview_empty')}</Text>
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
  /**
   * プロファイルチップ
   *
   * 角丸と左右余白は他のチップ実装（CategoryFilter / SortMenu / ProfileChipSelector /
   * settings/variables）と同一トークンに揃えている。
   * 非選択時に背景を敷かないのはこのチップだけだが、これは意図的なもので、
   * 親の previewBox が colors.card を敷いているため colors.surface を重ねると二重背景になる。
   */
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UI_CONSTANTS.GAP.BASE,
    paddingVertical: UI_CONSTANTS.GAP.SM,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.XL,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    gap: UI_CONSTANTS.GAP.XS,
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
