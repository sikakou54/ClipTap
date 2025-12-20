/**
 * データベース関連エラー
 */

import { ClipTapError } from './base';

/**
 * データベースアクセスエラー
 *
 * SQLiteへのアクセスに失敗した場合にスローされます。
 * Mapper層での例外処理で使用されます。
 */
export class DatabaseError extends ClipTapError {
  constructor(message: string = 'Database access error', cause?: unknown) {
    super(message, 'error.database_access', 'error', cause);
    this.name = 'DatabaseError';
  }
}
