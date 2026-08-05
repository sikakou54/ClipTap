/**
 * 変数関連の型定義（Zodスキーマ）
 *
 * @module types/variableSchema
 */

import { z } from 'zod';

/* ==================== Enum Types ==================== */

/**
 * 変数の種類スキーマ
 *
 * @remarks
 * - 'system': システム変数（{{today}}, {{time}}等） - アプリ組み込み、削除不可
 * - 'custom': カスタム変数（{{name}}, {{email}}等） - ユーザー作成、編集・削除可能
 */
export const VariableTypeSchema = z.enum(['system', 'custom']);


/* ==================== Variable ==================== */

/**
 * 変数スキーマ
 *
 * @remarks
 * - name: 変数名（{{name}}の"name"部分）
 * - type: 変数の種類（'system' | 'custom'）
 * - label: 表示用ラベル（nullの場合はnameを使用）
 * - icon: アイコン名（nullの場合はデフォルトアイコン）
 * - valid: 有効な変数かどうか（無料プランはカスタム変数5個まで、Proは無制限）
 */
export const VariableSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: VariableTypeSchema,
  label: z.string().nullable(),
  icon: z.string().nullable(),
  valid: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * 変数型
 */
export type Variable = z.infer<typeof VariableSchema>;

/**
 * 変数作成入力スキーマ
 *
 * @remarks
 * - name: 必須（重複チェックされる）
 * - type: 省略可（省略時は'custom'）
 * - label: 省略可（省略時はnameを使用）
 * - icon: 省略可（省略時はデフォルトアイコン）
 */
export const CreateVariableInputSchema = z.object({
  name: z.string(),
  type: VariableTypeSchema.optional(),
  label: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().optional(),
});

/**
 * 変数作成入力
 */
export type CreateVariableInput = z.infer<typeof CreateVariableInputSchema>;

/**
 * 変数更新入力スキーマ
 *
 * @remarks
 * - 部分更新をサポート（すべてのフィールドが省略可）
 * - nameを変更する場合は重複チェックされる
 * - typeは変更不可（システム変数の保護）
 */
export const UpdateVariableInputSchema = z.object({
  name: z.string().optional(),
  label: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
});

/**
 * 変数更新入力
 */
export type UpdateVariableInput = z.infer<typeof UpdateVariableInputSchema>;
