/**
 * Web用暗号化アダプター
 *
 * @description
 * Web Crypto APIを使用したSHA-256ハッシュ計算を提供する。
 *
 * @module WebCryptoAdapter
 */

import type { CryptoAdapter } from '@cliptap/shared';

/**
 * Web用CryptoAdapter実装クラス
 * Web Crypto APIを使用してハッシュ計算を行う
 */
class WebCryptoAdapterImpl implements CryptoAdapter {
  /**
   * SHA-256ハッシュを計算する
   * @param input - ハッシュ化する文字列
   * @returns 16進数文字列としてのハッシュ値
   */
  async sha256(input: string): Promise<string> {
    /* TextEncoderを作成（文字列をUTF-8バイト列に変換するため） */
    const encoder = new TextEncoder();
    /* 入力文字列をUint8Array（バイト配列）にエンコード */
    const data = encoder.encode(input);
    /* Web Crypto APIを使用してSHA-256ハッシュを計算（結果はArrayBuffer） */
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    /* ArrayBufferをUint8Arrayに変換し、さらに通常の配列に変換 */
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    /* 各バイトを16進数2桁の文字列に変換し、結合して最終的なハッシュ文字列を生成 */
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}

/**
 * WebCryptoAdapterクラスを再エクスポート
 */
export { WebCryptoAdapterImpl as WebCryptoAdapter };
