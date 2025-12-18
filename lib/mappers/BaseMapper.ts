/**
 * BaseMapper - データマッピング基底クラス
 *
 * データベース層とサービス層の間でデータ変換を担当する抽象クラスです。
 * すべてのMapperクラスはこのクラスを継承して実装します。
 *
 * 責務:
 * - データベースの生データ（TRawData）とエンティティ（TEntity）の相互変換
 * - CRUD操作の共通実装
 * - エラーハンドリング
 * - ID・タイムスタンプの生成
 *
 * 設計パターン:
 * - Repository Pattern: データアクセス層の抽象化
 * - Data Mapper Pattern: ドメインモデルとデータベーススキーマの分離
 *
 * 使用例:
 * ```typescript
 * class SnippetMapper extends BaseMapper<Snippet, SnippetRaw> {
 *   toEntity(raw: SnippetRaw): Snippet {
 *     return { ...raw, createdAt: new Date(raw.createdAt) };
 *   }
 *   toRaw(entity: Partial<Snippet>): SnippetRaw {
 *     return { ...entity, createdAt: entity.createdAt?.toISOString() };
 *   }
 * }
 * ```
 */

import { database } from '../database/database';
import { Logger } from '../logger';
import { generateUniqueId, getCurrentTimestamp } from '../utils/dateHelpers';

/**
 * BaseMapper - すべてのMapperの基底クラス
 *
 * @template TEntity - サービス層で使用するエンティティ型（ドメインモデル）
 * @template TRawData - データベースから取得する生データの型（DBスキーマ）
 */
export abstract class BaseMapper<TEntity, TRawData = any> {
  /**
   * データベース生データをエンティティに変換
   *
   * SQLiteから取得した生データ（カラム名がスネークケース、数値フラグなど）を
   * サービス層で扱いやすいエンティティ型に変換します。
   *
   * 実装例:
   * ```typescript
   * toEntity(raw: SnippetRaw): Snippet {
   *   return {
   *     id: raw.id,
   *     title: raw.title,
   *     hasVariables: raw.hasVariables === 1, // 数値→boolean変換
   *     createdAt: raw.createdAt, // ISO文字列のまま
   *   };
   * }
   * ```
   *
   * @param {TRawData} raw - データベースから取得した生データ
   * @returns {TEntity} サービス層用のエンティティ
   */
  abstract toEntity(raw: TRawData): TEntity;

  /**
   * エンティティをデータベース用データに変換
   *
   * サービス層のエンティティをSQLiteに格納可能な形式に変換します。
   * Partial<TEntity>を受け取ることで、部分更新にも対応します。
   *
   * 実装例:
   * ```typescript
   * toRaw(entity: Partial<Snippet>): SnippetRaw {
   *   return {
   *     id: entity.id || this.generateId(),
   *     title: entity.title || '',
   *     hasVariables: entity.hasVariables ? 1 : 0, // boolean→数値変換
   *     createdAt: entity.createdAt || this.getTimestamp(),
   *   };
   * }
   * ```
   *
   * @param {Partial<TEntity>} entity - サービス層のエンティティ（部分更新可）
   * @returns {TRawData} データベース格納用の生データ
   */
  abstract toRaw(entity: Partial<TEntity>): TRawData;

  /**
   * 複数のデータベース生データをエンティティ配列に変換
   *
   * @param {TRawData[]} rawList - データベースから取得した生データの配列
   * @returns {TEntity[]} エンティティの配列
   */
  toEntityList(rawList: TRawData[]): TEntity[] {
    return rawList.map(raw => this.toEntity(raw));
  }

  /**
   * SQLクエリを実行して単一エンティティを取得
   *
   * SELECTクエリを実行し、最初の1件をエンティティに変換して返します。
   * 結果が0件の場合はnullを返します。
   *
   * @param {string} query - SQL SELECT文
   * @param {any[]} params - プレースホルダーのパラメータ配列
   * @returns {TEntity | null} 変換されたエンティティ、または null
   * @throws {Error} データベースエラーが発生した場合
   */
  protected fetchOne(query: string, params: any[] = []): TEntity | null {
    try {
      const raw = database.getFirstSync(query, params) as TRawData | null;
      return raw ? this.toEntity(raw) : null;
    } catch (error) {
      Logger.error(`[${this.constructor.name}] fetchOne error:`, error);
      throw error;
    }
  }

  /**
   * SQLクエリを実行してエンティティのリストを取得
   *
   * SELECTクエリを実行し、すべての結果をエンティティ配列に変換して返します。
   * 結果が0件の場合は空配列を返します。
   *
   * @param {string} query - SQL SELECT文
   * @param {any[]} params - プレースホルダーのパラメータ配列
   * @returns {TEntity[]} 変換されたエンティティの配列
   * @throws {Error} データベースエラーが発生した場合
   */
  protected fetchAll(query: string, params: any[] = []): TEntity[] {
    try {
      const rawList = database.getAllSync(query, params) as TRawData[];
      return this.toEntityList(rawList);
    } catch (error) {
      Logger.error(`[${this.constructor.name}] fetchAll error:`, error);
      throw error;
    }
  }

  /**
   * INSERT文を実行してデータを挿入
   *
   * @param {string} query - SQL INSERT文
   * @param {any[]} params - プレースホルダーのパラメータ配列
   * @throws {Error} データベースエラーが発生した場合（一意制約違反など）
   */
  protected insert(query: string, params: any[]): void {
    try {
      database.runSync(query, params);
    } catch (error) {
      Logger.error(`[${this.constructor.name}] insert error:`, error);
      throw error;
    }
  }

  /**
   * UPDATE文を実行してデータを更新
   *
   * @param {string} query - SQL UPDATE文
   * @param {any[]} params - プレースホルダーのパラメータ配列
   * @throws {Error} データベースエラーが発生した場合
   */
  protected update(query: string, params: any[]): void {
    try {
      database.runSync(query, params);
    } catch (error) {
      Logger.error(`[${this.constructor.name}] update error:`, error);
      throw error;
    }
  }

  /**
   * DELETE文を実行してデータを削除
   *
   * @param {string} query - SQL DELETE文
   * @param {any[]} params - プレースホルダーのパラメータ配列
   * @throws {Error} データベースエラーが発生した場合
   */
  protected delete(query: string, params: any[]): void {
    try {
      database.runSync(query, params);
    } catch (error) {
      Logger.error(`[${this.constructor.name}] delete error:`, error);
      throw error;
    }
  }

  /**
   * ユニークIDを生成
   *
   * 新規エンティティ作成時の主キー生成に使用します。
   * UUID v4形式のランダムな一意識別子を返します。
   *
   * @returns {string} UUID v4形式の文字列
   */
  protected generateId(): string {
    return generateUniqueId();
  }

  /**
   * 現在のタイムスタンプを取得
   *
   * createdAt / updatedAt フィールドに使用するISO 8601形式のタイムスタンプを返します。
   *
   * @returns {string} ISO 8601形式の日時文字列（例: 2024-01-01T12:00:00.000Z）
   */
  protected getTimestamp(): string {
    return getCurrentTimestamp();
  }
}
