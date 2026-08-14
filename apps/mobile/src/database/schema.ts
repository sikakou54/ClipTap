/**
 * データベーススキーマ定義のエクスポート
 *
 * このファイルは共有パッケージ（@cliptap/shared）からスキーマ定義をre-exportします。
 * mobile/webアプリ間でスキーマ定義を共有することで、一貫性を保ちます。
 *
 * 値の正本は packages/shared/src/database/schema.ts。バージョン番号をここに再掲しない。
 *
 * 再エクスポートする内容:
 * - SCHEMA_VERSION: データベースバージョン番号
 * - CREATE_TABLES: 各テーブルのCREATE TABLE文を格納したオブジェクト
 * - CREATE_INDEXES: 各インデックスのCREATE INDEX文を格納したオブジェクト
 * - DROP_TABLES: 各テーブルのDROP TABLE文を格納したオブジェクト
 */

export {
  SCHEMA_VERSION,
  CREATE_TABLES,
  CREATE_INDEXES,
  DROP_TABLES,
} from '@cliptap/shared';

