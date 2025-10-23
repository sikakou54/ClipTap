// Settings型定義
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'ja' | 'en';
  hapticFeedback: boolean;
  showAds: boolean;
  biometricEnabled: boolean;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  data: {
    snippets: any[];
    categories: any[];
    settings: AppSettings;
  };
}
