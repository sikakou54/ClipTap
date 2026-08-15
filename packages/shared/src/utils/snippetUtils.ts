/**
 * @module snippetUtils
 * @description スニペット関連のユーティリティ関数
 *
 * このモジュールはスニペットのクリップボードコピー前の
 * テキスト準備（変数展開を含む）などの処理を提供します。
 */

import type { Snippet } from '../schema';
import * as VariableParser from '../variables/parser';
import { SystemVariableFormatRegistry } from '../services/SystemVariableFormatRegistry';

/**
 * 展開済みテキストをクリップボード用に連結する際のオプション
 */
interface JoinSnippetTextOptions {
  /** 展開済みタイトル */
  title?: string | null;
  /** 展開済み本文 */
  content?: string | null;
  /** タイトルも一緒にコピーするかどうか（デフォルト: false） */
  copyWithTitle?: boolean;
}

/**
 * 展開済みのタイトルと本文をクリップボード用の1つのテキストへ連結する
 *
 * @param options - 連結オプション
 *
 * @returns 連結済みテキスト（連結対象がない場合は空文字）
 *
 * @remarks
 * タイトルと本文の連結規則はこの関数を唯一の正本とします。
 * モバイル・Webのプレビューコピーと一覧コピーがすべてここを呼ぶことで、
 * 同じ定型文であれば経路によらず同じ文字列がクリップボードへ渡ることを保証します。
 *
 * 規則は「非空の要素だけを改行で連結する」です。
 * 空判定はtrim後の空文字で行いますが、連結する値そのものはtrimしません。
 * 本文の先頭・末尾の空白や改行が利用者の意図した書式である場合を壊さないためです。
 * 本文が空のときにタイトルの後ろへ改行を付けないのは、
 * 区切る相手がない区切り文字を出力しないためです。
 */
export const joinSnippetTextForClipboard = ({
  title,
  content,
  copyWithTitle = false,
}: JoinSnippetTextOptions): string => {
  const parts: string[] = [];

  /* タイトルはcopyWithTitleがONで、かつ空白のみでない場合だけ連結対象にする */
  if (copyWithTitle && title && title.trim() !== '') {
    parts.push(title);
  }

  /* 本文が空白のみの場合はコピーする内容がないものとして扱う */
  if (content && content.trim() !== '') {
    parts.push(content);
  }

  return parts.join('\n');
};

/**
 * スニペットをクリップボードにコピーする際のオプション
 */
interface CopySnippetOptions {
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
 * 2. 展開済みのタイトルと本文をjoinSnippetTextForClipboardの規則で連結
 * 3. 最終的なコピー用テキストを返す
 *
 * 変数展開はVariableParserモジュールを使用して行われます。
 * 連結規則はjoinSnippetTextForClipboardが正本で、ここでは独自に組み立てません。
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
    const formats = SystemVariableFormatRegistry.getAll();
    /* 本文に変数が含まれている場合は展開 */
    if (VariableParser.hasVariables(content)) {
      content = await VariableParser.replaceVariables(content, { customResolver, locale, formats });
    }
    /* タイトルに変数が含まれている場合は展開 */
    if (title && VariableParser.hasVariables(title)) {
      title = await VariableParser.replaceVariables(title, { customResolver, locale, formats });
    }
  }

  /* 連結規則は共有正本へ集約し、プレビューや一覧コピーと同じ出力にする */
  return joinSnippetTextForClipboard({
    title,
    content,
    copyWithTitle: snippet.copyWithTitle,
  });
};

/**
 * スニペットのタイトルだけをクリップボードにコピーする前のテキストを準備
 *
 * @param options - コピーオプション
 *
 * @returns クリップボードにコピーされるタイトル（タイトルがない場合は空文字）
 *
 * @remarks
 * この関数は以下の処理を行います:
 * 1. タイトルがない場合は空文字を返す
 * 2. 変数展開が有効な場合、タイトル内の変数を展開
 * 3. 展開済みタイトルを返す（本文は結合しない）
 *
 * メールの件名と本文のように、タイトルと本文を別々の欄へ貼り付けたい場合に使用します。
 * `copyWithTitle` は判定に使いません。一覧ではタイトルが常に表示されており、
 * 利用者が明示的にタイトルを指定してコピーするためです。
 */
export const prepareSnippetTitleForClipboard = async ({
  snippet,
  customResolver,
  shouldReplaceVariables = true,
  locale = 'en',
}: CopySnippetOptions): Promise<string> => {
  let title = snippet.title;

  /* タイトルを持たないスニペットはコピーするものがない */
  if (!title) {
    return '';
  }

  /* 変数展開が有効な場合、タイトル内の変数を展開 */
  if (shouldReplaceVariables) {
    const formats = SystemVariableFormatRegistry.getAll();
    if (VariableParser.hasVariables(title)) {
      title = await VariableParser.replaceVariables(title, { customResolver, locale, formats });
    }
  }

  return title;
};
