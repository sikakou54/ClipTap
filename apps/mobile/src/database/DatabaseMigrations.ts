/**
 * DatabaseMigrations - データベースマイグレーション
 *
 * 古いバージョンのデータベースを新しい構造に変換します。
 * マイグレーション関数は全てshared層で管理されています。
 *
 * バージョン履歴:
 * - V1 → V2: タグ機能削除、プロファイル機能追加
 * - V2 → V3: copyWithTitleカラム追加
 * - V3 → V4: 共有コンテナへのDB移行（キーボード拡張対応）
 * - V4 → V5: variables, profilesテーブルにsortOrderカラム追加
 */

import {
  getSchemaVersionFromDb,
  runMigrations,
} from '@cliptap/shared';

/* getSchemaVersionFromDb, runMigrations を再エクスポート（database.tsから使用） */
export { getSchemaVersionFromDb, runMigrations };
