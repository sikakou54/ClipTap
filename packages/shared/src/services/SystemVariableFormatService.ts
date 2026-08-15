/**
 * システム変数書式サービス
 *
 * @module SystemVariableFormatService
 * @remarks
 * 画面・コンポーネント（UI層）からシステム変数の書式設定を読み書きするための入口。
 * UI層がデータアクセス層（SystemVariableFormatMapper）を直接呼ばずに済むように、
 * CLAUDE.mdのアーキテクチャ（UI層 → Service層 → Mapper層）へ合わせる目的で置いている。
 *
 * Registry（メモリ上のキャッシュ）との同期はMapper側の実装をそのまま使う。
 * upsert / deleteは書き込み後にDBを読み直し、deleteAllはRegistryを空にするという
 * 非対称な挙動があるため、このサービスでは呼び分けを変えずに委譲だけを行う。
 */

import { SystemVariableFormatMapper } from '../mappers/SystemVariableFormatMapper';
import type {
  SystemVariableFormats,
  SystemVariableKey,
} from '../constants/systemVariableFormats';

/**
 * システム変数の書式設定を扱うサービス
 *
 * @class SystemVariableFormatService
 * @remarks 静的メソッドのみで構成。状態は持たない。
 */
export class SystemVariableFormatService {
  /**
   * 保存されている書式設定を取得
   *
   * @returns 変数キーと書式パターンの対応
   */
  static getAll(): SystemVariableFormats {
    return SystemVariableFormatMapper.getAll();
  }

  /**
   * DBから書式設定を読み直し、Registryの内容を置き換える
   *
   * @returns 読み込んだ書式設定
   */
  static loadRegistry(): SystemVariableFormats {
    return SystemVariableFormatMapper.loadRegistry();
  }

  /**
   * 書式設定を登録または更新する
   *
   * @param variableKey - システム変数のキー
   * @param pattern - 書式パターン
   * @throws {Error} サポート外のパターンを指定した場合
   */
  static upsert(variableKey: SystemVariableKey, pattern: string): void {
    SystemVariableFormatMapper.upsert(variableKey, pattern);
  }

  /**
   * 指定した変数キーの書式設定を削除する
   *
   * @param variableKey - システム変数のキー
   */
  static delete(variableKey: SystemVariableKey): void {
    SystemVariableFormatMapper.delete(variableKey);
  }

  /**
   * 書式設定を全件削除する（既定の書式へ戻す）
   */
  static deleteAll(): void {
    SystemVariableFormatMapper.deleteAll();
  }
}
