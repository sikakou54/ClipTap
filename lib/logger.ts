// 開発環境判定
const isDevelopment = (typeof __DEV__ !== 'undefined' ? __DEV__ : false) || process.env.NODE_ENV === 'development';

/**
 * ロガークラス - 構造化されたログシステム
 * カテゴリ別のログ出力と開発/本番環境の適切なフィルタリングを提供
 */
export class Logger {
  /**
   * デバッグログ - 開発環境でのみ出力される詳細なデバッグ情報
   */
  static debug(message: string, ...args: any[]) {
    if (isDevelopment) {
      console.log('🔍 [DEBUG] ' + message, ...args);
    }
  }

  /**
   * 情報ログ - 全環境で出力される一般的な情報メッセージ
   */
  static info(message: string, ...args: any[]) {
    console.log('ℹ️  [INFO] ' + message, ...args);
  }

  /**
   * 警告ログ - 全環境で出力される警告メッセージ
   */
  static warn(message: string, ...args: any[]) {
    console.warn('⚠️  [WARN] ' + message, ...args);
  }

  /**
   * エラーログ - 全環境で出力されるエラーメッセージ
   */
  static error(message: string, ...args: any[]) {
    console.error('❌ [ERROR] ' + message, ...args);
  }

  /**
   * 成功ログ - 開発環境でのみ出力される成功通知
   */
  static success(message: string, ...args: any[]) {
    if (isDevelopment) {
      console.log('✅ [SUCCESS] ' + message, ...args);
    }
  }
}
