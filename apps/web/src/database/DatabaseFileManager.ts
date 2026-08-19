/**
 * DatabaseFileManager - Web版データベースファイルパス管理
 *
 * OPFSベースのデータベースファイルパスの決定だけを担当します。
 *
 * Web版の特徴:
 * - OPFS (Origin Private File System) を使用
 * - パスは toOpfsPath() でプレフィックス付与
 */

import { toOpfsPath } from '@cliptap/shared';

/** メインDBのファイル名 */
const MAIN_DB_FILE_NAME = 'main.db';
/** システムDBのファイル名（user_version管理用） */
const SYSTEM_DB_FILE_NAME = 'system.db';

/**
 * メインDBファイルパスを取得（OPFSパス）
 *
 * アプリのメインデータを格納するデータベースファイルパスを返します。
 */
export function getMainDatabasePath(): string {
  return toOpfsPath(MAIN_DB_FILE_NAME);
}

/**
 * システムDBファイルパスを取得（OPFSパス）
 *
 * user_version（スキーマバージョン）を管理するデータベースファイルパスを返します。
 */
export function getSystemDatabasePath(): string {
  return toOpfsPath(SYSTEM_DB_FILE_NAME);
}
