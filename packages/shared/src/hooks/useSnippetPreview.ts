/**
 * スニペットプレビュー用カスタムフック
 *
 * @description
 * スニペットに含まれる変数（システム変数・カスタム変数）を展開し、
 * リアルタイムでプレビュー表示を提供します。
 *
 * 主な機能:
 * - システム変数（{{今日}}、{{現在時刻}}等）の自動展開
 * - カスタム変数（{{名前}}、{{メール}}等）の環境別展開
 * - リアルタイムプレビュー更新
 *
 * @module useSnippetPreview
 */

import { useState, useEffect } from 'react';
import { useProfiles } from '../providers/ProfileProvider';
import { ProfileService } from '../services/ProfileService';
import { VariableService } from '../services/VariableService';
import { SubscriptionService } from '../services/SubscriptionService';
import { FEATURE_LIMITS } from '../constants/inputLimits';
import { hasVariables, replaceVariables } from '../variables/parser';
import { Logger } from '../utils/logger';
import { SystemVariableFormatRegistry } from '../services/SystemVariableFormatRegistry';

/**
 * useSnippetPreview フックのオプション
 */
export interface UseSnippetPreviewOptions {
  /** スニペットのタイトル（nullの場合は空文字として扱う） */
  title: string | null;
  /** スニペットの本文 */
  content: string;
  /** 環境IDを上書き（指定しない場合はアクティブな環境を使用） */
  overrideProfileId?: string | null;
  /** ロケール（'ja' | 'en' など）- 省略時は 'en' */
  locale?: string;
}

/**
 * useSnippetPreview フックの返却値
 */
export interface UseSnippetPreviewResult {
  /** 変数展開後のタイトル */
  displayTitle: string;
  /** 変数展開後の本文 */
  displayContent: string;
  /** 変数展開処理中フラグ */
  isResolving: boolean;
}

/**
 * スニペット変数を解決する内部関数
 * タイトルと本文の変数をプロファイルごとの値で展開する
 */
async function resolveSnippetVariables(
  title: string,
  content: string,
  profileId: string | undefined,
  locale: string
): Promise<{ resolvedTitle: string; resolvedContent: string }> {
  const isSubscribed = SubscriptionService.isSubscribed();

  /* プロファイルID指定があればその環境の値を、なければ現在のアクティブ環境の値を使用 */
  const profileVariablesMap = profileId
    ? ProfileService.getProfileVariablesMap(profileId)
    : ProfileService.getActiveProfileVariablesMap();

  /* デフォルト環境の値マップを取得（フォールバック用） */
  const defaultProfileVariablesMap = ProfileService.getDefaultProfileVariablesMap();

  /* 無料プランの場合の変数数制限（FREE_TIER_VARIABLES）を適用 */
  const syncResolver = VariableService.createCustomVariableResolver(
    { isSubscribed, profileVariablesMap, defaultProfileVariablesMap },
    { freeTierLimit: FEATURE_LIMITS.FREE_TIER_VARIABLES }
  );
  const formats = SystemVariableFormatRegistry.getAll();

  /* hasVariablesで変数の有無を事前チェックし、不要な処理をスキップして高速化 */
  const [resolvedTitle, resolvedContent] = await Promise.all([
    hasVariables(title)
      ? replaceVariables(title, {
          locale,
          customResolver: syncResolver,
          formats,
        })
      : title,
    hasVariables(content)
      ? replaceVariables(content, {
          locale,
          customResolver: syncResolver,
          formats,
        })
      : content,
  ]);

  return { resolvedTitle, resolvedContent };
}

/**
 * スニペットのタイトルとコンテンツの変数を解決して表示用テキストを提供
 *
 * @param options - スニペットのタイトル、コンテンツ、環境ID、ロケール
 * @returns 解決された表示用テキストと読み込み状態
 */
export function useSnippetPreview({
  title,
  content,
  overrideProfileId,
  locale = 'en',
}: UseSnippetPreviewOptions): UseSnippetPreviewResult {
  const [displayTitle, setDisplayTitle] = useState(title || '');
  const [displayContent, setDisplayContent] = useState(content);
  const [isResolving, setIsResolving] = useState(false);

  const { activeProfile } = useProfiles();

  /* title、content、activeProfile、overrideProfileId、localeのいずれかが変更されたときに変数展開を実行 */
  useEffect(() => {
    const resolve = async () => {
      setIsResolving(true);
      try {
        /* プロファイルIDを決定: overrideProfileIdが指定されている場合はそれを使用、なければアクティブプロファイル */
        const profileIdToUse = overrideProfileId !== undefined ? overrideProfileId : activeProfile?.id;

        const { resolvedTitle, resolvedContent } = await resolveSnippetVariables(
          title || '',
          content,
          profileIdToUse ?? undefined,
          locale
        );

        setDisplayTitle(resolvedTitle);
        setDisplayContent(resolvedContent);
      } catch (error) {
        /* エラー時は元のテキストをそのまま使用（変数展開しない） */
        Logger.error('[useSnippetPreview] Variable resolution failed:', error);
        setDisplayTitle(title || '');
        setDisplayContent(content);
      } finally {
        setIsResolving(false);
      }
    };

    void resolve();
  }, [title, content, activeProfile, overrideProfileId, locale]);

  return {
    displayTitle,
    displayContent,
    isResolving,
  };
}
