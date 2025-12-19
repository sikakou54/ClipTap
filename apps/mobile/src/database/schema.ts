/**
 * データベーススキーマ定義のエクスポート
 *
 * このファイルは共有パッケージ（@cliptap/shared）からスキーマ定義をre-exportします。
 * mobile/webアプリ間でスキーマ定義を共有することで、一貫性を保ちます。
 */

/* 現在のデータベーススキーマバージョン（V4） */
export {
  SCHEMA_VERSION,        // データベースバージョン番号（現在は4）
  CREATE_TABLES,         // 各テーブルのCREATE TABLE文を格納したオブジェクト
  CREATE_INDEXES,        // 各インデックスのCREATE INDEX文を格納したオブジェクト
  DROP_TABLES,           // 各テーブルのDROP TABLE文を格納したオブジェクト
} from '@cliptap/shared';

