/**
 * exportImportUtils のランタイム解決タイミングを固定するテスト
 *
 * btoa / atob / TextEncoder をモジュール評価時に解決すると、
 * このモジュールを再輸出しているバレル（src/index.ts）の読み込み全体が失敗し、
 * エクスポート/インポートを使わない画面まで巻き込む。
 * 呼び出し時に解決していることと、往復変換が壊れていないことを固定する。
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  base64ToDoubleBase64,
  decodeDoubleBase64ToUint8Array,
  uint8ArrayToBase64,
} from '../../src/utils/exportImportUtils';
import { EnvironmentError } from '../../src/errors';

describe('exportImportUtils のランタイム解決', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('btoa と atob が無くてもモジュールの読み込み自体は失敗しない', async () => {
    vi.stubGlobal('btoa', undefined);
    vi.stubGlobal('atob', undefined);
    vi.resetModules();

    const module = await import('../../src/utils/exportImportUtils');

    expect(typeof module.uint8ArrayToBase64).toBe('function');
  });

  it('btoa が無い環境では呼び出したときに EnvironmentError になる', () => {
    vi.stubGlobal('btoa', undefined);

    expect(() => uint8ArrayToBase64(new Uint8Array([1, 2, 3]))).toThrow(EnvironmentError);
  });

  it('atob が無い環境では呼び出したときに EnvironmentError になる', () => {
    vi.stubGlobal('atob', undefined);

    expect(() => decodeDoubleBase64ToUint8Array('QVFJRA==')).toThrow(EnvironmentError);
  });

  it('スタブ解除後は通常どおりBase64を返す', () => {
    expect(uint8ArrayToBase64(new Uint8Array([1, 2, 3]))).toBe('AQID');
  });

  it('二重Base64の往復で元のバイト列に戻る', () => {
    const bytes = new Uint8Array([0, 1, 2, 128, 250, 255]);

    const doubleBase64 = base64ToDoubleBase64(uint8ArrayToBase64(bytes));

    expect(Array.from(decodeDoubleBase64ToUint8Array(doubleBase64))).toEqual(Array.from(bytes));
  });
});
