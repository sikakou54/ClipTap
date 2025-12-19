/**
 * Mobile用i18nアダプター
 *
 * @description
 * i18nextの翻訳機能をラップして、共通I18nAdapterインターフェースを実装。
 *
 * @module MobileI18nAdapter
 */

import type { I18nAdapter } from '@cliptap/shared';
import i18next from '@i18n/config';

export class MobileI18nAdapter implements I18nAdapter {
  translate(key: string, options?: string | { defaultValue?: string; [key: string]: unknown }): string {
    if (typeof options === 'string') {
      return i18next.t(key, { defaultValue: options || key });
    }
    return i18next.t(key, options || { defaultValue: key });
  }

  getLanguage(): string {
    return i18next.language || 'en';
  }

  /**
   * 言語を変更
   *
   * @description
   * Mobile: 端末の言語設定に依存するため、空実装
   * （将来的にアプリ内言語切り替えを追加する場合はここに実装）
   */
  async changeLanguage(_language: string): Promise<void> {
    /* No-op */
  }
}

