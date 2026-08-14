/**
 * Base64文字列の変換ユーティリティ
 *
 * @module base64
 */

/**
 * Base64文字列をUint8Arrayに変換
 *
 * @remarks
 * atob() が返す文字列は各文字コードが0-255に収まる（1文字=1バイト）ため、
 * charCodeAt() の結果をそのまま Uint8Array へ詰めてよい。
 *
 * 戻り値の型引数を ArrayBuffer に固定しているのは、Blob の生成と
 * FileSystemWritableFileStream.write() が SharedArrayBuffer 由来でないバイト列を
 * 要求するため（既定の Uint8Array は ArrayBufferLike で受け付けられない）。
 *
 * @param base64 - Base64エンコードされた文字列
 * @returns デコードしたバイト列
 */
export function base64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
