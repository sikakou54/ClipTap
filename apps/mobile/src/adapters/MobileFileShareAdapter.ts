/**
 * Mobile用ファイル共有アダプター
 *
 * @description
 * expo-sharingをラップして、共通FileShareAdapterインターフェースを実装。
 *
 * @module MobileFileShareAdapter
 */

import * as Sharing from 'expo-sharing';
import type { FileShareAdapter } from '@cliptap/shared';
import { Logger } from '@cliptap/shared';

export class MobileFileShareAdapter implements FileShareAdapter {
  async shareFile(uri: string, filename?: string): Promise<void> {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Sharing is not available');
      }
      /* iOS/Androidのシステム共有シート（Share Sheet）を表示 */
      await Sharing.shareAsync(uri, {
        mimeType: 'application/octet-stream',
        dialogTitle: filename,
      });
    } catch (error) {
      Logger.error('[MobileFileShareAdapter] Share failed:', error);
      throw error;
    }
  }
}

