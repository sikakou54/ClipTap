/**
 * インポート用マッパー型定義
 *
 * @description
 * インポート機能で使用する型定義を提供する。
 *
 * @module IImportMapper
 */

/* schema.tsの型を再エクスポート（インポートプレビュー表示用） */
export type {
  ImportCandidates,
  ImportCandidateSnippet,
  ImportCandidateProfile,
  ImportCandidateVariable,
  ImportCandidateCategory,
  ImportCandidateVariableProfileValue,
} from '../schema';

/**
 * スニペット行データ（DBから取得した生データ）
 */
export interface SnippetImportRow {
  id: string;
  title: string | null;
  content: string;
  categoryId?: string | null;
  categoryName: string | null; // LEFT JOINで取得
  copyWithTitle?: number | boolean; // SQLiteでは0/1、JSではboolean
  createdAt: string;
  updatedAt: string;
}

/**
 * プロファイル行データ（DBから取得した生データ）
 */
export interface ProfileImportRow {
  id: string;
  name: string;
  isDefault: number | boolean; // SQLiteでは0/1、JSではboolean
  isActive?: number | boolean; // SQLiteでは0/1、JSではboolean
  valid?: number | boolean; // SQLiteでは0/1、JSではboolean
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * プロファイル変数（profile_variablesテーブルの行）
 */
export interface ProfileVariableRow {
  profileId: string;
  variableId: string;
  value: string;
}

/**
 * スニペット・プロファイル関連（snippet_profilesテーブルの行）
 */
export interface SnippetProfileRow {
  snippetId: string;
  profileId: string;
}
