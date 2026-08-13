/**
 * Web初回ファイル読込サービス
 *
 * @description
 * 検証と最新スキーマへの移行を一時DB上で完了させ、その結果だけをメインDBへ昇格する。
 * プラットフォーム操作はすべて依存として受け取り、単体テストできる形にしている。
 *
 * @module InitialImportService
 */

/** Web初回読込で使用する依存関係 */
export interface InitialImportDependencies {
  /** 検証と最新スキーマへの移行を一時DB上で完了し、一時DBのパスを返す */
  prepareDatabase: (password: string, sourcePath: string) => Promise<string>;
  /** 移行済み一時DBのバイト列を読み込む */
  readPreparedDatabase: (tempDbPath: string) => Promise<Uint8Array>;
  /** 差し替え中のdebounceキャッシュ保存を止める。戻り値で停止を解除する */
  suspendAutoSave: () => Promise<() => void>;
  /** 移行済みバイト列をメインDBとして開き、システムDBを開き直す */
  openDatabase: (dbBytes: Uint8Array) => Promise<void>;
  /** 標準・アクティブの補完、有効フラグ再計算、版記録を行う */
  finalizeDatabase: () => Promise<void>;
  /** 確定済みメイン・システムDBを再開用キャッシュへ保存する */
  persistDatabase: () => Promise<void>;
  /** 昇格に失敗したDBを破棄し、読込前の未読込状態へ戻す */
  resetDatabase: () => Promise<void>;
  /** 使用済み一時DBを削除する */
  cleanupDatabase: (tempDbPath: string) => Promise<void>;
}

/**
 * 検証・移行を完了した一時DBだけをWebのメインDBへ反映する
 *
 * @param password - エクスポート時に設定されたパスワード
 * @param sourcePath - 読み込む`.cliptap`の一時保存パス
 * @param dependencies - プラットフォーム操作の依存
 *
 * @remarks
 * prepareDatabaseが完了するまではopenDatabaseを呼ばないため、
 * 旧スキーマや移行途中のDBでワークスペースを開くことがない。
 * 昇格開始からpersistDatabaseまでの失敗はresetDatabaseで未読込状態へ戻す。
 * この区間はキャッシュへ書き込まないため、復元対象の利用者データは存在しない。
 */
export async function loadInitialImportDatabase(
  password: string,
  sourcePath: string,
  dependencies: InitialImportDependencies
): Promise<void> {
  const tempDbPath = await dependencies.prepareDatabase(password, sourcePath);

  try {
    const preparedDbBytes = await dependencies.readPreparedDatabase(tempDbPath);
    const resumeAutoSave = await dependencies.suspendAutoSave();

    try {
      await dependencies.openDatabase(preparedDbBytes);
      await dependencies.finalizeDatabase();
      /** キャッシュ保存の成功をもって読込確定とする */
      await dependencies.persistDatabase();
    } catch (error) {
      try {
        await dependencies.resetDatabase();
      } catch {
        /** 巻き戻しの失敗で、読込が失敗した本来の原因を置き換えない */
      }
      throw error;
    } finally {
      resumeAutoSave();
    }
  } finally {
    try {
      await dependencies.cleanupDatabase(tempDbPath);
    } catch {
      /** 一時DBの削除失敗で、完了済みの読込結果や元のエラーを上書きしない */
    }
  }
}
