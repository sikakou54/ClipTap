/**
 * スニペット関連の型定義
 *
 * @module types/snippet
 */

import { z } from 'zod';

/* ==================== Enum Types ==================== */

/**
 * スニペットの並び替え基準スキーマ
 *
 * @remarks
 * - 'created': 作成日時順（新しい順）- デフォルト
 * - 'updated': 更新日時順（新しい順）
 * - 'title': タイトル順（昇順）
 * - 'usage': 使用頻度順（コピー回数が多い順）
 */
export const SnippetSortBySchema = z.enum(['created', 'updated', 'title', 'usage']);

/**
 * スニペットの並び替え基準
 */
export type SnippetSortBy = z.infer<typeof SnippetSortBySchema>;

/* ==================== Snippet ==================== */

/**
 * スニペット（定型文）スキーマ
 *
 * @remarks
 * - title: nullの場合はcontentから自動生成
 * - content: 変数を含む場合は {{variable_name}} 形式
 * - categoryId: nullは未分類
 * - profileIds: 空または未定義の場合は全環境で利用可能
 * - copyWithTitle: コピー時にタイトルも含めるかどうか
 * - copyCount: コピー回数（使用頻度ソート用）
 */
export const SnippetSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  content: z.string(),
  categoryId: z.string().nullable(),
  profileIds: z.array(z.string()).optional(),
  copyWithTitle: z.boolean(),
  copyCount: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * スニペット型
 */
export type Snippet = z.infer<typeof SnippetSchema>;

/**
 * スニペット作成入力スキーマ
 *
 * @remarks
 * - title: 省略可（省略時はcontentから自動生成）
 * - categoryId: 省略可（省略時は未分類）
 * - profileIds: 省略可（省略時は全環境で利用可能）
 * - copyWithTitle: 省略可（省略時はfalse）
 */
export const CreateSnippetInputSchema = z.object({
  title: z.string().optional(),
  content: z.string(),
  categoryId: z.string().nullable().optional(),
  profileIds: z.array(z.string()).optional(),
  copyWithTitle: z.boolean().optional(),
});

/**
 * スニペット作成入力
 */
export type CreateSnippetInput = z.infer<typeof CreateSnippetInputSchema>;

/**
 * スニペット更新入力スキーマ
 *
 * @remarks
 * - 部分更新をサポート（すべてのフィールドが省略可）
 */
export const UpdateSnippetInputSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  profileIds: z.array(z.string()).optional(),
  copyWithTitle: z.boolean().optional(),
});

/**
 * スニペット更新入力
 */
export type UpdateSnippetInput = z.infer<typeof UpdateSnippetInputSchema>;

/**
 * 検索オプションスキーマ
 *
 * @remarks
 * - query: 検索文字列（タイトル・本文から部分一致検索）
 * - categoryId: 省略可（指定時はそのカテゴリ内のみ検索）
 * - sortBy: 省略可（指定時はその基準でソート）
 */
export const SearchOptionsSchema = z.object({
  query: z.string(),
  categoryId: z.string().optional(),
  sortBy: SnippetSortBySchema.optional(),
});

/**
 * 検索オプション
 */
export type SearchOptions = z.infer<typeof SearchOptionsSchema>;

/**
 * スニペット-プロファイル関連スキーマ
 *
 * @remarks
 * - スニペットが利用可能な環境を管理する中間テーブル
 * - 空の場合はすべての環境で利用可能
 * - 特定の環境のみで使いたいスニペットを制限可能
 */
export const SnippetProfileSchema = z.object({
  snippetId: z.string(),
  profileId: z.string(),
});

/**
 * スニペット-プロファイル関連型
 */
export type SnippetProfile = z.infer<typeof SnippetProfileSchema>;
