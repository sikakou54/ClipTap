/**
 * 共通翻訳フック
 *
 * @description
 * I18nAdapterを使用してプラットフォーム固有のi18n実装を抽象化した翻訳フック。
 * Web/Mobile両方で共通利用可能。
 *
 * 注意: このフックはI18nAdapterを使用しますが、Reactコンポーネント内での使用を想定しています。
 * プラットフォーム固有のreact-i18nextのuseTranslationも引き続き使用可能です。
 *
 * @module useTranslation
 */

import { useMemo, useState, useEffect } from 'react';
import { hasI18nAdapter, getI18nAdapter } from '../adapters/I18nAdapter';
import { hasLocaleAdapter, getLocaleAdapter } from '../adapters/LocaleAdapter';

/**
 * 翻訳関数の型定義
 * i18nextの補間パラメータ（オブジェクト）を受け取れるように拡張
 */
export type TranslationFunction = (
  key: string,
  options?: string | { defaultValue?: string; [key: string]: unknown }
) => string;

/**
 * useTranslationフックの戻り値
 */
export interface UseTranslationReturn {
  /** 翻訳関数 */
  t: TranslationFunction;
  /** 現在の言語コード */
  language: string;
}

/**
 * 初期言語を取得するヘルパー関数
 */
function getInitialLanguage(hasI18n: boolean, hasLocale: boolean): string {
  if (hasI18n) {
    try {
      const i18nAdapter = getI18nAdapter();
      return i18nAdapter.getLanguage();
    } catch {
      /* エラー時は次の方法を試す */
    }
  }

  if (hasLocale) {
    try {
      const localeAdapter = getLocaleAdapter();
      return localeAdapter.getLanguage();
    } catch {
      return 'en';
    }
  }

  return 'en';
}

/**
 * 共通翻訳フック
 *
 * @description
 * I18nAdapterを使用して翻訳機能を提供します。
 * プラットフォーム固有のi18nextインスタンスを抽象化します。
 *
 * @returns 翻訳関数と現在の言語情報
 */
export function useTranslation(): UseTranslationReturn {
  const hasI18n = hasI18nAdapter();
  const hasLocale = hasLocaleAdapter();

  /* 言語状態を管理（言語変更時に再レンダリングをトリガー） */
  const [language, setLanguage] = useState(() => getInitialLanguage(hasI18n, hasLocale));

  /* 言語変更リスナーを登録 */
  useEffect(() => {
    if (!hasI18n) return undefined;

    try {
      const adapter = getI18nAdapter();
      /* onLanguageChangedが実装されている場合のみリスナーを登録 */
      if (adapter.onLanguageChanged) {
        const unsubscribe = adapter.onLanguageChanged((newLanguage) => {
          setLanguage(newLanguage);
        });
        return unsubscribe;
      }
    } catch {
      /* アダプターが未設定の場合は何もしない */
    }
    return undefined;
  }, [hasI18n]);

  const t: TranslationFunction = useMemo(() => {
    if (!hasI18n) {
      return ((key: string, options?: string | { defaultValue?: string; [key: string]: unknown }) => {
        const defaultValue = typeof options === 'string' ? options : options?.defaultValue;
        return defaultValue || key;
      }) as TranslationFunction;
    }

    /* languageを依存配列に含めることで、言語変更時にt関数が再生成される */
    return ((key: string, options?: string | { defaultValue?: string; [key: string]: unknown }) => {
      try {
        const adapter = getI18nAdapter();
        return adapter.translate(key, options);
      } catch {
        const defaultValue = typeof options === 'string' ? options : options?.defaultValue;
        return defaultValue || key;
      }
    }) as TranslationFunction;
  }, [hasI18n, language]);

  return {
    t,
    language,
  };
}

