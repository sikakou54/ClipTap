/**
 * Web用ファイル共有アダプター
 *
 * @description
 * ブラウザのダウンロード機能をラップして、共通FileShareAdapterインターフェースを実装。
 *
 * @module WebFileShareAdapter
 */

import type { FileShareAdapter } from '@cliptap/shared';
import { Logger } from '@cliptap/shared';

/**
 * Web用FileShareAdapter実装クラス
 */
export class WebFileShareAdapter implements FileShareAdapter {
  /**
   * ファイルを共有（ダウンロード）
   *
   * @param uri - ダウンロードするファイルのBlob URL
   * @param filename - ダウンロード時のファイル名（省略時は 'download'）
   */
  async shareFile(uri: string, filename?: string): Promise<void> {
    try {
      const a = document.createElement('a');
      a.href = uri;
      a.download = filename ?? 'download';
      a.click();
    } catch (error) {
      Logger.error('[WebFileShareAdapter] Share (Download) failed:', error);
      throw error;
    }
  }
}
