/**
 * Web用ファイルI/Oアダプター
 *
 * @description
 * Origin Private File System (OPFS) を使用してファイル操作を提供。
 * OPFSを使用することで、Mobileと同様にファイルパスベースでの一時ファイル管理が可能。
 *
 * パス形式:
 * - "opfs://{filename}" - OPFSに保存（一時DBファイル等）
 *
 * @module WebFileIOAdapter
 */

import type { FileIOAdapter, FileInfo } from '@cliptap/shared';
import { isOpfsPath, getOpfsFileName } from '@cliptap/shared';

/**
 * Web用FileIOAdapter実装クラス
 * Origin Private File System (OPFS) とBlob URLを使用してファイル操作を提供する
 */
export class WebFileIOAdapter implements FileIOAdapter {
  /** 一時的なBlob URLを保持するマップ（ファイル名 -> Blob URL） */
  private tempFiles = new Map<string, string>();

  /** OPFSルートディレクトリハンドル（遅延初期化） */
  private opfsRoot: FileSystemDirectoryHandle | null = null;

  /**
   * OPFSルートディレクトリを取得（遅延初期化）
   */
  private async getOpfsRoot(): Promise<FileSystemDirectoryHandle> {
    if (!this.opfsRoot) {
      this.opfsRoot = await navigator.storage.getDirectory();
    }
    return this.opfsRoot;
  }

  /**
   * ファイルを読み込み（テキスト）
   *
   * @param uri - 読み込むファイルのパス（opfs://またはBlob URL）
   * @returns ファイルの内容（UTF-8テキスト）
   */
  async readFile(uri: string): Promise<string> {
    try {
      /* OPFSパスの場合 */
      if (isOpfsPath(uri)) {
        const fileName = getOpfsFileName(uri);
        const root = await this.getOpfsRoot();
        const fileHandle = await root.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        return await file.text();
      }

      /* Blob URLの場合 */
      const response = await fetch(uri);
      const text = await response.text();
      return text;
    } catch (error) {
      console.error('[WebFileIOAdapter] Read failed:', error);
      throw error;
    }
  }

  /**
   * ファイルを読み込み（Base64）
   *
   * @param uri - 読み込むファイルのパス（opfs://またはBlob URL）
   * @returns ファイルの内容（Base64文字列）
   */
  async readBinary(uri: string): Promise<string> {
    try {
      let blob: Blob;

      /* OPFSパスの場合 */
      if (isOpfsPath(uri)) {
        const fileName = getOpfsFileName(uri);
        const root = await this.getOpfsRoot();
        const fileHandle = await root.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        blob = file;
      } else {
        /* Blob URLの場合 */
        const response = await fetch(uri);
        blob = await response.blob();
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
          const base64 = reader.result as string;
          const content = base64.split(',')[1];
          resolve(content);
        };

        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('[WebFileIOAdapter] Read binary failed:', error);
      throw error;
    }
  }

  /**
   * ファイルを読み込み（Uint8Array）
   *
   * @param uri - 読み込むファイルのパス（opfs://またはBlob URL）
   * @returns ファイルの内容（Uint8Array）
   */
  async readBytes(uri: string): Promise<Uint8Array> {
    try {
      /* OPFSパスの場合 */
      if (isOpfsPath(uri)) {
        const fileName = getOpfsFileName(uri);
        const root = await this.getOpfsRoot();
        const fileHandle = await root.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const arrayBuffer = await file.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      }

      /* Blob URLの場合 */
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error('[WebFileIOAdapter] Read bytes failed:', error);
      throw error;
    }
  }

  /**
   * ファイルを書き込み
   *
   * @param path - 保存するパス（opfs://で始まる場合はOPFS、それ以外はBlob URL）
   * @param content - ファイルの内容
   * @param options - オプション
   * @returns パス（OPFSの場合はそのまま、Blob URLの場合は作成されたURL）
   */
  async writeFile(
    path: string,
    content: string,
    options?: { encoding?: 'utf8' | 'base64' }
  ): Promise<string> {
    try {
      /* OPFSパスの場合 */
      if (isOpfsPath(path)) {
        const fileName = getOpfsFileName(path);
        const root = await this.getOpfsRoot();
        const fileHandle = await root.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();

        if (options?.encoding === 'base64') {
          const byteCharacters = atob(content);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          await writable.write(byteArray);
        } else {
          await writable.write(content);
        }

        await writable.close();
        return path;
      }

      /* Blob URLの場合（従来の動作） */
      let blob: Blob;

      if (options?.encoding === 'base64') {
        const byteCharacters = atob(content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: 'application/octet-stream' });
      } else {
        blob = new Blob([content], { type: 'application/json' });
      }

      const url = URL.createObjectURL(blob);
      this.tempFiles.set(path, url);

      return url;
    } catch (error) {
      console.error('[WebFileIOAdapter] Write failed:', error);
      throw error;
    }
  }

  /**
   * バイナリデータを書き込み（OPFS用）
   *
   * @param path - 保存するパス（opfs://で始まる）
   * @param data - ファイルの内容（Uint8Array）
   * @returns パス
   */
  async writeBytes(path: string, data: Uint8Array): Promise<string> {
    try {
      /* Uint8ArrayをArrayBuffer型に変換（TypeScript型互換性のため） */
      const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;

      /* OPFSパスの場合 */
      if (isOpfsPath(path)) {
        const fileName = getOpfsFileName(path);
        const root = await this.getOpfsRoot();
        const fileHandle = await root.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(arrayBuffer);
        await writable.close();
        return path;
      }

      /* Blob URLとして保存 */
      const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      this.tempFiles.set(path, url);
      return url;
    } catch (error) {
      console.error('[WebFileIOAdapter] Write bytes failed:', error);
      throw error;
    }
  }

  /**
   * ファイルをコピー
   */
  async copyFile(sourceUri: string, targetUri: string): Promise<void> {
    try {
      /* ソースがOPFSパスの場合 */
      if (isOpfsPath(sourceUri)) {
        const data = await this.readBytes(sourceUri);
        await this.writeBytes(targetUri, data);
        return;
      }

      /* ソースがBlob URLの場合 */
      const response = await fetch(sourceUri);
      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);

      /* ターゲットがOPFSパスの場合 */
      if (isOpfsPath(targetUri)) {
        await this.writeBytes(targetUri, data);
        return;
      }

      /* 両方Blob URLの場合（従来の動作） */
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const newUrl = URL.createObjectURL(blob);
      this.tempFiles.set(targetUri, newUrl);
    } catch (error) {
      console.error('[WebFileIOAdapter] Copy failed:', error);
      throw error;
    }
  }

  /**
   * ファイルを削除
   */
  async deleteFile(uri: string): Promise<void> {
    try {
      /* OPFSパスの場合 */
      if (isOpfsPath(uri)) {
        const fileName = getOpfsFileName(uri);
        const root = await this.getOpfsRoot();
        await root.removeEntry(fileName);
        return;
      }

      /* Blob URLの場合 */
      URL.revokeObjectURL(uri);

      for (const [key, value] of this.tempFiles.entries()) {
        if (value === uri) {
          this.tempFiles.delete(key);
          break;
        }
      }
    } catch (error) {
      /* ファイルが存在しない場合のエラーは無視 */
      console.error('[WebFileIOAdapter] Delete failed:', error);
    }
  }

  /**
   * ファイルの存在確認
   */
  async exists(uri: string): Promise<boolean> {
    try {
      /* OPFSパスの場合 */
      if (isOpfsPath(uri)) {
        const fileName = getOpfsFileName(uri);
        const root = await this.getOpfsRoot();
        try {
          await root.getFileHandle(fileName);
          return true;
        } catch {
          return false;
        }
      }

      /* Blob URLの場合 */
      const response = await fetch(uri, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * ファイル情報を取得
   */
  async getInfo(uri: string): Promise<FileInfo> {
    try {
      /* OPFSパスの場合 */
      if (isOpfsPath(uri)) {
        const fileName = getOpfsFileName(uri);
        const root = await this.getOpfsRoot();
        try {
          const fileHandle = await root.getFileHandle(fileName);
          const file = await fileHandle.getFile();
          return {
            exists: true,
            isDirectory: false,
            size: file.size,
            uri,
            modificationTime: file.lastModified,
          };
        } catch {
          return {
            exists: false,
            isDirectory: false,
            uri,
          };
        }
      }

      /* Blob URLの場合 */
      const response = await fetch(uri, { method: 'HEAD' });
      const size = Number(response.headers.get('content-length')) || 0;
      return {
        exists: response.ok,
        isDirectory: false,
        size,
        uri,
        modificationTime: Date.now(),
      };
    } catch {
      return {
        exists: false,
        isDirectory: false,
        uri,
      };
    }
  }

  /**
   * ディレクトリを作成（Webではサポート外）
   */
  async makeDirectory(_uri: string): Promise<void> {
    return Promise.resolve();
  }

  /* ======================================== */
  /* ディレクトリパス取得（Webでは空文字またはnull） */
  /* ======================================== */

  getCacheDirectory(): string {
    return '';
  }

  getDocumentDirectory(): string {
    return '';
  }

  async getAppGroupDirectory(_identifier: string): Promise<string | null> {
    return null;
  }
}
