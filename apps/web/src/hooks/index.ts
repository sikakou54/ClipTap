/**
 * Web用フックのエクスポート
 *
 * @description
 * Web固有のカスタムフックを一括エクスポート。
 *
 * 命名規則:
 * - useWeb* : Web固有のフック
 * - use* : 汎用フック（ただしWeb固有の実装）
 *
 * 画面ロジックフックは screens/ からインポートしてください。
 * 共通フックは @cliptap/shared からインポートしてください。
 */

/* ======================================== */
/* Web固有フック */
/* ======================================== */

/**
 * Webインポート処理フック
 * @see useImportScreen (screens/) の内部実装として使用
 */
export { useWebImport, type UseWebImportOptions, type UseWebImportResult } from './useWebImport';

/* ======================================== */
/* UI/UXフック */
/* ======================================== */

/** 背景スクロールをロックするフック（モーダル表示時等） */
export { useBodyScrollLock } from './useBodyScrollLock';

/** モバイルメニューの開閉状態を管理するフック */
export { useMobileMenu } from './useMobileMenu';

/* ======================================== */
/* ナビゲーション/フォームフック */
/* ======================================== */

/** 未保存の変更がある場合の警告フック */
export { useUnsavedChangesWarning } from './useUnsavedChangesWarning';

/* ======================================== */
/* 初期化フック */
/* ======================================== */

/** アプリ初期化フック */
export { useAppInitialization } from './useAppInitialization';

/* ======================================== */
/* 画面ロジックフック（re-export） */
/* ======================================== */
export * from './screens';
