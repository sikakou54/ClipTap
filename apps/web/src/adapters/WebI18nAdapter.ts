/**
 * Web用i18nアダプター
 *
 * @description
 * i18nextの翻訳機能をラップして、共通I18nAdapterインターフェースを実装。
 *
 * @module WebI18nAdapter
 */

import type { I18nAdapter, LanguageChangeListener } from '@cliptap/shared';
import i18n from '@src/i18n';

/**
 * Web用I18nAdapter実装クラス
 * i18nextを使用して翻訳機能を提供する
 */
export class WebI18nAdapter implements I18nAdapter {
  /**
   * 翻訳キーを翻訳して返す
   *
   * @param key - i18n翻訳キー（例: 'error.incorrect_password'）
   * @param defaultValue - 翻訳が見つからない場合のデフォルト値
   * @returns 翻訳された文字列
   */
  translate(key: string, options?: string | { defaultValue?: string; [key: string]: unknown }): string {
    /* i18nextのt関数を使用して翻訳 */
    if (typeof options === 'string') {
      /* オプションが文字列の場合はdefaultValueとして扱う */
      return i18n.t(key, { defaultValue: options || key });
    }
    /* オプションがオブジェクトの場合は、そのままi18nextに渡す */
    return i18n.t(key, options || { defaultValue: key });
  }

  /**
   * 現在の言語コードを取得
   *
   * @returns 言語コード（例: 'ja', 'en'）。設定されていない場合は 'en' を返す
   */
  getLanguage(): string {
    /* i18nextから現在の言語を取得、未設定の場合は 'en' をデフォルトとする */
    return i18n.language || 'en';
  }

  /**
   * 言語を変更
   * @param language - 変更先の言語コード（例: 'ja', 'en'）
   * @returns Promise<void>
   */
  async changeLanguage(language: string): Promise<void> {
    /* i18nextの言語変更（LocalStorageへの保存は自動的に行われる） */
    await i18n.changeLanguage(language);
  }

  /**
   * 言語変更リスナーを登録
   *
   * @param listener - 言語変更時に呼び出されるコールバック
   * @returns リスナー解除用の関数
   */
  onLanguageChanged(listener: LanguageChangeListener): () => void {
    /* i18nextのlanguageChangedイベントをリッスン */
    const handler = (lng: string) => {
      listener(lng);
    };
    i18n.on('languageChanged', handler);

    /* リスナー解除用の関数を返す */
    return () => {
      i18n.off('languageChanged', handler);
    };
  }
}

