/**
 * @module systemVariables
 * @description システム変数の定義と解決を行うモジュール
 *
 * システム変数は、アプリケーションが提供する定義済みの変数で、
 * 日付・時刻などの動的な値を自動挿入できます。
 *
 * システム変数とカスタム変数の違い:
 * - システム変数: {{today}}, {{time}} など、アプリが自動的に値を生成
 * - カスタム変数: {{name}}, {{email}} など、ユーザーが値を定義
 *
 * 変数の展開タイミング:
 * - 変数はコピー時のみ展開されます（保存時は {{変数}} のまま）
 * - 常に最新の日時が使用されます
 */

import {
  DEFAULT_SYSTEM_VARIABLE_FORMATS,
  sanitizeSystemVariableFormat,
  type SystemVariableFormats,
  type SystemVariableKey,
} from '../constants/systemVariableFormats';
import { formatByPattern } from '../utils/dateFormatter';

/**
 * サポートされているロケール
 * @typedef {'ja' | 'en'} SupportedLocale
 */
export type SupportedLocale = 'ja' | 'en';

/**
 * ASCII文字のみで構成されているかを判定する正規表現
 * @constant
 * @private
 *
 * 非ASCII（U+0080以降）を1文字も含まないことを判定する。
 * ASCII範囲（0x00～0x7F）の否定形で表現しており、判定結果は同一。
 * 英数字の場合は大文字小文字を正規化するために使用
 */
const ASCII_PATTERN = /^[^\u0080-\uFFFF]+$/;

/**
 * システム変数の定義
 *
 * @interface SystemVariableDefinition
 * @property {string} key - 変数の識別子（内部用）
 * @property {string[]} aliases - 変数名のエイリアス（日本語・英語両対応）
 *
 * @remarks
 * 値の生成はこの型に持たせない。書式は constants/systemVariableFormats.ts の
 * SYSTEM_VARIABLE_FORMAT_PRESETS、実際の描画は utils/dateFormatter.ts の
 * formatByPattern が担う。
 */
export interface SystemVariableDefinition {
  key: SystemVariableKey;
  aliases: string[];
}

/**
 * システム変数の定義配列
 *
 * @constant
 * @type {SystemVariableDefinition[]}
 *
 * @description 利用可能なシステム変数:
 * - {{today}} / {{今日}} - 今日の日付 (YYYY/MM/DD)
 * - {{now}} / {{現在}} - 現在の日時 (YYYY/MM/DD HH:mm:ss)
 * - {{time}} / {{時刻}} - 現在の時刻 (HH:mm)
 * - {{year}} / {{年}} - 現在の年 (YYYY)
 * - {{month}} / {{月}} - 現在の月 (MM)
 * - {{day}} / {{日}} - 現在の日 (DD)
 * - {{weekday}} / {{曜日}} - 現在の曜日（ロケール依存）
 */
export const SYSTEM_VARIABLES: SystemVariableDefinition[] = [
  {
    key: 'today',
    aliases: ['today', '今日'],
  },
  {
    key: 'now',
    aliases: ['now', '現在'],
  },
  {
    key: 'time',
    aliases: ['time', '時刻'],
  },
  {
    key: 'year',
    aliases: ['year', '年'],
  },
  {
    key: 'month',
    aliases: ['month', '月'],
  },
  {
    key: 'day',
    aliases: ['day', '日'],
  },
  {
    key: 'weekday',
    aliases: ['weekday', '曜日'],
  },
];

/**
 * ロケール文字列を正規化
 *
 * @param {string} [locale] - ロケール文字列（例: 'ja-JP', 'en-US'）
 * @returns {SupportedLocale} 正規化されたロケール ('ja' または 'en')
 *
 * @description
 * 'ja'で始まる場合は'ja'、それ以外は'en'を返します。
 * undefinedの場合はデフォルトで'en'を返します。
 */
export const normalizeLocale = (locale?: string): SupportedLocale => {
  return locale?.startsWith('ja') ? 'ja' : 'en';
};

/**
 * 変数名を正規化
 *
 * @param {string} value - 変数名
 * @returns {string} 正規化された変数名
 *
 * @description
 * ASCII文字のみの場合は小文字化、それ以外（日本語等）はそのまま返します。
 * 前後の空白は除去されます。
 *
 * @remarks
 * これにより、大文字小文字を区別せずに変数を解決できます。
 * 例: "TODAY" と "today" は同じ変数として扱われます。
 */
const normalizeVariableName = (value: string): string => {
  const trimmed = value.trim();
  return ASCII_PATTERN.test(trimmed) ? trimmed.toLowerCase() : trimmed;
};

/**
 * システム変数の値を解決
 *
 * @param {string} rawName - 変数名（例: 'today', '今日', 'TIME'）
 * @param {string} [locale] - ロケール文字列
 * @param {Date} [date=new Date()] - 基準日時（デフォルトは現在日時）
 * @returns {string | null} 解決された値、または該当するシステム変数がない場合はnull
 *
 * @description
 * 指定された変数名がシステム変数に該当する場合、その値を返します。
 * 変数名はエイリアスと照合され、日本語・英語の両方に対応しています。
 *
 * @remarks
 * - 変数名は正規化されてから比較されます（大文字小文字を区別しない）
 * - システム変数でない場合はnullを返します（カスタム変数として処理されます）
 * - 日付パラメータはテスト時に固定値を渡すことで結果を安定させられます
 */
export const resolveSystemVariableValue = (
  rawName: string,
  locale?: string,
  date: Date = new Date(),
  formats?: SystemVariableFormats
): string | null => {
  const normalized = normalizeVariableName(rawName);
  const resolvedLocale = normalizeLocale(locale);

  for (const definition of SYSTEM_VARIABLES) {
    const matches = definition.aliases.some(alias => {
      const normalizedAlias = normalizeVariableName(alias);
      return normalizedAlias === normalized;
    });

    if (matches) {
      const pattern = sanitizeSystemVariableFormat(
        definition.key,
        formats?.[definition.key] ?? DEFAULT_SYSTEM_VARIABLE_FORMATS[definition.key]
      );
      return formatByPattern(date, pattern, resolvedLocale);
    }
  }

  return null;
};
