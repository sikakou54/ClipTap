/**
 * DatabaseMigrations - Web版データベースマイグレーション
 *
 * スキーマバージョン管理とマイグレーション処理を提供します。
 * Mobile版と同様に mainDB + systemDB で動作します。
 * バージョンは systemDB の PRAGMA user_version で管理します。
 *
 * バージョン履歴:
 * - V4: 初期サポートバージョン（Web版はV4以降のみサポート）
 * - V5: variables, profilesテーブルにsortOrderカラム追加
 */

import {
  getSchemaVersionFromDb,
  runMigrations,
} from '@cliptap/shared';

/* getSchemaVersionFromDb, runMigrations を再エクスポート（database.tsから使用） */
export { getSchemaVersionFromDb, runMigrations };


