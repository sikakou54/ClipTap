/**
 * i18n（国際化）設定
 *
 * i18nextを使用した多言語対応の初期化設定。
 * 日本語と英語に対応し、ブラウザ設定から言語を自動検出。
 *
 * 翻訳ファイル:
 * - @cliptap/shared/i18n/ja.json: 日本語
 * - @cliptap/shared/i18n/en.json: 英語
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ja from '@cliptap/shared/i18n/ja.json';
import en from '@cliptap/shared/i18n/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en,
      },
      ja: {
        translation: ja,
      },
    },
    fallbackLng: 'ja',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      /* ブラウザの言語設定を優先、手動切り替え時のみlocalStorageに保存 */
      order: ['navigator', 'localStorage'],
      caches: ['localStorage'],
    },
  });

export default i18n;

