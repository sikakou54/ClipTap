/**
 * DatabaseFileManager - Web版データベースファイルパス管理
 *
 * OPFSベースのデータベースファイルパス取得・存在チェックを担当します。
 * Mobile版と同様のインターフェースを提供し、統一性を維持します。
 *
 * Web版の特徴:
 * - OPFS (Origin Private File System) を使用
 * - パスは toOpfsPath() でプレフィックス付与
 * - FileIOAdapterへの依存注入パターンを採用
 */

import { type FileIOAdapter, Logger, toOpfsPath } from '@cliptap/shared';

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

/**
 * メインDBファイルが存在するかチェック
 */
export async function checkMainDatabaseExists(
  fileIO: FileIOAdapter
): Promise<boolean> {
  const mainDbPath = getMainDatabasePath();
  const exists = await fileIO.exists(mainDbPath);
  Logger.info(`[Main DB Check] Exists: ${exists}`);
  return exists;
}

/**
 * システムDBファイルが存在するかチェック
 */
export async function checkSystemDatabaseExists(
  fileIO: FileIOAdapter
): Promise<boolean> {
  const systemDbPath = getSystemDatabasePath();
  const exists = await fileIO.exists(systemDbPath);
  Logger.info(`[System DB Check] Exists: ${exists}`);
  return exists;
}

/**
 * データベースパスを取得（エクスポート・インポート用）
 *
 * Mobile版の getDatabasePath() と同様のインターフェースを提供します。
 */
export function getDatabasePath(): string {
  return getMainDatabasePath();
}
