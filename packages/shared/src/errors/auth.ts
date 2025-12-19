/**
 * 認証・課金関連エラー
 */

import { ClipTapError } from './base';

/**
 * 認証エラー
 *
 * Firebase Authenticationでの認証に失敗した場合にスローされます。
 */
export class AuthenticationError extends ClipTapError {
  constructor(message: string = 'Authentication failed', cause?: unknown) {
    super(message, 'error.authentication', 'error', cause);
    this.name = 'AuthenticationError';
  }
}

/**
 * 課金エラー
 *
 * RevenueCatでの課金処理に失敗した場合にスローされます。
 */
export class PurchaseError extends ClipTapError {
  constructor(message: string = 'Purchase operation failed', cause?: unknown) {
    super(message, 'error.purchase', 'error', cause);
    this.name = 'PurchaseError';
  }
}
