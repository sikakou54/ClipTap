/**
 * @module variables
 * @description
 * ClipTapの変数システムに関する定数とユーティリティ（Mobile/Web共通）
 *
 * 変数の種類:
 * 1. システム変数（予約語）: {{今日}}, {{現在時刻}}等、アプリが自動展開
 * 2. カスタム変数（ユーザー定義）: {{名前}}, {{メール}}等、プロファイル別に設定可能
 *
 * 使用箇所:
 * - 変数作成時のバリデーション
 * - 変数名の重複チェック
 * - スニペット内の変数パース処理
 */

import { SYSTEM_VARIABLES } from '../variables/systemVariables';

/**
 * システム変数の予約語リスト（キー名のみ）
 */
export const RESERVED_VARIABLE_NAMES = SYSTEM_VARIABLES.map(v => v.key) as readonly string[];

/**
 * すべてのシステム変数エイリアス（日本語・英語含む）
 */
export const ALL_SYSTEM_VARIABLE_ALIASES = SYSTEM_VARIABLES.flatMap(v => v.aliases);

/**
 * 変数名がシステム変数の予約語かどうかをチェック
 * 大文字小文字を区別せず、前後の空白を無視してチェック
 *
 * @param name チェックする変数名（波括弧なし）
 * @returns システム変数の予約語の場合true
 */
export function isReservedVariableName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return ALL_SYSTEM_VARIABLE_ALIASES.some(
    alias => alias.toLowerCase() === normalized
  );
}

/**
 * isReservedVariableNameのエイリアス関数
 */
export function isSystemVariable(name: string): boolean {
  return isReservedVariableName(name);
}
