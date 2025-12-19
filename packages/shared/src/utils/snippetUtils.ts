/**
 * @module snippetUtils
 * @description スニペット関連のユーティリティ関数
 *
 * このモジュールはスニペットのクリップボードコピー前の
 * テキスト準備（変数展開を含む）などの処理を提供します。
 */

import type { Snippet } from '../schema';
import * as VariableParser from '../variables/parser';

/**
 * スニペットをクリップボードにコピーする際のオプション
 */
export interface CopySnippetOptions {
  /** コピー対象のスニペット */
  snippet: Snippet;
  /** カスタム変数の値を解決するリゾルバー関数（オプション） */
  customResolver?: VariableParser.VariableResolver;
  /** 変数を展開するかどうか（デフォルト: true） */
  shouldReplaceVariables?: boolean;
  /** ロケール設定（曜日などの言語切り替え、デフォルト: 'en'） */
  locale?: string;
}

/**
 * スニペットをクリップボードにコピーする前のテキストを準備
 *
 * @param options - コピーオプション
 *
 * @returns クリップボードにコピーされる最終的なテキスト
 *
 * @remarks
 * この関数は以下の処理を行います:
 * 1. 変数展開が有効な場合、本文とタイトルの変数（{{今日}}、{{カスタム変数}}等）を展開
 * 2. スニペットのcopyWithTitleフラグがtrueの場合、タイトルと本文を結合
 * 3. 最終的なコピー用テキストを返す
 *
 * 変数展開はVariableParserモジュールを使用して行われます。
 */
export const prepareSnippetForClipboard = async ({
  snippet,
  customResolver,
  shouldReplaceVariables = true,
  locale = 'en',
}: CopySnippetOptions): Promise<string> => {
  let content = snippet.content;
  let title = snippet.title;

  /* 変数展開が有効な場合、本文とタイトル内の変数を展開 */
  if (shouldReplaceVariables) {
    /* 本文に変数が含まれている場合は展開 */
    if (VariableParser.hasVariables(content)) {
      content = await VariableParser.replaceVariables(content, { customResolver, locale });
    }
    /* タイトルに変数が含まれている場合は展開 */
    if (title && VariableParser.hasVariables(title)) {
      title = await VariableParser.replaceVariables(title, { customResolver, locale });
    }
  }

  /* copyWithTitleフラグがtrueでタイトルが存在する場合、タイトルと本文を結合 */
  if (snippet.copyWithTitle && title) {
    return `${title}\n${content}`;
  }
  /* それ以外の場合は本文のみを返す */
  return content;
};
