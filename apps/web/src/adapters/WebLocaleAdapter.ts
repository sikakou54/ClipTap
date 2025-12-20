/**
 * Web用ロケールアダプター
 *
 * @description
 * i18nextの言語設定をラップして、共通LocaleAdapterインターフェースを実装。
 *
 * @module WebLocaleAdapter
 */

import type { LocaleAdapter } from '@cliptap/shared';
import i18n from '@src/i18n';

/**
 * Web用LocaleAdapter実装クラス
 * i18nextを使用して現在の言語設定を取得する
 */
export class WebLocaleAdapter implements LocaleAdapter {
  /**
   * 現在の言語コードを取得
   * @returns 言語コード（例: 'ja', 'en'）。設定されていない場合は 'en' を返す
   */
  getLanguage(): string {
    /* i18nextから現在の言語を取得、未設定の場合は 'en' をデフォルトとする */
    return i18n.language || 'en';
  }
}
