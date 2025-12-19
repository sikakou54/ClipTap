/**
 * DatabaseFileManager - データベースファイルパス管理
 *
 * 共有コンテナDBとManageDBのファイルパス取得・存在チェックを担当します。
 *
 * 依存注入パターン:
 * すべての関数はFileIOAdapterを引数で受け取ります。
 * これにより、Adapter登録順序への暗黙的な依存を排除し、
 * テスト容易性と明示的な依存関係を実現します。
 */

import { FileIOAdapter, Logger } from '@cliptap/shared';

const APP_GROUP_IDENTIFIER = 'group.com.sikakou.cliptap';
const DB_FILE_NAME = 'cliptap.db';

/**
 * メインDBファイルパスを取得
 *
 * メインアプリとキーボード拡張機能でデータベースを共有するため、
 * 共有コンテナ内のデータベースファイルパスを取得します。
 *
 * - iOS: App Groupの共有コンテナディレクトリ
 * - Android: files/group.com.sikakou.cliptap/databases
 *
 * Web版の getMainDatabasePath() と同様の役割を果たします。
 */
export async function getMainDatabasePath(
  fileIO: FileIOAdapter
): Promise<string | null> {
  try {
    const sharedDir = await fileIO.getAppGroupDirectory(APP_GROUP_IDENTIFIER);

    if (!sharedDir) {
      Logger.error(`[Get Shared Container DB] App Group container not found: ${APP_GROUP_IDENTIFIER}`);
      return null;
    }

    const dbPath = `${sharedDir.replace(/\/$/, '')}/${DB_FILE_NAME}`;
    const dbUri = `file://${dbPath}`;

    Logger.info(`[Get Shared Container DB] Path: ${dbUri}`);
    return dbUri;
  } catch (error) {
    Logger.error('Failed to get shared container database file:', error);
    return null;
  }
}

/**
 * SystemDatabaseファイルパスを取得（Documents/SQLite内）
 *
 * user_version（スキーマバージョン）を管理するデータベースファイルパスを取得します。
 * マイグレーション時のデータ読み取り元としても使用します。
 */
export async function getSystemDatabaseFile(fileIO: FileIOAdapter): Promise<string> {
  try {
    const docDir = fileIO.getDocumentDirectory();
    const dbPath = `${docDir.replace(/\/$/, '')}/SQLite/cliptap.db`;

    Logger.info(`[Get System DB] Path: ${dbPath}`);
    return dbPath;
  } catch (error) {
    Logger.error('Failed to get system database file:', error);
    return '';
  }
}

/**
 * 共有コンテナDBファイルパスを取得（ディレクトリがなければ作成）
 *
 * 共有コンテナ内のデータベースファイルパスを返します。
 * ディレクトリが存在しない場合は自動作成します。
 */
export async function getSharedDatabaseFile(
  fileIO: FileIOAdapter
): Promise<string> {
  const sharedDir = await fileIO.getAppGroupDirectory(APP_GROUP_IDENTIFIER);

  if (!sharedDir) {
    throw new Error(`App Group container not found: ${APP_GROUP_IDENTIFIER}`);
  }

  return `${sharedDir.replace(/\/$/, '')}/${DB_FILE_NAME}`;
}

/**
 * メインDBファイルが存在するかチェック
 *
 * Web版の checkMainDatabaseExists() と同様の役割を果たします。
 */
export async function checkMainDatabaseExists(
  fileIO: FileIOAdapter
): Promise<boolean> {
  const mainDbUri = await getMainDatabasePath(fileIO);
  if (!mainDbUri) return false;

  const exists = await fileIO.exists(mainDbUri);
  Logger.info(`[Main DB Check] Exists: ${exists}`);
  return exists;
}

/**
 * SystemDatabaseファイルが存在するかチェック
 */
export async function checkSystemDatabaseExists(
  fileIO: FileIOAdapter
): Promise<boolean> {
  const systemDbUri = await getSystemDatabaseFile(fileIO);
  if (!systemDbUri) return false;

  const exists = await fileIO.exists(systemDbUri);
  Logger.info(`[System DB Check] Exists: ${exists}`);
  return exists;
}

/**
 * 共有コンテナDBファイルパスを取得（エクスポート・インポート用）
 *
 * getMainDatabasePathと異なり、エラー時に例外をスローします。
 * URI形式ではなく、ファイルシステムパスを返します。
 */
export async function getDatabasePath(fileIO: FileIOAdapter): Promise<string> {
  const sharedDir = await fileIO.getAppGroupDirectory(APP_GROUP_IDENTIFIER);

  if (!sharedDir) {
    Logger.error(`[DatabaseFileManager] App Group container not found: ${APP_GROUP_IDENTIFIER}`);
    throw new Error('App Group container not found');
  }

  return `${sharedDir.replace(/\/$/, '')}/${DB_FILE_NAME}`;
}
