/**
 * 画面フックのエクスポート
 *
 * @description
 * 各画面に対応するビジネスロジックフックを一括エクスポート。
 * 命名規則: use{機能名}Screen
 */

/* ホーム画面（定型文一覧） */
export { useHomeScreen } from './useHomeScreen';
export type { UseHomeScreenReturn, SnippetFormValues } from './useHomeScreen';

/* スニペット作成/編集モーダル */
export { useSnippetModal } from './useSnippetModal';
export type { UseSnippetModalReturn, SnippetFormValues as SnippetModalFormValues } from './useSnippetModal';

/* エクスポート画面 */
export { useExportScreen } from './useExportScreen';
export type { UseExportScreenReturn } from './useExportScreen';

/* インポート画面 */
export { useImportScreen } from './useImportScreen';
export type { UseImportScreenReturn } from './useImportScreen';

/* カテゴリ管理画面 */
export { useCategoriesScreen } from './useCategoriesScreen';
export type { UseCategoriesScreenReturn } from './useCategoriesScreen';

/* プロファイル（環境）管理画面 */
export { useProfilesScreen } from './useProfilesScreen';
export type { UseProfilesScreenReturn } from './useProfilesScreen';

/* 変数管理画面 */
export { useVariablesScreen } from './useVariablesScreen';
export type { UseVariablesScreenReturn, SystemVariable } from './useVariablesScreen';

/* 共通型のre-export */
export type { SnippetWithDisplay } from '@cliptap/shared';
