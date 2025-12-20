/**
 * モバイルアプリ向け変数解決ヘルパーユーティリティ
 *
 * スニペット内の変数（{{変数名}}形式）を実際の値に展開するためのヘルパー関数を提供します。
 *
 * 変数の種類:
 * - システム変数: {{今日}}、{{現在時刻}}など、自動的に展開される変数
 * - カスタム変数: {{名前}}、{{メール}}など、環境（Profile）ごとに値を設定する変数
 *
 * 変数展開のタイミング:
 * - 保存時: 変数は {{変数名}} のまま保存
 * - 表示時: プレビュー表示時に変数を展開
 * - コピー時: クリップボードにコピーする直前に変数を展開
 */

import {
  VariableService,
  ProfileService,
  SubscriptionService,
  FEATURE_LIMITS,
  hasVariables,
  replaceVariables,
  type VariableResolver,
} from '@cliptap/shared';
import i18next from '@i18n/config';

export interface ResolvedSnippet {
  resolvedTitle: string;
  resolvedContent: string;
}

/**
 * カスタム変数リゾルバーを作成
 *
 * @param profileId - 使用するプロファイルID（省略時はアクティブなプロファイル）
 * @returns カスタム変数を解決するリゾルバー関数
 */
function createResolver(profileId?: string): VariableResolver {
  /* Proプラン加入状態を取得（無料プランでは変数数制限が適用される） */
  const isSubscribed = SubscriptionService.isSubscribed();
  /* 指定プロファイルまたはアクティブプロファイルの変数値マップを取得 */
  const profileVariablesMap = profileId
    ? ProfileService.getProfileVariablesMap(profileId)
    : ProfileService.getActiveProfileVariablesMap();
  /* デフォルトプロファイルの変数値マップを取得（フォールバック用） */
  const defaultProfileVariablesMap = ProfileService.getDefaultProfileVariablesMap();

  /* カスタム変数リゾルバーを作成（プロファイル固有値 → デフォルト値 → 空文字の優先順位で解決） */
  return VariableService.createCustomVariableResolver(
    { isSubscribed, profileVariablesMap, defaultProfileVariablesMap },
    { freeTierLimit: FEATURE_LIMITS.FREE_TIER_VARIABLES }
  );
}

/**
 * スニペットのタイトルとコンテンツ内の変数を解決
 *
 * タイトルと本文の両方に含まれる変数を一度に展開します。
 *
 * @param title - スニペットのタイトル
 * @param content - スニペットのコンテンツ
 * @param profileId - 使用するプロファイルID（省略時はアクティブなプロファイル）
 */
export async function resolveSnippetVariables(
  title: string,
  content: string,
  profileId?: string
): Promise<ResolvedSnippet> {
  /* カスタム変数リゾルバーを作成（プロファイル指定またはアクティブプロファイルを使用） */
  const resolver = createResolver(profileId);
  /* 現在のロケールを取得（システム変数の日付フォーマット等に使用） */
  const locale = i18next.language || 'en';
  /* 変数展開オプション（未知の変数はそのまま保持） */
  const options = { locale, customResolver: resolver, preserveUnknown: true };

  /* タイトルとコンテンツを並列で変数展開（パフォーマンス最適化） */
  const [resolvedTitle, resolvedContent] = await Promise.all([
    hasVariables(title) ? replaceVariables(title, options) : title,
    hasVariables(content) ? replaceVariables(content, options) : content,
  ]);

  return { resolvedTitle, resolvedContent };
}

/**
 * 単一のテキスト内の変数を解決
 *
 * @param text - 変数を含むテキスト
 * @param profileId - 使用するプロファイルID（省略時はアクティブなプロファイル）
 */
export async function resolveTextVariables(
  text: string,
  profileId?: string
): Promise<string> {
  if (!hasVariables(text)) {
    return text;
  }

  const locale = i18next.language || 'en';
  return replaceVariables(text, {
    locale,
    customResolver: createResolver(profileId),
    preserveUnknown: true,
  });
}

export { hasVariables };
