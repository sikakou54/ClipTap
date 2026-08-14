/**
 * アプリデータ初期化フックの型契約
 *
 * @description
 * 両アプリの useAppInitialization が満たす型契約のみを定義する。
 * フック本体はプラットフォーム差（DBの読み込み方法・シード投入の手順）があるため、
 * apps/web と apps/mobile がそれぞれ実装する。
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


