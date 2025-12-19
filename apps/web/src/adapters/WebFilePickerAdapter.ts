/**
 * Web用ファイル選択アダプター
 *
 * @description
 * ブラウザのinput[type="file"]をラップして、共通FilePickerAdapterインターフェースを実装。
 *
 * @module WebFilePickerAdapter
 */

import type { FilePickerAdapter, FilePickOptions, FilePickResult } from '@cliptap/shared';

/**
 * Web用FilePickerAdapter実装クラス
 */
export class WebFilePickerAdapter implements FilePickerAdapter {
  /**
   * ファイル選択ダイアログを表示
   *
   * @param options - ファイル選択オプション
   * @returns 選択されたファイルの情報、キャンセル時はnull
   */
  async pickFile(options?: FilePickOptions): Promise<FilePickResult | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';

      /* 許可する拡張子/MIMEタイプを設定 */
      if (options?.extensions?.length) {
        input.accept = options.extensions.join(',');
      } else if (options?.mimeTypes?.length) {
        input.accept = options.mimeTypes.join(',');
      }

      /* ファイル選択時のイベントハンドラ */
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];

        if (!file) {
          resolve(null);
          return;
        }

        const url = URL.createObjectURL(file);

        resolve({
          uri: url,
          name: file.name,
          size: file.size,
          mimeType: file.type,
        });
      };

      input.click();
    });
  }
}
