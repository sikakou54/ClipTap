/**
 * 暗号化アダプター
 *
 * @description
 * プラットフォーム固有のSHA-256ハッシュ計算を抽象化する。
 * - Mobile: expo-crypto
 * - Web: crypto.subtle
 * エクスポート/インポート時のパスワードハッシュ化とデータ改竄検知に使用。
 *
 * @module CryptoAdapter
 */

/**
 * 暗号化アダプターインターフェース
 */
export interface CryptoAdapter {
  /**
   * SHA-256ハッシュを計算
   *
   * @description
   * パスワード + アプリバージョンのハッシュ値を生成し、データ改竄を検知する。
   *
   * @param input - ハッシュ対象の文字列（パスワード + バージョン等）
   * @returns ハッシュ値（64文字の16進数文字列、例: "a1b2c3..."）
   */
  sha256(input: string): Promise<string>;
}

/* ======================================== */
/* アダプターインスタンス管理 */
/* ======================================== */

let cryptoAdapter: CryptoAdapter | null = null;

/**
 * CryptoAdapterを登録
 * @param adapter - プラットフォーム固有のCryptoAdapter実装
 */
export function setCryptoAdapter(adapter: CryptoAdapter): void {
  cryptoAdapter = adapter;
}

/**
 * 登録済みのCryptoAdapterを取得
 * @returns 登録済みのCryptoAdapter
 * @throws {Error} アダプターが未登録の場合
 */
export function getCryptoAdapter(): CryptoAdapter {
  if (!cryptoAdapter) {
    throw new Error('CryptoAdapter not set. Call setCryptoAdapter() first.');
  }
  return cryptoAdapter;
}

