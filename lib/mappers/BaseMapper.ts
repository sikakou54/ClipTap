/**
 * BaseMapper - データマッピング基底クラス
 * DB層とService層の間でデータ変換を担当
 */

import { database } from '../database';
import { Logger } from '../logger';

/**
 * BaseMapper - すべてのMapperの基底クラス
 *
 * @template TEntity - Serviceで使用する型
 * @template TRawData - DBから取得する生データの型
 */
export abstract class BaseMapper<TEntity, TRawData = any> {
  /**
   * DB生データをEntityに変換
   */
  abstract toEntity(raw: TRawData): TEntity;

  /**
   * EntityをDB用のデータに変換
   */
  abstract toRaw(entity: Partial<TEntity>): TRawData;

  /**
   * 複数のDB生データをEntityの配列に変換
   */
  toEntityList(rawList: TRawData[]): TEntity[] {
    return rawList.map(raw => this.toEntity(raw));
  }

  /**
   * SQLクエリを実行してEntityを取得
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
   * SQLクエリを実行してEntityのリストを取得
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
   * データを挿入
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
   * データを更新
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
   * データを削除
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
   */
  protected generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
