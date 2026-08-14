/**
 * プロファイル（環境）関連の型定義
 *
 * @module types/profile
 */

import { z } from 'zod';

/* ==================== Profile ==================== */

/**
 * プロファイル（環境）スキーマ
 *
 * @remarks
 * - name: 環境名（例: 開発、本番、テスト）
 * - isActive: アクティブな環境（同時に1つのみtrue）
 * - isDefault: デフォルト環境（初回起動時やリセット時に選択）
 * - valid: 有効な環境（無料プランは3つまで、Proは無制限）
 */
export const ProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  isDefault: z.boolean(),
  valid: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * プロファイル型
 */
export type Profile = z.infer<typeof ProfileSchema>;

/**
 * プロファイル作成入力スキーマ
 *
 * @remarks
 * - その他のフィールドは自動設定される
 */
export const CreateProfileInputSchema = z.object({
  name: z.string(),
  sortOrder: z.number().optional(),
});

/**
 * プロファイル作成入力
 */
export type CreateProfileInput = z.infer<typeof CreateProfileInputSchema>;

/**
 * プロファイル更新入力スキーマ
 *
 * @remarks
 * - 部分更新をサポート（すべてのフィールドが省略可）
 * - isDefaultとvalidは自動管理されるため含まない
 */
export const UpdateProfileInputSchema = z.object({
  name: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

/**
 * プロファイル更新入力
 */
export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;

/**
 * プロファイル変数値スキーマ
 *
 * @remarks
 * - 環境ごとのカスタム変数値を管理
 * - 1つの変数に対して、各環境ごとに異なる値を設定可能
 * - 例: 変数{{name}}に対して、開発環境「テスト太郎」、本番環境「佐々木」
 */
export const ProfileVariableSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  variableId: z.string(),
  value: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * プロファイル変数値型
 */
export type ProfileVariable = z.infer<typeof ProfileVariableSchema>;

/**
 * プロファイル変数値作成入力スキーマ
 *
 * @remarks
 * - idとタイムスタンプは自動生成される
 */
export const CreateProfileVariableInputSchema = z.object({
  profileId: z.string(),
  variableId: z.string(),
  value: z.string(),
});

/**
 * プロファイル変数値作成入力
 */
export type CreateProfileVariableInput = z.infer<typeof CreateProfileVariableInputSchema>;


