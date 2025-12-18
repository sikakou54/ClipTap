import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '../logger';

import en from '../../locales/en/translation.json';
import ja from '../../locales/ja/translation.json';

const LANGUAGE_KEY = 'app_language';

// デバイスの言語設定を取得
const getDeviceLanguage = (): string => {
  const locale = Localization.getLocales()[0];
  const languageCode = locale?.languageCode || 'en';

  // サポートされている言語のみ返す
  return ['ja', 'en'].includes(languageCode) ? languageCode : 'en';
};

// 保存された言語設定を取得
const getSavedLanguage = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch (error) {
    Logger.error('Failed to get saved language:', error);
    return null;
  }
};

// 言語設定を保存
export const saveLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    Logger.error('Failed to save language:', error);
  }
};

// i18nextの初期化
export const initI18n = async (): Promise<void> => {
  const savedLanguage = await getSavedLanguage();
  const initialLanguage = savedLanguage || getDeviceLanguage();

  await i18next.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ja: { translation: ja },
    },
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
};

// 言語を変更
export const changeLanguage = async (language: string): Promise<void> => {
  await i18next.changeLanguage(language);
  await saveLanguage(language);
};

export default i18next;
