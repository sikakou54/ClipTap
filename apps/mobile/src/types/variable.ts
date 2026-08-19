/**
 * 変数に関する型定義（モバイル用）
 *
 * 共通型定義(@cliptap/shared)のicon型(string)をIonicons固有の型に置き換え、
 * 型安全性を向上させます。
 *
 * @see @cliptap/shared
 */

import { Ionicons } from '@expo/vector-icons';
import {
  type UISystemVariableDefinition as SharedUISystemVariableDefinition,
  type VariableOption as SharedVariableOption,
  UI_SYSTEM_VARIABLES as SHARED_UI_SYSTEM_VARIABLES,
} from '@cliptap/shared';

type IoniconsName = keyof typeof Ionicons.glyphMap;

/**
 * UI表示用システム変数の定義（モバイル用）
 *
 * 共有版のiconフィールドをIonicons固有の型に置き換え、
 * 存在しないアイコン名を指定するとコンパイルエラーになります。
 */
export interface UISystemVariableDefinition extends Omit<SharedUISystemVariableDefinition, 'icon'> {
  icon: IoniconsName;
}

/**
 * 変数選択UI用のオプション型（モバイル用）
 *
 * ピッカーやドロップダウンで表示される選択肢の型です。
 */
export interface VariableOption extends Omit<SharedVariableOption, 'icon'> {
  icon: IoniconsName;
}

/**
 * UI表示用システム変数の一覧（Ionicons型適用済み）
 */
export const UI_SYSTEM_VARIABLES = SHARED_UI_SYSTEM_VARIABLES as UISystemVariableDefinition[];
