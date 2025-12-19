/**
 * Mobile用暗号化アダプター
 *
 * @description
 * expo-cryptoを使用したSHA-256ハッシュ計算を提供する。
 *
 * @module MobileCryptoAdapter
 */

import * as Crypto from 'expo-crypto';
import type { CryptoAdapter } from '@cliptap/shared';

export class MobileCryptoAdapter implements CryptoAdapter {
  /**
   * SHA-256ハッシュを計算
   *
   * @param input - ハッシュ化する文字列
   * @returns SHA-256ハッシュ値（16進数文字列）
   */
  async sha256(input: string): Promise<string> {
    /* expo-cryptoを使用してSHA-256ハッシュを計算（エクスポート・インポートのパスワード検証で使用） */
    return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
  }
}

