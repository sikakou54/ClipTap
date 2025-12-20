/**
 * カテゴリ関連の型定義
 *
 * @module types/category
 */

import { z } from 'zod';

/* ==================== Category ==================== */

/**
 * カテゴリスキーマ
 *
 * @remarks
 * - name: カテゴリ名（重複不可）
 * - color: HEX形式（例: "#FF5733"）、nullの場合はデフォルト色
 * - sortOrder: 並び順（0始まり）、ドラッグ&ドロップで変更可能
 */
export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  sortOrder: z.number(),
  createdAt: z.string(),
});

/**
 * カテゴリ型
 */
export type Category = z.infer<typeof CategorySchema>;

/**
 * カテゴリ作成入力スキーマ
 *
 * @remarks
 * - name: 必須（重複チェックされる）
 * - color: 省略可（省略時はデフォルト色）
 * - sortOrderは自動設定される
 */
export const CreateCategoryInputSchema = z.object({
  name: z.string(),
  color: z.string().nullable().optional(),
});

/**
 * カテゴリ作成入力
 */
export type CreateCategoryInput = z.infer<typeof CreateCategoryInputSchema>;

/**
 * カテゴリ更新入力スキーマ
 *
 * @remarks
 * - 部分更新をサポート（すべてのフィールドが省略可）
 * - nameを変更する場合は重複チェックされる
 */
export const UpdateCategoryInputSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  color: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
});

/**
 * カテゴリ更新入力
 */
export type UpdateCategoryInput = z.infer<typeof UpdateCategoryInputSchema>;
