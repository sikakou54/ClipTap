/**
 * 画面フックのエクスポート
 *
 * @description
 * 各画面に対応するビジネスロジックフックを一括エクスポート。
 * 命名規則: use{機能名}Screen
 */

/* 定型文一覧画面（webでは /dashboard。pages/Dashboard.tsx が使用） */
export { useHomeScreen } from './useHomeScreen';

/* スニペット作成/編集モーダル */
export { useSnippetModal } from './useSnippetModal';

/* エクスポート画面 */
export { useExportScreen } from './useExportScreen';

/* インポート画面 */
export { useImportScreen } from './useImportScreen';

/* カテゴリ管理画面 */
export { useCategoriesScreen } from './useCategoriesScreen';

/* プロファイル（環境）管理画面 */
export { useProfilesScreen } from './useProfilesScreen';

/* 変数管理画面 */
export { useVariablesScreen } from './useVariablesScreen';
