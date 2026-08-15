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
import { Logger, useTranslation, VariableService, getClipboardAdapter, joinSnippetTextForClipboard, FREE_VARIABLES_LIMIT, useSharedSubscription, useProfiles, type Profile, type ProfileVariable, type Variable } from '@cliptap/shared';
import { PreviewHeader } from './PreviewHeader';
import { ProfileTabs } from './ProfileTabs';
import { PreviewContent } from './PreviewContent';

/** コピー完了表示を出しておく時間（ミリ秒） */
const COPY_SUCCESS_DURATION_MS = 2000;

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
  const { isSubscribed } = useSharedSubscription();
  const { defaultProfile } = useProfiles();
  const validProfiles = useMemo(() => profiles.filter((profile) => profile.valid), [profiles]);

  const filteredProfiles = useMemo(() => {
    if (selectedProfileIds.length === 0) {
      return validProfiles;
    }
    return validProfiles.filter((profile) => selectedProfileIds.includes(profile.id));
  }, [selectedProfileIds, validProfiles]);

  /**
   * 変数のフォールバック元になる標準プロファイルID
   *
   * @remarks
   * 候補タブに並べるのは有効なプロファイルだけだが（機能仕様書 §8.10）、
   * 値が無い変数を補うフォールバック元の標準プロファイルは有効かどうかを問わない（同 §8.6）。
   * そのため候補リストからは探さず、共有Providerの標準プロファイルをそのまま使う。
   * モバイルの VariablePreview も同じ取得元のため、両者の展開結果が一致する。
   */
  const defaultProfileId = defaultProfile?.id || null;

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
        Logger.error('Failed to generate preview:', error);
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
   * クリップボードへ渡す展開済みテキスト
   *
   * @remarks
   * 連結規則は共有の joinSnippetTextForClipboard を唯一の正本とする。
   * 一覧のコピーも同じ関数を通るため、同じ定型文ならプレビューからコピーしても
   * 一覧からコピーしても同じ文字列になる。
   */
  const copyText = useMemo(
    () => joinSnippetTextForClipboard({ title: resolvedTitle, content: resolvedContent, copyWithTitle }),
    [resolvedTitle, resolvedContent, copyWithTitle]
  );

  /**
   * プレビューをクリップボードにコピー
   */
  const handleCopy = async () => {
    /* コピー対象が無いときはクリップボードAPIを呼ばない */
    if (!copyText) {
      return;
    }

    try {
      /* getClipboardAdapter() は未登録時に throw するため、この try の内側で呼ぶ */
      await getClipboardAdapter().copy(copyText);
      setCopied(true);
    } catch (error) {
      Logger.error('Failed to copy preview:', error);
    }
  };

  /**
   * コピー完了表示の自動リセット
   *
   * @remarks
   * クリーンアップでタイマーを解除するのは、アンマウント後や次のコピーでフラグが立ち直した後に
   * 前回のタイマーが発火して表示を戻してしまわないようにするため。
   */
  useEffect(() => {
    if (!copied) return;

    const timeoutId = setTimeout(() => setCopied(false), COPY_SUCCESS_DURATION_MS);

    return () => clearTimeout(timeoutId);
  }, [copied]);

  const canCopy = !!copyText;

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
