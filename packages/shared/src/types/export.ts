/**
 * エクスポート/インポート関連の型定義
 *
 * @module types/export
 */

import { z } from 'zod';

/* ==================== Import Candidates ==================== */

/**
 * インポート候補スニペットのプロファイル紐付きスキーマ
 *
 * @remarks
 * - インポート画面でスニペットに紐付く環境情報を表示
 * - profileNameがnullの場合はIDから取得
 */
const ImportCandidateSnippetProfileSchema = z.object({
  profileId: z.string(),
  profileName: z.string().nullable(),
});

/**
 * インポート候補スニペットのプロファイル紐付き型
 */
export type ImportCandidateSnippetProfile = z.infer<typeof ImportCandidateSnippetProfileSchema>;

/**
 * インポート候補スニペットスキーマ
 *
 * @remarks
 * - インポート画面でプレビュー表示用
 * - categoryNameはIDではなく名前を保持（プレビュー表示用）
 * - profilesが空の場合は全プロファイルで利用可能
 */
const ImportCandidateSnippetSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  content: z.string(),
  categoryName: z.string().nullable(),
  profiles: z.array(ImportCandidateSnippetProfileSchema),
  updatedAt: z.string(),
});

/**
 * インポート候補スニペット型
 */
export type ImportCandidateSnippet = z.infer<typeof ImportCandidateSnippetSchema>;

/**
 * インポート候補プロファイルスキーマ
 *
 * @remarks
 * - インポート画面でプレビュー表示用
 * - isDefaultはUI表示でバッジ表示に使用
 */
const ImportCandidateProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  isDefault: z.boolean(),
  sortOrder: z.number().optional(),
  updatedAt: z.string(),
});

/**
 * インポート候補プロファイル型
 */
export type ImportCandidateProfile = z.infer<typeof ImportCandidateProfileSchema>;

/**
 * インポート候補変数値スキーマ
 *
 * @remarks
 * - 変数に紐付く環境ごとの値をプレビュー表示
 * - profileNameがnullの場合はIDから取得
 */
const ImportCandidateVariableProfileValueSchema = z.object({
  profileId: z.string(),
  profileName: z.string().nullable(),
  value: z.string(),
});

/**
 * インポート候補変数値型
 */
export type ImportCandidateVariableProfileValue = z.infer<typeof ImportCandidateVariableProfileValueSchema>;

/**
 * インポート候補変数スキーマ
 *
 * @remarks
 * - 変数とその環境ごとの値をまとめてプレビュー表示
 * - labelがnullの場合はnameを使用
 * - iconがnullの場合はデフォルトアイコン
 */
const ImportCandidateVariableSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string().nullable(),
  icon: z.string().nullable(),
  type: z.string().optional(),
  valid: z.number().optional(),
  sortOrder: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string(),
  profileValues: z.array(ImportCandidateVariableProfileValueSchema),
});

/**
 * インポート候補変数型
 */
export type ImportCandidateVariable = z.infer<typeof ImportCandidateVariableSchema>;

/**
 * インポート候補カテゴリスキーマ
 *
 * @remarks
 * - インポート画面でプレビュー表示用
 * - colorがnullの場合はデフォルト色
 */
const ImportCandidateCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  sortOrder: z.number(),
  createdAt: z.string(),
});

/**
 * インポート候補カテゴリ型
 */
export type ImportCandidateCategory = z.infer<typeof ImportCandidateCategorySchema>;

/**
 * インポート候補一覧スキーマ
 *
 * @remarks
 * - すべてのインポート候補をまとめたオブジェクト
 * - インポート画面で一覧表示に使用
 */
export const ImportCandidatesSchema = z.object({
  snippets: z.array(ImportCandidateSnippetSchema),
  profiles: z.array(ImportCandidateProfileSchema),
  variables: z.array(ImportCandidateVariableSchema),
  categories: z.array(ImportCandidateCategorySchema),
});

/**
 * インポート候補一覧型
 */
export type ImportCandidates = z.infer<typeof ImportCandidatesSchema>;

/* ==================== Export Data ==================== */

/**
 * ClipTapエクスポートデータスキーマ
 *
 * @remarks
 * - .cliptapファイルの内部構造
 * - セキュリティのためフィールド名を短縮
 * - s: スキーマバージョン（互換性チェック）
 * - t: タイムスタンプ（ISO 8601）
 * - h: パスワードハッシュ（SHA-256）
 * - d: 二重Base64で符号化されたSQLiteデータ（暗号化ではない）
 * - c: チェックサム（SHA-256、改竄検知）
 */
export const ClipTapExportDataSchema = z.object({
  s: z.number().int(),
  t: z.string(),
  h: z.string(),
  d: z.string(),
  c: z.string(),
});

/**
 * ClipTapエクスポートデータ型
 */
export type ClipTapExportData = z.infer<typeof ClipTapExportDataSchema>;


/* ==================== Selection Data Types ==================== */

/**
 * プロファイル紐付きデータスキーマ（選択UI用）
 *
 * @remarks
 * - profileNameがnullの場合はIDから取得
 */
const SelectionSnippetProfileSchema = z.object({
  profileId: z.string(),
  profileName: z.string().nullable(),
});


/**
 * 選択スニペットデータスキーマ（選択UI用）
 *
 * @remarks
 * - インポート/エクスポート画面の選択UI用
 * - categoryId, categoryName, categoryColorを保持（UI表示用）
 * - categoryColorはバッジ表示用
 */
const SelectionSnippetDataSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  content: z.string(),
  categoryId: z.string().nullable(),
  categoryName: z.string().nullable(),
  categoryColor: z.string().nullable(),
  profiles: z.array(SelectionSnippetProfileSchema),
});

/**
 * 選択スニペットデータ型（選択UI用）
 */
export type SelectionSnippetData = z.infer<typeof SelectionSnippetDataSchema>;

/**
 * 選択プロファイルデータスキーマ（選択UI用）
 */
const SelectionProfileDataSchema = z.object({
  id: z.string(),
  name: z.string(),
});

/**
 * 選択プロファイルデータ型（選択UI用）
 */
export type SelectionProfileData = z.infer<typeof SelectionProfileDataSchema>;

/**
 * プロファイル別の変数値スキーマ（選択UI用）
 *
 * @remarks
 * - profileNameがnullの場合はIDから取得
 */
const SelectionVariableProfileValueSchema = z.object({
  profileId: z.string(),
  profileName: z.string().nullable(),
  value: z.string(),
});

/**
 * プロファイル別の変数値型（選択UI用）
 */
export type SelectionVariableProfileValue = z.infer<typeof SelectionVariableProfileValueSchema>;

/**
 * 選択変数データスキーマ（選択UI用）
 *
 * @remarks
 * - labelがnullの場合はnameを使用
 * - iconがnullの場合はデフォルトアイコン
 */
const SelectionVariableDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string().nullable(),
  icon: z.string().nullable(),
  profileValues: z.array(SelectionVariableProfileValueSchema),
});

/**
 * 選択変数データ型（選択UI用）
 */
export type SelectionVariableData = z.infer<typeof SelectionVariableDataSchema>;

/**
 * 選択カテゴリデータスキーマ（選択UI用）
 *
 * @remarks
 * - colorがnullの場合はデフォルト色
 */
const SelectionCategoryDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
});

/**
 * 選択カテゴリデータ型（選択UI用）
 */
export type SelectionCategoryData = z.infer<typeof SelectionCategoryDataSchema>;

/**
 * 選択候補一覧スキーマ（インポート/エクスポート共通）
 *
 * @remarks
 * - インポート/エクスポート画面の選択UI用
 * - Mobile/Web両方で使用可能
 */
export const SelectionCandidatesSchema = z.object({
  snippets: z.array(SelectionSnippetDataSchema),
  profiles: z.array(SelectionProfileDataSchema),
  variables: z.array(SelectionVariableDataSchema),
  categories: z.array(SelectionCategoryDataSchema),
});

/**
 * 選択候補一覧型（インポート/エクスポート共通）
 */
export type SelectionCandidates = z.infer<typeof SelectionCandidatesSchema>;
