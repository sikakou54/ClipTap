/**
 * その他のエラー（環境）
 */

import { ClipTapError } from './base';

/**
 * 実行環境エラー
 *
 * 現在の実行環境で利用できない機能にアクセスした場合にスローされます。
 * （例: Web環境でモバイル専用機能を使用しようとした場合）
 */
export class EnvironmentError extends ClipTapError {
  /** 利用できない機能名 */
  readonly missingFeature: string;

  constructor(missingFeature: string) {
    super(
      `${missingFeature} is not available in this environment`,
      'error.environment'
    );
    this.name = 'EnvironmentError';
    this.missingFeature = missingFeature;
  }
}
