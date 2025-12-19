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

import { formatDate } from '../utils/dateHelpers';

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
 * \x00-\x7F は ASCII 文字範囲（0x00～0x7F）を表す
 * 英数字の場合は大文字小文字を正規化するために使用
 */
const ASCII_PATTERN = /^[\x00-\x7F]+$/;

/**
 * 曜日のロケール別表示名
 * @constant
 * @private
 *
 * Date.getDay() の戻り値（0=日曜、1=月曜、...、6=土曜）に対応するインデックス
 */
const WEEKDAYS: Record<SupportedLocale, string[]> = {
  ja: ['日', '月', '火', '水', '木', '金', '土'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

/**
 * システム変数の定義
 *
 * @interface SystemVariableDefinition
 * @property {string} key - 変数の識別子（内部用）
 * @property {string[]} aliases - 変数名のエイリアス（日本語・英語両対応）
 * @property {Function} getValue - 変数の値を生成する関数
 */
export interface SystemVariableDefinition {
  key: string;
  aliases: string[];
  getValue: (locale: SupportedLocale, date: Date) => string;
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
    getValue: (_locale, date) => formatDate(date, 'yyyy/MM/dd'),
  },
  {
    key: 'now',
    aliases: ['now', '現在'],
    getValue: (_locale, date) => formatDate(date, 'yyyy/MM/dd HH:mm:ss'),
  },
  {
    key: 'time',
    aliases: ['time', '時刻'],
    getValue: (_locale, date) => formatDate(date, 'HH:mm'),
  },
  {
    key: 'year',
    aliases: ['year', '年'],
    getValue: (_locale, date) => formatDate(date, 'yyyy'),
  },
  {
    key: 'month',
    aliases: ['month', '月'],
    getValue: (_locale, date) => formatDate(date, 'MM'),
  },
  {
    key: 'day',
    aliases: ['day', '日'],
    getValue: (_locale, date) => formatDate(date, 'dd'),
  },
  {
    key: 'weekday',
    aliases: ['weekday', '曜日'],
    getValue: (locale, date) => WEEKDAYS[locale][date.getDay()] ?? '',
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
export const normalizeVariableName = (value: string): string => {
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
  date: Date = new Date()
): string | null => {
  const normalized = normalizeVariableName(rawName);
  const resolvedLocale = normalizeLocale(locale);

  for (const definition of SYSTEM_VARIABLES) {
    const matches = definition.aliases.some(alias => {
      const normalizedAlias = normalizeVariableName(alias);
      return normalizedAlias === normalized;
    });

    if (matches) {
      return definition.getValue(resolvedLocale, date);
    }
  }

  return null;
};

