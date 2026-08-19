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
export class WebCryptoAdapter implements CryptoAdapter {
  /**
   * SHA-256ハッシュを計算する
   * @param input - ハッシュ化する文字列
   * @returns 16進数文字列としてのハッシュ値
   */
  async sha256(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    /* toString(16) は1桁になることがあるため、padStart で必ず2桁の16進文字にしてから連結する */
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}
