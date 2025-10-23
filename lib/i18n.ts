/**
 * 多言語対応システム（i18n）
 * React Native + Expo環境での国際化対応
 */

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { Logger } from './logger';

// 翻訳リソースのインポート
import translationJA from '../locales/ja/translation.json';
import translationEN from '../locales/en/translation.json';

// サポート言語の定義
export const SUPPORTED_LANGUAGES = {
  ja: {
    name: 'Japanese',
    nativeName: '日本語',
    code: 'ja'
  },
  en: {
    name: 'English',
    nativeName: 'English',
    code: 'en'
  }
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// 翻訳リソース
const resources = {
  ja: {
    translation: translationJA,
  },
  en: {
    translation: translationEN,
  },
};

// 端末言語に基づいて言語を決定
const getDeviceLanguage = (): SupportedLanguage => {
  return isJapaneseDevice() ? 'ja' : 'en';
};

// 端末言語が日本語かどうかチェック
const isJapaneseDevice = (): boolean => {
  const deviceLocale = Localization.getLocales()[0]?.languageCode || '';
  return deviceLocale.startsWith('ja');
};

// 現在の言語を取得
export const getCurrentLanguage = (): SupportedLanguage => {
  return i18next.language as SupportedLanguage || 'ja';
};

// i18next初期化
const initI18n = async () => {
  const deviceLanguage = getDeviceLanguage();

  await i18next
    .use(initReactI18next)
    .init({
      resources,
      lng: deviceLanguage,
      fallbackLng: 'en',

      interpolation: {
        escapeValue: false,
      },

      react: {
        useSuspense: false,
      },

      debug: __DEV__,
    });

  Logger.debug(`🌐 i18n initialized with device language: ${deviceLanguage}`);
};

export default initI18n;
