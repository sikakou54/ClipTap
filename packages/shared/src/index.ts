/* 初期化モジュール */
export {
  init,
  isInitialized,
  type SharedInitOptions,
} from './init';

/* データベース */
export * from './database/schema';
export * from './database/migrations';
export { BaseDatabaseManager, type DatabaseInitOptions } from './database/BaseDatabaseManager';

/* 型定義 */
export * from './schema';
export * from './types';

/* エラー */
export * from './errors';

/* Mappers */
export * from './mappers';

/* Adapters */
export type { SubscriptionAdapter, SubscriptionListener } from './adapters';
export type { I18nAdapter, LanguageChangeListener } from './adapters';
export type { AuthAdapter, AuthStateListener } from './adapters';

export {
  /* 一括登録（全アダプターを一度に設定） */
  setAllAdapters,
  type AllAdapters,
  type SetAllAdaptersOptions,

  /* SubscriptionAdapter関連（課金管理） */
  setSubscriptionAdapter,
  type SubscriptionAdapterOptions,

  /* CryptoAdapter関連（暗号化・ハッシュ生成） */
  type CryptoAdapter,
  setCryptoAdapter,
  getCryptoAdapter,
  hasCryptoAdapter,

  /* DbAdapter関連（データベースアクセス） */
  type DbAdapter,
  type DbRunResult,
  /* メインDB用（共有コンテナDB） */
  setMainDbAdapter,
  getMainDbAdapter,
  hasMainDbAdapter,
  /* システムDB用（user_version管理・マイグレーション用） */
  setSystemDbAdapter,
  getSystemDbAdapter,
  hasSystemDbAdapter,
  /* 一時DB用（エクスポート・インポート処理用） */
  setTempDbAdapter,
  getTempDbAdapter,
  hasTempDbAdapter,

  /* ClipboardAdapter関連（クリップボード操作） */
  type ClipboardAdapter,
  setClipboardAdapter,
  getClipboardAdapter,
  hasClipboardAdapter,

  /* FileIOAdapter関連（ファイル読み書き） */
  type FileIOAdapter,
  type FileInfo,
  setFileIOAdapter,
  getFileIOAdapter,
  hasFileIOAdapter,

  /* FileShareAdapter関連（ファイル共有/ダウンロード） */
  type FileShareAdapter,
  setFileShareAdapter,
  getFileShareAdapter,
  hasFileShareAdapter,

  /* FilePickerAdapter関連（ファイル選択） */
  type FilePickerAdapter,
  type FilePickOptions,
  type FilePickResult,
  setFilePickerAdapter,
  getFilePickerAdapter,
  hasFilePickerAdapter,

  /* LocaleAdapter関連（ロケール取得） */
  type LocaleAdapter,
  setLocaleAdapter,
  getLocaleAdapter,
  hasLocaleAdapter,

  /* I18nAdapter関連（i18n翻訳機能） */
  setI18nAdapter,
  getI18nAdapter,
  hasI18nAdapter,

  /* AuthAdapter関連（認証） */
  setAuthAdapter,
  getAuthAdapter,
  hasAuthAdapter,

  /* ExportAdapter関連（エクスポート処理） */
  type ExportAdapter,
  setExportAdapter,
  getExportAdapter,
  hasExportAdapter,

  /* ImportAdapter関連（インポート処理） */
  type ImportAdapter,
  setImportAdapter,
  getImportAdapter,
  hasImportAdapter,

  /* SortPreferenceAdapter関連（ソート設定） */
  type SortPreferenceAdapter,
  setSortPreferenceAdapter,
  getSortPreferenceAdapter,
  hasSortPreferenceAdapter,

  /* UsageTrackingAdapter関連（使用頻度追跡設定） */
  type UsageTrackingAdapter,
  setUsageTrackingAdapter,
  getUsageTrackingAdapter,
  hasUsageTrackingAdapter,
} from './adapters';

/* ======================================== */
/* Services */
/* ======================================== */
/* ビジネスロジック層のServiceクラスと関連型をエクスポート */

/* コアサービス（カテゴリ、プロファイル、スニペット、変数、課金） */
export {
  CategoryService,        /* カテゴリ管理サービス */
  ProfileService,         /* プロファイル管理サービス */
  SnippetService,         /* スニペット管理サービス */
  VariableService,        /* 変数管理サービス */
  SubscriptionService,    /* 課金管理サービス */
  FREE_PROFILES_LIMIT,    /* 無料プランのプロファイル上限 */
  FREE_VARIABLES_LIMIT,   /* 無料プランの変数上限 */
  type VariableResolverContext,       /* 変数解決コンテキスト */
  type ValidFlagsUpdater,             /* 有効フラグ更新関数型 */
  createValidFlagsUpdater,            /* ValidFlagsUpdater共通実装ファクトリ */
  ImportService,                      /* インポートサービスクラス（静的メソッドでDB操作も提供） */
  AuthService,                        /* 認証サービス */
} from './services';

/* エクスポートサービス */
export {
  ExportService,                      // エクスポートサービスクラス
} from './services/ExportService';

/* インポートパーサーサービス */
export {
  ImportParserService,                // インポートパーサーサービスクラス
} from './services/ImportParserService';

/* ======================================== */
/* Variables */
/* ======================================== */
/* 変数解析とシステム変数関連の関数・型をエクスポート */
export * from './variables/parser';           // 変数パース・展開エンジン
export * from './variables/systemVariables';  // システム変数定義と解決関数

/* ======================================== */
/* Export/Import utilities */
/* ======================================== */
/* エクスポート/インポート処理のユーティリティ関数をエクスポート */
export * from './utils/exportImportUtils';

/* ======================================== */
/* Constants */
/* ======================================== */
/* 定数定義をエクスポート */
export * from './constants/inputLimits';      // 入力値の制限（最大文字数等）
export * from './constants/variables';        // 変数関連の定数
export * from './constants/designTokens';     // デザイントークン（色、サイズ等）
export * from './constants/componentTokens';  // コンポーネント用トークン（高さ、z-index、アニメーション等）
export * from './constants/iconMapping';      // アイコンマッピング（Ionicons ↔ Heroicons）
export * from './constants/themeTokens';      // テーマトークン（スペーシング、フォント、タイポグラフィ）
export * from './constants/subscription';     // サブスクリプション定数（PRO_ENTITLEMENT_ID）
export * from './constants/variableIcons';    // 変数アイコン定数

/* ======================================== */
/* Utils */
/* ======================================== */
/* ユーティリティ関数をエクスポート */
export * from './utils/dateHelpers';      // 日付フォーマット関数
export * from './utils/snippetUtils';     // スニペット関連ユーティリティ
export * from './utils/logger';           // ロガー
export * from './utils/pathUtils';        // パス操作ユーティリティ
export * from './utils/categoryUtils';    // カテゴリ関連ユーティリティ
export * from './utils/snippetFilterUtils'; // スニペットフィルタリングユーティリティ
export * from './utils/errorUtils';      // エラーメッセージ翻訳ユーティリティ

/* 認証エラー関連のユーティリティ */
export {
  AUTH_ERROR_CODES,          // 認証エラーコード定数
  isAuthCancelledError,      // キャンセルエラー判定関数
  getAuthErrorMessageKey,    // エラーメッセージキー取得関数
} from './utils/authErrors';

/* ======================================== */
/* Hooks */
/* ======================================== */
/* Reactカスタムフックをエクスポート */

export {
  /* インポート選択フック */
  useImportSelection,
  type ImportTabType,

  /* デバウンスフック */
  useDebounce,
  DEFAULT_DEBOUNCE_DELAY,

  /* Export/Import State（状態管理） */
  useExportImportState,
  type ExportImportStep,

  /* Selection (汎用版選択フック) */
  useSelection,
  type SelectionTabType,

  /* Snippet Preview（スニペットプレビューフック） */
  useSnippetPreview,

  /* Search（検索フック） */
  useSearch,

  /* Subscription Service（Service層直接アクセス版） */
  useSubscriptionService,
  type UseSubscriptionServiceResult,

  /* Variable Expansion（変数展開） */
  useVariableExpansion,

  /* Filtered Snippets（フィルタリング済みスニペット） */
  useFilteredSnippets,
  type SnippetWithDisplay,

  /* Adapter Initialization（アダプター初期化） */
  useAdapterInitialization,
  type UseAdapterInitializationReturn,

  /* App Initialization（アプリ初期化） */
  useBaseAppInitialization,
  type UseAppInitializationReturn,
  type AppInitializationOptions,

  /* Translation（翻訳） */
  useTranslation,
  type TranslationFunction,

  /* Sort Preference（ソート設定） */
  useSortPreference,
  type UseSortPreferenceReturn,
} from './hooks';

/* ======================================== */
/* Providers */
/* ======================================== */
/* React Contextプロバイダーと共通型定義をエクスポート */
export {
  /* 認証プロバイダー */
  AuthProvider,
  useAuth,
  type AuthContextType,
  type AuthProviderProps,

  /* テーマ関連の型定義 */
  type ThemeMode,
  type BaseThemeContextType,
  type SemanticColors,
  LIGHT_THEME_COLORS,
  DARK_THEME_COLORS,
  getThemeColors,

  /* データベースプロバイダー */
  DatabaseProvider,
  useDatabase,
  type DatabaseContextValue,

  /* テーマプロバイダー */
  ThemeProvider,
  useTheme,
  type ThemeProviderProps,
  type ThemeContextValue,
  type ThemeStorageAdapter,
  type ThemePlatformAdapter,

  /* サブスクリプションプロバイダー */
  SubscriptionProvider,
  useSubscription as useSharedSubscription,
  type SubscriptionContextValue,
  type SubscriptionPlatformAdapter,
  type SubscriptionProviderProps,

  /* プロファイル管理Provider */
  ProfileProvider,
  useProfiles,
  type ProfileContextValue,

  /* 変数管理Provider */
  VariableProvider,
  useVariables,
  type VariableContextValue,

  /* カテゴリ管理Provider */
  CategoryProvider,
  useCategories,
  type CategoryContextValue,

  /* スニペット管理Provider */
  SnippetProvider,
  useSnippets,
  type SnippetContextValue,

  /* アラートProvider */
  AlertProvider,
  useAlert,
  type AlertContextType,
  type AlertOptions,
  type AlertType as SharedAlertType,
  type AlertPlatformAdapter,
  type AlertProviderProps,
} from './providers';
