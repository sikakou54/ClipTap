/**
 * ショートカット関連の型定義
 *
 * @module types/shortcut
 */

import { z } from 'zod';

/* ==================== ShortcutValue ==================== */

/**
 * ショートカット値スキーマ
 *
 * @remarks
 * - name: 値を識別する名称（例: 母, 父）。挿入対象ではない
 * - value: 拡張キーボードから実際に挿入する文字列
 * - useCount: 拡張キーボードから挿入した回数。値単位の候補推測に使う
 * - sortOrder: 同一ショートカット内での並び順（0始まり）
 */
export const ShortcutValueSchema = z.object({
  id: z.string(),
  shortcutId: z.string(),
  name: z.string(),
  value: z.string(),
  useCount: z.number(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * ショートカット値型
 */
export type ShortcutValue = z.infer<typeof ShortcutValueSchema>;

/**
 * ショートカット値の入力スキーマ（作成・更新共通）
 *
 * @remarks
 * - idを持つ場合は既存値の更新、持たない場合は新規追加として扱う
 * - useCountとsortOrderは保存時に決まるため入力には含めない
 */
export const ShortcutValueInputSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  value: z.string(),
});

/**
 * ショートカット値の入力型
 */
export type ShortcutValueInput = z.infer<typeof ShortcutValueInputSchema>;

/* ==================== Shortcut ==================== */

/**
 * ショートカットスキーマ
 *
 * @remarks
 * - name: ショートカット名（重複不可）。複数の値をまとめるグループ名
 * - values: 1件以上のショートカット値（sortOrder順）
 * - sortOrder: 一覧での並び順（0始まり）
 */
export const ShortcutSchema = z.object({
  id: z.string(),
  name: z.string(),
  values: z.array(ShortcutValueSchema),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * ショートカット型
 */
export type Shortcut = z.infer<typeof ShortcutSchema>;

/**
 * ショートカット作成入力スキーマ
 *
 * @remarks
 * - name: 必須（重複チェックされる）
 * - values: 1件以上必須。0件では保存できない
 * - sortOrderは自動設定される
 */
export const CreateShortcutInputSchema = z.object({
  name: z.string(),
  values: z.array(ShortcutValueInputSchema),
});

/**
 * ショートカット作成入力
 */
export type CreateShortcutInput = z.infer<typeof CreateShortcutInputSchema>;

/**
 * ショートカット更新入力スキーマ
 *
 * @remarks
 * - valuesは差し替え方式。入力に含まれない既存値は削除される
 * - valuesを省略した場合は既存の値をそのまま残す
 */
export const UpdateShortcutInputSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  values: z.array(ShortcutValueInputSchema).optional(),
});

/**
 * ショートカット更新入力
 */
export type UpdateShortcutInput = z.infer<typeof UpdateShortcutInputSchema>;

/* ==================== 復元用の行型 ==================== */

/**
 * ショートカットの行スキーマ（値を含まないテーブル1行）
 *
 * @remarks
 * 全復元はバックアップの識別子と日時を逐語で書き戻すため、
 * 値をぶら下げた`Shortcut`ではなくテーブルの行そのものを扱う。
 */
export const ShortcutRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * ショートカットの行型
 */
export type ShortcutRow = z.infer<typeof ShortcutRowSchema>;
