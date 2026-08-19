/**
 * @module Logger
 * @description
 * 構造化されたログシステム（共通版）
 *
 * このモジュールはアプリ全体で使用される統一的なロギング機能を提供します。
 * 開発環境と本番環境で適切なログレベルのフィルタリングを行います。
 *
 * ログレベル:
 * - debug: 開発環境のみ出力（詳細なデバッグ情報）
 * - info: 開発環境のみ出力（一般的な情報）
 * - warn: 全環境で出力（本番では追加引数を除外）
 * - error: 全環境で出力（本番では追加引数を除外）
 * - success: 開発環境のみ出力（成功通知）
 *
 * 使用箇所:
 * - データベース操作のログ
 * - API通信のログ
 * - エラーハンドリング
 * - デバッグ情報の出力
 */

/* ======================================== */
/* 設定 */
/* ======================================== */

interface LoggerConfig {
  /** 開発環境かどうか（デバッグログの表示制御に使用） */
  isDevelopment: boolean;
  /** エモジを使用するかどうか（デフォルト: true） */
  useEmoji?: boolean;
}

let config: LoggerConfig = {
  isDevelopment: false,
  useEmoji: true,
};

/**
 * ロガーを初期化
 *
 * アプリ起動時に一度だけ呼び出してください。
 * 環境に応じた設定を注入します。
 *
 * @param options - ロガー設定
 */
export function initializeLogger(options: LoggerConfig): void {
  config = {
    ...options,
    useEmoji: options.useEmoji ?? true,
  };
}

/* ======================================== */
/* プレフィックス */
/* ======================================== */

function getPrefix(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS'): string {
  if (!config.useEmoji) {
    return `[${level}] `;
  }

  switch (level) {
    case 'DEBUG':
      return '🔍 [DEBUG] ';
    case 'INFO':
      return 'ℹ️  [INFO] ';
    case 'WARN':
      return '⚠️  [WARN] ';
    case 'ERROR':
      return '❌ [ERROR] ';
    case 'SUCCESS':
      return '✅ [SUCCESS] ';
  }
}

/* ======================================== */
/* ロガークラス */
/* ======================================== */

/**
 * ロガークラス
 *
 * 構造化されたログシステムを提供するユーティリティクラス。
 * カテゴリ別のログ出力と開発/本番環境の適切なフィルタリングを行います。
 *
 * 全メソッドは静的メソッドとして実装されており、
 * インスタンス化せずに使用できます。
 */
export class Logger {
  /**
   * デバッグログを出力
   *
   * 開発環境でのみ出力される詳細なデバッグ情報。
   * 本番環境では出力されません。
   *
   * @param message - ログメッセージ
   * @param args - 追加の引数（オブジェクト、配列など）
   */
  static debug(message: string, ...args: unknown[]): void {
    if (config.isDevelopment) {
      console.log(getPrefix('DEBUG') + message, ...args);
    }
  }

  /**
   * 情報ログを出力
   *
   * 開発環境でのみ出力される一般的な情報メッセージ。
   * アプリの状態変化や重要なイベントの記録に使用します。
   *
   * @param message - ログメッセージ
   * @param args - 追加の引数
   */
  static info(message: string, ...args: unknown[]): void {
    if (config.isDevelopment) {
      console.log(getPrefix('INFO') + message, ...args);
    }
  }

  /**
   * 警告ログを出力
   *
   * 全環境で出力される警告メッセージ。
   * 問題が発生する可能性があるが、処理は続行できる状況に使用します。
   *
   * @param message - ログメッセージ
   * @param args - 追加の引数
   */
  static warn(message: string, ...args: unknown[]): void {
    console.warn(getPrefix('WARN') + message, ...(config.isDevelopment ? args : []));
  }

  /**
   * エラーログを出力
   *
   * 全環境で出力されるエラーメッセージ。
   * 処理が失敗した場合やキャッチした例外の記録に使用します。
   *
   * @param message - ログメッセージ
   * @param args - 追加の引数（通常はErrorオブジェクト）
   */
  static error(message: string, ...args: unknown[]): void {
    console.error(getPrefix('ERROR') + message, ...(config.isDevelopment ? args : []));
  }

  /**
   * 成功ログを出力
   *
   * 開発環境でのみ出力される成功通知。
   * 処理が正常に完了したことの確認に使用します。
   *
   * @param message - ログメッセージ
   * @param args - 追加の引数
   */
  static success(message: string, ...args: unknown[]): void {
    if (config.isDevelopment) {
      console.info(getPrefix('SUCCESS') + message, ...args);
    }
  }
}
