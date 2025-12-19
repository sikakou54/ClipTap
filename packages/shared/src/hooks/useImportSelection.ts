/**
 * インポート選択UI状態管理Hook
 *
 * @description
 * 部分インポート機能における選択状態の管理ラッパー。
 * useSelection の重複チェック有効版として動作。
 *
 * @module useImportSelection
 *
 * @remarks
 * - 既存データと名前が重複するデータは選択不可（無効化）
 * - スニペットは重複チェックなし（同名でも追加可能）
 * - 環境・カテゴリは名前による重複チェック
 * - 変数は全選択可能（重複は上書き警告のみ）
 */

import type { ImportCandidates } from '../schema';
import { useSelection, type UseSelectionResult, type SelectionTabType } from './useSelection';

export type ImportTabType = SelectionTabType;

/**
 * useImportSelectionのProps型定義
 */
export interface UseImportSelectionProps {
  /** インポート候補データ */
  candidates: ImportCandidates;
  /** 既存の環境名セット（重複チェック用） */
  existingProfileNames: Set<string>;
  /** 既存の変数名セット（重複チェック用） */
  existingVariableNames: Set<string>;
  /** 既存のカテゴリ名セット（重複チェック用） */
  existingCategoryNames: Set<string>;
  /** モーダルが開いているかどうか（初期化トリガー） */
  isOpen?: boolean;
}

/**
 * useImportSelectionの戻り値型定義（UseSelectionResultのエイリアス）
 */
export type UseImportSelectionResult = UseSelectionResult;

/**
 * インポート選択UI状態管理Hook
 *
 * useSelection の重複チェック有効版ラッパー。
 *
 * @param props - フックのプロパティ
 * @returns 選択状態と操作関数を含むオブジェクト
 */
export function useImportSelection({
  candidates,
  existingProfileNames,
  existingVariableNames,
  existingCategoryNames,
  isOpen,
}: UseImportSelectionProps): UseImportSelectionResult {
  return useSelection({
    candidates,
    existingProfileNames,
    existingVariableNames,
    existingCategoryNames,
    isOpen,
    enableDuplicateCheck: true,
  });
}
