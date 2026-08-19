/**
 * @module i18n/config
 * @description
 * i18next設定と言語管理
 *
 * このモジュールはi18nextの初期化機能を提供します。
 * expo-localization で端末の先頭ロケールから初期言語を決定します。
 *
 * 機能:
 * - i18nextの初期化
 * - 端末の先頭ロケールからの初期言語決定（ja / en 以外は en へフォールバック）
 * - 選択言語の永続化と手動切替は行わない
 *
 * 使用箇所:
 * - アプリ起動時の初期化（_layout.tsx）
 */

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

/* ======================================== */
/* 翻訳リソースのインポート */
/* ======================================== */

import en from '@cliptap/shared/i18n/en.json';
import ja from '@cliptap/shared/i18n/ja.json';

/* ======================================== */
/* ヘルパー関数 */
/* ======================================== */

/**
 * デバイスの言語設定を取得
 *
 * Expo Localizationを使用して端末のロケール情報を取得し、
 * サポートされている言語（ja/en）のコードを返します。
 * サポート外の言語の場合はデフォルトで'en'を返します。
 *
 * @returns {string} 言語コード（'ja' または 'en'）
 */
const getDeviceLanguage = (): string => {
  const locale = Localization.getLocales()[0];
  const languageCode = locale?.languageCode || 'en';

  /* サポートされている言語のみ返す */
  return ['ja', 'en'].includes(languageCode) ? languageCode : 'en';
};

/* ======================================== */
/* 公開API */
/* ======================================== */

/**
 * i18nextを初期化
 *
 * アプリ起動時に一度だけ呼び出される初期化関数。
 * デバイスの言語設定から初期言語を決定します。
 *
 * @returns {Promise<void>}
 */
export const initI18n = async (): Promise<void> => {
  const initialLanguage = getDeviceLanguage();

  await i18next.use(initReactI18next).init({
    /* 翻訳リソース */
    resources: {
      en: { translation: en },
      ja: { translation: ja },
    },
    /* 初期言語 */
    lng: initialLanguage,
    /* フォールバック言語 */
    fallbackLng: 'en',
    /* 補間設定 */
    interpolation: {
      /* Reactでは自動エスケープされるため無効化 */
      escapeValue: false,
    },
  });
};

/**
 * i18nextインスタンスをデフォルトエクスポート
 *
 * コンポーネント外で翻訳を取得する場合に使用します。
 * 通常はuseTranslation()フックを使用してください。
 */
export default i18next;
