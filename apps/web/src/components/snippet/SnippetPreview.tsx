/**
 * スニペットプレビューコンポーネント
 *
 * @description
 * スニペット編集画面で、変数展開後の実際の表示内容をプレビュー。
 * プロファイルを切り替えて、各環境での表示を確認できる。
 *
 * 機能:
 * - プロファイル切り替えタブ
 * - 変数のリアルタイム展開
 * - プレビューコピーボタン
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation, VariableService, getClipboardAdapter, FREE_VARIABLES_LIMIT, type Profile, type ProfileVariable, type Variable } from '@cliptap/shared';
import { useSubscription } from '@hooks/useWebSubscription';
import { PreviewHeader } from './PreviewHeader';
import { ProfileTabs } from './ProfileTabs';
import { PreviewContent } from './PreviewContent';

interface SnippetPreviewProps {
  title: string;
  content: string;
  copyWithTitle: boolean;
  selectedProfileIds: string[];
  profiles: Profile[];
  variables: Variable[];
  profileVariables: ProfileVariable[];
}

export function SnippetPreview({
  title,
  content,
  copyWithTitle,
  selectedProfileIds,
  profiles,
  variables,
  profileVariables,
}: SnippetPreviewProps) {
  const { language } = useTranslation();
  const { isSubscribed } = useSubscription();
  const validProfiles = useMemo(() => profiles.filter((profile) => profile.valid), [profiles]);

  const filteredProfiles = useMemo(() => {
    if (selectedProfileIds.length === 0) {
      return validProfiles;
    }
    return validProfiles.filter((profile) => selectedProfileIds.includes(profile.id));
  }, [selectedProfileIds, validProfiles]);

  const defaultProfileId = useMemo(() => {
    const profile = validProfiles.find((p) => p.isDefault);
    return profile?.id || null;
  }, [validProfiles]);

  const [focusedProfileId, setFocusedProfileId] = useState<string | null>(null);

  /**
   * 変数リゾルバーを作成（変数展開処理で使用）
   *
   * プレビューの展開結果をコピーと一致させるため、実際のプラン状態と同じ上限で解決する。
   * 標準プロファイル分のマップも渡すのは、対象プロファイルに値が無い変数を標準側で補うため。
   */
  const createResolver = useCallback((profileId: string | null) => {
    const profileVariablesMap = VariableService.buildProfileVariablesMapFromArrays(profileId, variables, profileVariables);
    const defaultProfileVariablesMap = VariableService.buildProfileVariablesMapFromArrays(defaultProfileId, variables, profileVariables);
    return VariableService.createCustomVariableResolver(
      {
        isSubscribed,
        profileVariablesMap,
        defaultProfileVariablesMap,
      },
      { freeTierLimit: FREE_VARIABLES_LIMIT }
    );
  }, [variables, profileVariables, defaultProfileId, isSubscribed]);

  useEffect(() => {
    if (filteredProfiles.length === 0) {
      setFocusedProfileId(null);
      return;
    }

    if (!focusedProfileId || !filteredProfiles.some((profile) => profile.id === focusedProfileId)) {
      setFocusedProfileId(filteredProfiles[0].id);
    }
  }, [filteredProfiles, focusedProfileId]);

  const [resolvedTitle, setResolvedTitle] = useState('');
  const [resolvedContent, setResolvedContent] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * プレビュー生成（変数展開処理）
   */
  useEffect(() => {
    let cancelled = false;

    const generatePreview = async () => {
      setLoading(true);
      try {
        const customResolver = createResolver(focusedProfileId);
        const locale = language || 'en';

        const result = await VariableService.resolvePreviewText(title, content, {
          locale,
          customResolver,
        });

        if (!cancelled) {
          setResolvedTitle(result.title);
          setResolvedContent(result.content);
        }
      } catch (error) {
        console.error('Failed to generate preview:', error);
        if (!cancelled) {
          setResolvedTitle(title);
          setResolvedContent(content);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    generatePreview();

    return () => { cancelled = true; };
  }, [title, content, focusedProfileId, createResolver, language]);

  const [copied, setCopied] = useState(false);

  /**
   * プレビューをクリップボードにコピー
   */
  const handleCopy = async () => {
    const lines = [];
    if (copyWithTitle && resolvedTitle) {
      lines.push(resolvedTitle);
    }
    if (resolvedContent) {
      lines.push(resolvedContent);
    }

    if (lines.length === 0) {
      return;
    }

    try {
      /* getClipboardAdapter() は未登録時に throw するため、この try の内側で呼ぶ */
      await getClipboardAdapter().copy(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy preview:', error);
    }
  };

  const canCopy = !!(resolvedContent || (copyWithTitle && resolvedTitle));

  /* スニペットプレビュー（変数展開後の表示内容、プロファイル切り替え対応） */
  return (
    <div className="border border-blue-200 dark:border-blue-900/40 rounded-2xl p-4 space-y-4 bg-blue-50/30 dark:bg-blue-900/10">
      {/* プレビューヘッダー（ラベルとコピーボタン） */}
      <PreviewHeader
        loading={loading}
        copied={copied}
        canCopy={canCopy}
        onCopy={handleCopy}
      />

      {/* プロファイルタブ（環境切り替え） */}
      <ProfileTabs
        profiles={filteredProfiles}
        selectedProfileId={focusedProfileId}
        onSelectProfile={setFocusedProfileId}
      />

      {/* プレビューコンテンツ（変数展開後のタイトルと本文） */}
      <PreviewContent
        loading={loading}
        resolvedTitle={resolvedTitle}
        resolvedContent={resolvedContent}
        copyWithTitle={copyWithTitle}
      />
    </div>
  );
}
