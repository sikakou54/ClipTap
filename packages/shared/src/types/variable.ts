/**
 * @module variable
 *
 * @remarks
 * - 変数選択UIで使用する型定義を提供
 * - パース・展開処理用の型は systemVariables モジュールを参照
 *
 * 使用箇所:
 * - 変数選択UI（VariableSelector）
 * - 変数管理画面（variable/edit）
 *
 * @see systemVariables - パース・展開処理用の型定義
 */

/* ======================================== */
/* UI表示用システム変数の定義 */
/* ======================================== */

/**
 * UI表示用システム変数の定義を表す型
 *
 * @remarks
 * - 変数選択UIでシステム変数を表示する際に使用
 * - パース処理用のSystemVariableDefinition（systemVariables.ts）とは別の型
 */
export interface UISystemVariableDefinition {
  /** 変数名（内部識別子） - {{today}}, {{now}} などのプレースホルダーに使用 */
  name: string;
  /** アイコン名 - Ionicons等で解釈される文字列 */
  icon: string;
  /** 表示名のi18n翻訳キー - variables.today のような翻訳キー */
  labelKey: string;
  /** 説明文のi18n翻訳キー - variables.today_desc のような翻訳キー */
  descriptionKey: string;
}

/**
 * UI表示用システム変数の一覧
 *
 * @remarks
 * - 変数選択UIに表示するシステム変数のリスト
 * - アイコン名とi18nキーを含む
 */
export const UI_SYSTEM_VARIABLES: UISystemVariableDefinition[] = [
  { name: 'today', icon: 'calendar-outline', labelKey: 'variables.today', descriptionKey: 'variables.today_desc' },
  { name: 'now', icon: 'time-outline', labelKey: 'variables.now', descriptionKey: 'variables.now_desc' },
  { name: 'time', icon: 'alarm-outline', labelKey: 'variables.time', descriptionKey: 'variables.time_desc' },
  { name: 'year', icon: 'calendar-number-outline', labelKey: 'variables.year', descriptionKey: 'variables.year_desc' },
  { name: 'month', icon: 'calendar-number-outline', labelKey: 'variables.month', descriptionKey: 'variables.month_desc' },
  { name: 'day', icon: 'calendar-number-outline', labelKey: 'variables.day', descriptionKey: 'variables.day_desc' },
  { name: 'weekday', icon: 'calendar-outline', labelKey: 'variables.weekday', descriptionKey: 'variables.weekday_desc' },
];

/* ======================================== */
/* UI表示用の型定義 */
/* ======================================== */

/**
 * 変数選択UI用のオプション型
 *
 * @remarks
 * - VariableSelectorコンポーネントで変数を表示する際に使用
 * - システム変数とカスタム変数の両方を統一的に扱う
 * - isSystem: true=システム変数（削除不可）、false=カスタム変数（編集可能）
 */
export interface VariableOption {
  /** 変数名 - {{variable_name}} のプレースホルダーに使用 */
  name: string;
  /** アイコン名 - Ionicons等で解釈される文字列 */
  icon: string;
  /** 表示ラベル - i18nで翻訳済みの変数名 */
  label: string;
  /** 説明文 - i18nで翻訳済みの変数説明 */
  description: string;
  /** システム変数かどうか */
  isSystem: boolean;
}

/* ======================================== */
/* 変数置換結果の型定義 */
/* ======================================== */

/**
 * 変数置換の結果を表す型
 *
 * @remarks
 * - VariableParserが変数を解決した結果を表現
 * - デバッグや変数プレビュー表示に使用
 */
export interface VariableReplacement {
  /** 元の変数表記（例: "{{today}}"） */
  original: string;
  /** 変数名（例: "today"） */
  variable: string;
  /** 解決後の値（例: "2025-12-01"） */
  value: string;
}
