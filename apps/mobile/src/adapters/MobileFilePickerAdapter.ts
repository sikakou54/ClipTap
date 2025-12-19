/**
 * Mobile用ファイル選択アダプター
 *
 * @description
 * expo-document-pickerをラップして、共通FilePickerAdapterインターフェースを実装。
 *
 * @module MobileFilePickerAdapter
 */

import * as DocumentPicker from 'expo-document-picker';
import type { FilePickerAdapter, FilePickOptions, FilePickResult } from '@cliptap/shared';
import { Logger } from '@cliptap/shared';

export class MobileFilePickerAdapter implements FilePickerAdapter {
  async pickFile(options?: FilePickOptions): Promise<FilePickResult | null> {
    try {
      const type = options?.mimeTypes?.length ? options.mimeTypes : '*/*';

      /* Mobile: iOS/Androidのネイティブドキュメントピッカーを表示 */
      /* copyToCacheDirectory: アプリのキャッシュディレクトリに自動コピー */
      const result = await DocumentPicker.getDocumentAsync({
        type,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];

      return {
        uri: asset.uri,
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType,
      };
    } catch (error) {
      Logger.error('[MobileFilePickerAdapter] Pick failed:', error);
      throw error;
    }
  }
}

