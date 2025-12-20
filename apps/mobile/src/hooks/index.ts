/**
 * Mobile用フックのエクスポート
 *
 * Mobile固有のカスタムフックを一括エクスポート。
 *
 * 命名規則:
 * - useMobile* : Mobile固有のフック（他のプラットフォームには存在しない）
 * - use* : 汎用フック（ただしMobile固有の実装）
 *
 * 画面ロジックフックは screens/ からインポートしてください。
 * 共通フックは @cliptap/shared からインポートしてください。
 */

/* ======================================== */
/* Mobile固有フック */
/* ======================================== */

/**
 * 購入復元フック
 * App Store/Google Playの過去の購入を復元
 */
export { useRestorePurchases } from './useRestorePurchases';

/**
 * トラッキングフック
 * アナリティクス・イベントトラッキング
 */
export { useTracking } from './useTracking';

/* ======================================== */
/* 画面ロジックフック（re-export） */
/* ======================================== */
export * from './screens';
