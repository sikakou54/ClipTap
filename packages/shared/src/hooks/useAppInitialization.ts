/**
 * アプリデータ初期化フック（共通型定義・ロジック）
 *
 * @description
 * useAppInitializationフックの共通インターフェースと共通ロジックを定義。
 * プラットフォーム固有の実装は各アプリで提供される。
 *
 * @module useAppInitialization
 */

/* ======================================== */
/* 型定義 */
/* ======================================== */

/**
 * useAppInitialization フックの返却値
 */
export interface UseAppInitializationReturn {
  /** アプリデータ初期化完了フラグ */
  isAppReady: boolean;
  /** データベースがロード済みかどうか（キャッシュから復元したか、シードデータ投入時など） */
  isLoaded: boolean;
  /** データベースのロード状態を変更 */
  setLoaded: (loaded: boolean) => void;
}


