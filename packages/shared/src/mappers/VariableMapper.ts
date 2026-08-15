/**
 * 変数マッパー
 *
 * @description
 * 変数のCRUD操作を提供。
 * getMainDbAdapter()経由でDB操作を行い、Mobile/Webで共通のロジックを使用。
 *
 * @module VariableMapper
 */

import { getMainDbAdapter } from '../adapters/DbAdapter';
import type {
  Variable,
  CreateVariableInput,
  UpdateVariableInput,
} from '../schema';
import { generateUniqueId, getCurrentTimestamp } from '../utils/dateHelpers';
import { NotFoundError, DatabaseError, DuplicateNameError } from '../errors';

/* ======================================== */
/* SQLクエリ定義 */
/* ======================================== */

const VariableQueries = {
  /* 全変数を取得（sortOrder順） */
  SELECT_ALL: 'SELECT * FROM variables ORDER BY sortOrder ASC',
  /* 有効な変数のみ取得（Proプラン制限に応じてvalidフラグで絞り込み） */
  SELECT_VALID: 'SELECT * FROM variables WHERE valid = 1 ORDER BY sortOrder ASC',
  /* カスタム変数のみを取得（type='custom'かつvalid=1） */
  SELECT_CUSTOM: `SELECT * FROM variables WHERE type = 'custom' AND valid = 1 ORDER BY sortOrder ASC`,
  /* IDで変数を取得 */
  SELECT_BY_ID: 'SELECT * FROM variables WHERE id = ?',
  /* 名前で変数を取得（重複チェック用） */
  SELECT_BY_NAME: 'SELECT * FROM variables WHERE name = ?',
  /* タイプ別に変数を取得（有効なもののみ） */
  SELECT_BY_TYPE: `SELECT * FROM variables WHERE type = ? AND valid = 1 ORDER BY sortOrder ASC`,
  /* 変数を新規作成 */
  INSERT: `INSERT INTO variables (id, name, label, icon, type, valid, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  /* 最大のsortOrderを取得（新規作成時に使用） */
  SELECT_MAX_SORT_ORDER: 'SELECT MAX(sortOrder) as maxOrder FROM variables',
  /* 変数を更新（名前、ラベル、アイコン、sortOrder） */
  UPDATE: `UPDATE variables SET name = ?, label = ?, icon = ?, sortOrder = ?, updatedAt = ? WHERE id = ?`,
  /* 変数を物理削除 */
  DELETE: `DELETE FROM variables WHERE id = ?`,
  /* 有効な変数の総数を取得 */
  SELECT_COUNT: 'SELECT COUNT(*) as count FROM variables WHERE valid = 1',
  /* カスタム変数を全て無効化（Proプラン制限適用前処理） */
  RESET_VALID: `UPDATE variables SET valid = 0, updatedAt = ? WHERE type = 'custom'`,
  /* 作成日時が古い順でlimit件のカスタム変数を有効化（Proプラン制限適用） */
  SET_VALID_BY_LIMIT: `
    UPDATE variables SET valid = 1, updatedAt = ?
    WHERE id IN (
      SELECT id FROM variables WHERE type = 'custom' ORDER BY sortOrder ASC LIMIT ?
    )
  `,
};

/* ======================================== */
/* 行変換関数 */
/* ======================================== */

/**
 * DB行データをVariableエンティティに変換
 * @param row - データベースから取得した行データ
 * @returns Variable型のオブジェクト
 */
const toEntity = (row: any): Variable => ({
  id: row.id, /* 変数ID */
  name: row.name, /* 変数名（例: {{API_KEY}}） */
  label: row.label || null, /* ラベル（UIに表示する名前。未設定・空文字はnullに寄せる） */
  icon: row.icon || null, /* アイコン（オプション。未設定・空文字はnullに寄せる） */
  type: row.type || 'custom', /* タイプ（custom: カスタム変数、それ以外はシステム変数。未設定・空文字はcustom扱い） */
  valid: Boolean(row.valid), /* 有効かどうか（Proプラン制限） */
  sortOrder: row.sortOrder ?? 0, /* 並び順 */
  createdAt: row.createdAt, /* 作成日時 */
  updatedAt: row.updatedAt, /* 最終更新日時 */
});

/**
 * DB行データの配列をVariableエンティティの配列に変換
 * @param rows - データベースから取得した行データの配列
 * @returns Variable型の配列
 */
const toEntities = (rows: any[]): Variable[] => rows.map(toEntity);

/**
 * 変数マッパー
 *
 * @description
 * 変数（カスタム変数）のCRUD操作を提供する静的メソッド群
 */
export class VariableMapper {
  /** バックアップ行をID・日時・有効状態・並び順ごと逐語復元する。 */
  static restore(variable: Variable): void {
    getMainDbAdapter().run(VariableQueries.INSERT, [
      variable.id,
      variable.name,
      variable.label,
      variable.icon,
      variable.type,
      variable.valid ? 1 : 0,
      variable.sortOrder,
      variable.createdAt,
      variable.updatedAt,
    ]);
  }

  /**
   * 有効な全変数を取得
   * @returns 有効な変数一覧（作成日時順）
   */
  static getAll(): Variable[] {
    const db = getMainDbAdapter();
    const rows = db.all<any>(VariableQueries.SELECT_VALID);
    return toEntities(rows);
  }

  /**
   * 無効なものも含む全変数を取得
   * @returns 全変数（作成日時順）
   */
  static getAllIncludingInvalid(): Variable[] {
    const db = getMainDbAdapter();
    const rows = db.all<any>(VariableQueries.SELECT_ALL);
    return toEntities(rows);
  }

  /**
   * カスタム変数のみを取得
   * @returns カスタム変数一覧（作成日時順）
   */
  static getCustomVariables(): Variable[] {
    const db = getMainDbAdapter();
    const rows = db.all<any>(VariableQueries.SELECT_CUSTOM);
    return toEntities(rows);
  }

  /**
   * IDで変数を取得
   * @param id - 変数ID
   * @returns 変数（存在しない場合はnull）
   */
  static getById(id: string): Variable | null {
    const db = getMainDbAdapter();
    const row = db.get<any>(VariableQueries.SELECT_BY_ID, [id]);
    return row ? toEntity(row) : null;
  }

  /**
   * 名前で変数を取得
   * @param name - 変数名
   * @returns 変数（存在しない場合はnull）
   */
  static getByName(name: string): Variable | null {
    const db = getMainDbAdapter();
    const row = db.get<any>(VariableQueries.SELECT_BY_NAME, [name]);
    return row ? toEntity(row) : null;
  }

  /**
   * 変数を作成
   * @param data - 作成データ
   * @returns 作成された変数
   */
  static create(data: CreateVariableInput): Variable {
    const db = getMainDbAdapter();
    /* 同名の変数が既に存在するかチェック */
    const existing = this.getByName(data.name);
    if (existing) {
      throw new DuplicateNameError('variable', data.name);
    }

    /* 新規IDとタイムスタンプを生成 */
    const id = generateUniqueId();
    const now = getCurrentTimestamp();
    /* sortOrderが指定されている場合はそれを使用、なければ既存変数の最大sortOrder+1を次の並び順として設定（末尾に追加） */
    const sortOrder = data.sortOrder !== undefined ? data.sortOrder : this.getNextSortOrder();

    /* データベースに新規変数を挿入 */
    db.run(VariableQueries.INSERT, [
      id,
      data.name,
      data.label || null,
      data.icon || null,
      data.type || 'custom',
      1, /* valid（初期値は有効） */
      sortOrder,
      now,
      now,
    ]);

    /* 挿入したデータを再取得して返却（整合性確保） */
    const variable = this.getById(id);
    if (!variable) {
      throw new DatabaseError('Failed to create variable');
    }
    return variable;
  }

  /**
   * 変数を更新
   * @param id - 変数ID
   * @param data - 更新データ
   * @returns 更新された変数
   */
  static update(id: string, data: UpdateVariableInput): Variable {
    const db = getMainDbAdapter();
    /* 更新対象の変数が存在するか確認 */
    const variable = this.getById(id);

    if (!variable) {
      throw new NotFoundError('variable', id);
    }

    /* 変数名が変更される場合、新しい名前の重複をチェック */
    if (data.name && data.name !== variable.name) {
      const existing = this.getByName(data.name);
      if (existing) {
        throw new DuplicateNameError('variable', data.name);
      }
    }

    const now = getCurrentTimestamp();

    /* 指定されたフィールドのみ更新、未指定なら既存値を保持（部分更新対応） */
    db.run(VariableQueries.UPDATE, [
      data.name !== undefined ? data.name : variable.name,
      data.label !== undefined ? data.label : variable.label,
      data.icon !== undefined ? data.icon : variable.icon,
      data.sortOrder !== undefined ? data.sortOrder : variable.sortOrder,
      now,
      id,
    ]);

    /* 更新後のデータを再取得して返却（整合性確保） */
    const updated = this.getById(id);
    if (!updated) {
      throw new DatabaseError('Failed to update variable');
    }
    return updated;
  }

  /**
   * 変数を削除（物理削除）
   * @param id - 変数ID
   * @description
   * データベースから完全に削除する。
   */
  static delete(id: string): void {
    const db = getMainDbAdapter();
    db.run(VariableQueries.DELETE, [id]);
  }

  /**
   * 変数総数を取得
   * @returns 有効な変数の数
   */
  static count(): number {
    const db = getMainDbAdapter();
    const result = db.get<{ count: number }>(VariableQueries.SELECT_COUNT);
    return result?.count || 0;
  }

  /**
   * プランに応じてvalidフラグを更新
   * @param limit - 有効にする変数数（無料プランは3、Proプランは無制限）
   * @description
   * 無料プランでは作成日時が古い順にlimit件のカスタム変数のみvalidにする。
   * システム変数は対象外。
   */
  static updateValidFlags(limit: number): void {
    const db = getMainDbAdapter();
    const now = getCurrentTimestamp();
    /* 全カスタム変数を無効化（Proプラン制限適用前処理） */
    db.run(VariableQueries.RESET_VALID, [now]);
    /* 作成日時が古い順でlimit件のカスタム変数のみ有効化（Proプラン制限適用） */
    db.run(VariableQueries.SET_VALID_BY_LIMIT, [now, limit]);
  }

  /**
   * タイプ別に変数を取得（有効なもののみ）
   * @param type - 変数タイプ（'custom'など）
   * @returns 指定タイプの変数一覧
   */
  static getByType(type: string): Variable[] {
    const db = getMainDbAdapter();
    const rows = db.all<any>(VariableQueries.SELECT_BY_TYPE, [type]);
    return toEntities(rows);
  }

  /**
   * 次のsortOrder値を取得（新規変数作成時・インポート時に使用）
   * @returns 既存の最大sortOrder+1（データが存在しない場合は0）
   */
  static getNextSortOrder(): number {
    const db = getMainDbAdapter();
    /* 現在の最大sortOrderを取得（新規変数を末尾に追加するため） */
    const result = db.get<{ maxOrder: number | null }>(
      VariableQueries.SELECT_MAX_SORT_ORDER
    );
    /* 最大値+1を返す（データがない場合は-1+1=0が返る） */
    return (result?.maxOrder ?? -1) + 1;
  }
}
