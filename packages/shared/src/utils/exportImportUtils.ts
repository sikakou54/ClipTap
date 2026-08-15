/**
 * @module utils/exportImportUtils
 * @description ClipTapアプリ固有のエクスポート/インポートユーティリティ関数
 *
 * このモジュールはエクスポート/インポート機能で使用される
 * Base64エンコーディング、パスワードハッシュ、チェックサム生成などの
 * セキュリティ関連処理を提供します。
 *
 * @remarks
 * - エクスポートデータは二重Base64エンコーディングで難読化されます
 * - パスワードハッシュはスキーマバージョンと組み合わせて生成されます
 * - チェックサムはデータ改竄検知に使用されます
 */

import type { ClipTapExportData } from '../schema';
import { EnvironmentError } from '../errors';

declare const globalThis: {
  btoa?: (data: string) => string;
  atob?: (data: string) => string;
};

/*
 * btoa / atob / TextEncoder は呼び出しのたびに解決する。
 * 対象ランタイム（iOS / Android の Hermes、主要ブラウザ）にはいずれも存在するため、
 * ここの throw に到達するのは想定外の環境のみだが、モジュール評価時に解決すると
 * このモジュールを再輸出しているバレル（src/index.ts）の読み込み全体が失敗し、
 * エクスポート/インポートを使わない画面まで巻き込むため、使うときに解決する。
 */

/**
 * Base64エンコード関数を取得
 *
 * @returns グローバルスコープのbtoa関数
 * @throws {EnvironmentError} btoaが利用できない環境の場合
 *
 * @internal
 */
const getBtoa = () => {
  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa.bind(globalThis);
  }
  throw new EnvironmentError('btoa');
};

/**
 * Base64デコード関数を取得
 *
 * @returns グローバルスコープのatob関数
 * @throws {EnvironmentError} atobが利用できない環境の場合
 *
 * @internal
 */
const getAtob = () => {
  if (typeof globalThis.atob === 'function') {
    return globalThis.atob.bind(globalThis);
  }
  throw new EnvironmentError('atob');
};

/**
 * テキストエンコーダーを取得
 *
 * @returns 新しく生成したTextEncoder
 * @throws {EnvironmentError} TextEncoderが利用できない環境の場合
 *
 * @internal
 */
const getTextEncoder = (): TextEncoder => {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder();
  }
  throw new EnvironmentError('TextEncoder');
};

/**
 * パスワードハッシュの入力文字列を構築
 *
 * @param password - ユーザーが入力したパスワード
 * @param schemaVersion - データベーススキーマバージョン
 *
 * @returns ハッシュ化前の入力文字列（形式: "password:schemaVersion"）
 *
 * @remarks
 * この関数はSHA-256ハッシュ化の前処理として使用されます。
 * パスワードとスキーマバージョンを組み合わせることで、
 * 異なるバージョン間でのインポートを防ぎます。
 *
 * エクスポート/インポート処理では、この文字列をSHA-256でハッシュ化して
 * セキュアな検証用ハッシュ値を生成します。
 */
export const buildPasswordHashInput = (password: string, schemaVersion: number): string =>
  `${password}:${schemaVersion}`;

/**
 * チェックサム生成用のペイロード文字列を構築
 *
 * @param data - エクスポートデータの一部（s, t, h, d フィールド）
 *
 * @returns JSON文字列化されたペイロード
 *
 * @remarks
 * チェックサムはエクスポートデータの改竄検知に使用されます。
 * 以下のフィールドを含むJSON文字列を生成します:
 * - `s`: スキーマバージョン
 * - `t`: タイムスタンプ
 * - `h`: パスワードハッシュ
 * - `d`: データ本体
 *
 * この文字列をSHA-256でハッシュ化してチェックサム値を生成します。
 * インポート時に同じ方法でチェックサムを計算し、一致を確認することで
 * データが改竄されていないことを保証します。
 */
export const buildChecksumPayload = (data: Pick<ClipTapExportData, 's' | 't' | 'h' | 'd'>): string =>
  JSON.stringify({
    s: data.s,
    t: data.t,
    h: data.h,
    d: data.d,
  });

/**
 * Uint8Arrayからバイナリ文字列に変換
 *
 * @param bytes - 変換対象のバイト配列
 *
 * @returns バイナリ文字列
 *
 * @remarks
 * Base64エンコーディングの内部処理で使用されます。
 * 各バイト値を文字コードとして解釈し、文字列に変換します。
 *
 * @internal
 */
const binaryFromUint8Array = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return binary;
};

/**
 * バイナリ文字列からUint8Arrayに変換
 *
 * @param binary - バイナリ文字列
 *
 * @returns バイト配列
 *
 * @remarks
 * Base64デコーディングの内部処理で使用されます。
 * 各文字の文字コードをバイト値として解釈し、配列に変換します。
 *
 * @internal
 */
const uint8ArrayFromBinary = (binary: string): Uint8Array => {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

/**
 * 二重Base64エンコードされた文字列をUint8Arrayにデコード
 *
 * @param doubleBase64 - 二重Base64エンコードされた文字列
 *
 * @returns デコードされたバイト配列
 *
 * @remarks
 * エクスポートデータのデコードに使用されます。
 *
 * 処理の流れ:
 * 1. 二重Base64文字列 → Base64文字列（一重目）
 * 2. Base64文字列 → バイナリ文字列 → Uint8Array
 */
export const decodeDoubleBase64ToUint8Array = (doubleBase64: string): Uint8Array => {
  const atob = getAtob();
  const firstBase64 = atob(doubleBase64);
  const binary = atob(firstBase64);
  return uint8ArrayFromBinary(binary);
};

/**
 * 一重Base64を二重Base64にエンコード
 *
 * @param base64 - Base64エンコードされた文字列
 *
 * @returns 二重Base64エンコードされた文字列
 *
 * @remarks
 * Base64文字列をさらにBase64エンコードします。
 * エクスポートデータの難読化で使用されます。
 */
export const base64ToDoubleBase64 = (base64: string): string => {
  const bytes = getTextEncoder().encode(base64);
  return getBtoa()(binaryFromUint8Array(bytes));
};

/**
 * Uint8Arrayを一重Base64エンコード
 *
 * @param bytes - エンコード対象のバイト配列
 *
 * @returns Base64エンコードされた文字列
 *
 * @remarks
 * バイナリデータを標準的なBase64文字列に変換します。
 * SQLiteデータベースファイルなどのバイナリデータをファイルに書き出す際に使用されます。
 */
export const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
  return getBtoa()(binaryFromUint8Array(bytes));
};
