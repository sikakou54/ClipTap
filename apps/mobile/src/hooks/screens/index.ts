/**
 * 画面フックのエクスポート
 *
 * @description
 * 各画面に対応するビジネスロジックフックを一括エクスポート。
 *
 * 命名規則:
 * - use{Entity}{Action}Screen : 画面全体のロジック（例: useHomeScreen, useCategoryEditScreen）
 * - use{Action}Flow : 複数ステップのフロー（例: useExportFlow, useImportFlow）
 *
 * UIコンポーネント（app/*.tsx）から完全に分離されたビジネスロジック層。
 */

/* ======================================== */
/* メイン画面 */
/* ======================================== */

/** ホーム画面（定型文一覧） */
export { useHomeScreen, type UseHomeScreenReturn } from './useHomeScreen';

/** 検索画面 */
export { useSearchScreen, type UseSearchScreenReturn } from './useSearchScreen';

/* ======================================== */
/* スニペット関連 */
/* ======================================== */

/** スニペット作成・編集フォーム */
export { useSnippetFormScreen, type UseSnippetFormScreenReturn } from './useSnippetFormScreen';

/** テキスト入力画面（タイトル・本文） */
export { useTextInputScreen, type UseTextInputScreenReturn } from './useTextInputScreen';

/* ======================================== */
/* カテゴリ関連 */
/* ======================================== */

/** カテゴリ一覧画面 */
export { useCategoriesScreen, type UseCategoriesScreenReturn } from './useCategoriesScreen';

/** カテゴリ編集画面 */
export { useCategoryEditScreen, type UseCategoryEditScreenReturn } from './useCategoryEditScreen';

/** カテゴリ選択画面 */
export { useCategorySelectScreen, type UseCategorySelectScreenReturn } from './useCategorySelectScreen';

/* ======================================== */
/* プロファイル（環境）関連 */
/* ======================================== */

/** プロファイル一覧画面 */
export { useProfilesScreen, type UseProfilesScreenReturn } from './useProfilesScreen';

/** プロファイル編集画面 */
export { useProfileEditScreen, type UseProfileEditScreenReturn } from './useProfileEditScreen';

/** プロファイル選択画面 */
export { useProfileSelectScreen, type UseProfileSelectScreenReturn } from './useProfileSelectScreen';

/** プロファイル変数編集画面 */
export { useProfileVariableEditScreen, type UseProfileVariableEditScreenReturn } from './useProfileVariableEditScreen';

/** プロファイル値編集画面 */
export { useProfileValueEditScreen, type UseProfileValueEditScreenReturn } from './useProfileValueEditScreen';

/* ======================================== */
/* 変数関連 */
/* ======================================== */

/** 変数一覧画面 */
export { useVariablesScreen, type UseVariablesScreenReturn } from './useVariablesScreen';

/** 変数編集画面 */
export { useVariableEditScreen, type UseVariableEditScreenReturn } from './useVariableEditScreen';

/* ======================================== */
/* エクスポート・インポート */
/* ======================================== */

/** エクスポート・インポート画面 */
export { useExportImportScreen, type UseExportImportScreenReturn } from './useExportImportScreen';

/** エクスポートデータ選択画面 */
export { useSelectExportDataScreen, type UseSelectExportDataScreenReturn } from './useSelectExportDataScreen';

/** インポートデータ選択画面 */
export { useSelectImportDataScreen, type UseSelectImportDataScreenReturn } from './useSelectImportDataScreen';

/* ======================================== */
/* 設定関連 */
/* ======================================== */

/** 設定画面 */
export { useSettingsScreen, type UseSettingsScreenReturn } from './useSettingsScreen';

/** WebView画面 */
export { useWebViewScreen, type UseWebViewScreenReturn } from './useWebViewScreen';

/* ======================================== */
/* サブスクリプション */
/* ======================================== */

/** ペイウォール画面 */
export { usePaywallScreen, type UsePaywallScreenReturn } from './usePaywallScreen';

/** サブスクリプション管理画面 */
export { useManageSubscriptionScreen, type UseManageSubscriptionScreenReturn } from './useManageSubscriptionScreen';

/* ======================================== */
/* 初期化・その他 */
/* ======================================== */

/** アプリ初期化 */
export { useAppInitialization } from './useAppInitialization';
export type { UseAppInitializationReturn } from '@cliptap/shared';

/** 開発者メニュー */
export { useDevMenu, type UseDevMenuReturn } from './useDevMenu';
