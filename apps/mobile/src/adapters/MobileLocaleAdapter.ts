/**
 * Mobile用ロケールアダプター
 *
 * @description
 * i18nextの言語設定をラップして、共通LocaleAdapterインターフェースを実装。
 *
 * @module MobileLocaleAdapter
 */

import type { LocaleAdapter } from '@cliptap/shared';
import i18next from '@i18n/config';

export class MobileLocaleAdapter implements LocaleAdapter {
  getLanguage(): string {
    return i18next.language || 'en';
  }
}

