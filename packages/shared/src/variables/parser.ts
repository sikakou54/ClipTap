/**
 * @module parser
 * @description 変数のパース・展開エンジン
 *
 * このモジュールは、テキスト内の変数トークン（{{変数名}}）を検出し、
 * 適切な値に展開する機能を提供します。
 *
 * 変数解決の優先順位:
 * 1. システム変数（{{today}}, {{time}} 等）
 * 2. カスタム変数（カスタムリゾルバ経由）
 *
 * 正規表現による変数検出:
 * - パターン: /\{\{([^}]+)\}\}/g
 * - マッチ例: "{{today}}" → 変数名 "today"
 * - 変数名内に }} は使用不可
 */

import { resolveSystemVariableValue, normalizeLocale } from './systemVariables';
import type { SystemVariableFormats } from '../constants/systemVariableFormats';

/**
 * カスタム変数リゾルバ型
 *
 * @typedef {Function} VariableResolver
 * @param {string} name - 変数名
 * @returns {string | null | undefined | Promise<string | null | undefined>}
 *   解決された値、または解決できない場合はnull/undefined
 *
 * @description
 * カスタム変数の値を解決するための関数型。
 * 同期・非同期の両方に対応しています。
 */
export type VariableResolver =
  | ((name: string) => string | null | undefined)
  | ((name: string) => Promise<string | null | undefined>);

/**
 * 変数トークンを検出する正規表現パターン
 * @constant
 * @private
 *
 * パターン解説:
 * - \{\{ : 開始トークン "{{" をエスケープ付きでマッチ
 * - ([^}]+) : 変数名をキャプチャ（"}}" 以外の1文字以上）
 * - \}\} : 終了トークン "}}" をエスケープ付きでマッチ
 * - /g : グローバルフラグ（複数マッチ）
 */
const VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;

/**
 * 変数トークンパターン（外部公開用）
 */
export const VARIABLE_TOKEN_PATTERN = VARIABLE_PATTERN;

/**
 * 変数名を変数トークン形式にフォーマット
 *
 * @param {string} name - 変数名
 * @returns {string} フォーマットされた変数トークン
 */
export const formatVariable = (name: string): string => {
  return `{{${name}}}`;
};

/**
 * テキストに変数が含まれているかをチェック
 *
 * @param {string} text - チェック対象のテキスト
 * @returns {boolean} 変数が含まれている場合はtrue
 */
export const hasVariables = (text: string): boolean => {
  return new RegExp(VARIABLE_PATTERN).test(text);
};

/**
 * テキストから変数名を抽出
 *
 * @param {string} text - 抽出対象のテキスト
 * @returns {string[]} 変数名の配列（重複なし、出現順）
 *
 * @description
 * テキスト内のすべての変数トークンから変数名を抽出します。
 * 同じ変数名が複数回出現する場合でも、配列には1回のみ含まれます。
 *
 * @remarks
 * 変数名の前後の空白は自動的にトリミングされます。
 */
export const extractVariables = (text: string): string[] => {
  const variables: string[] = [];
  const pattern = new RegExp(VARIABLE_PATTERN);
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const variableName = match[1]?.trim() ?? '';

    if (!variables.includes(variableName)) {
      variables.push(variableName);
    }
  }

  return variables;
};

/**
 * 正規表現の特殊文字をエスケープ
 *
 * @param {string} value - エスケープ対象の文字列
 * @returns {string} エスケープされた文字列
 *
 * @private
 *
 * @remarks
 * $& は置換パターンでマッチした文字列全体を表す
 */
const escapeRegExp = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * テキスト内の変数を展開
 *
 * @param {string} text - 展開対象のテキスト
 * @param {Object} [options] - オプション
 * @param {string} [options.locale='en'] - ロケール（システム変数の表示用）
 * @param {VariableResolver} [options.customResolver] - カスタム変数リゾルバ
 * @param {boolean} [options.preserveUnknown=false] - 未知の変数を保持するか
 * @returns {Promise<string>} 展開後のテキスト
 *
 * @description
 * テキスト内のすべての変数トークンを検出し、適切な値に置換します。
 *
 * 変数解決の優先順位:
 * 1. システム変数（{{today}}, {{time}} 等）
 * 2. カスタム変数（customResolver経由）
 *
 * 未知の変数の扱い:
 * - preserveUnknown=false（デフォルト）: {{変数}} のまま保持
 * - preserveUnknown=true: 変数トークンを削除（空文字に置換）
 *
 * @remarks
 * - 非同期処理に対応（カスタムリゾルバがPromiseを返す場合）
 * - 同じ変数が複数箇所にある場合、すべて同じ値に置換されます
 * - システム変数は常に現在日時で展開されます
 *
 * @throws {Error} カスタムリゾルバがエラーをスローした場合
 */
export const replaceVariables = async (
  text: string,
  options: {
    locale?: string;
    customResolver?: VariableResolver;
    preserveUnknown?: boolean;
    formats?: SystemVariableFormats;
  } = {}
): Promise<string> => {
  const { locale = 'en', customResolver, preserveUnknown = false, formats } = options;
  const normalizedLocale = normalizeLocale(locale);
  const matches = [...text.matchAll(new RegExp(VARIABLE_PATTERN))];

  if (matches.length === 0) return text;

  let result = text;

  for (const match of matches) {
    const token = match[0];
    const variableName = match[1]?.trim() ?? '';

    let replacement: string | null | undefined = resolveSystemVariableValue(
      variableName,
      normalizedLocale,
      new Date(),
      formats
    );

    if ((replacement === null || replacement === undefined) && customResolver) {
      const resolved = customResolver(variableName);
      replacement = (resolved instanceof Promise ? await resolved : resolved) ?? null;
    }

    if (replacement === null || replacement === undefined) {
      if (preserveUnknown) {
        continue;
      }
      replacement = token;
    }

    const regex = new RegExp(escapeRegExp(token), 'g');
    result = result.replace(regex, replacement);
  }

  return result;
};
