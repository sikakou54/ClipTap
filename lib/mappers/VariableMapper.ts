/**
 * VariableMapper - 変数データのマッピング
 */

import { BaseMapper } from './BaseMapper';
import { Variable, CreateVariableInput, UpdateVariableInput } from '../types/variable';
import { Logger } from '../logger';

interface VariableRaw {
  id: string;
  name: string;
  type: string;
  label: string | null;
  icon: string | null;
  valid: number;
  createdAt: string;
  updatedAt: string;
}

export class VariableMapper extends BaseMapper<Variable, VariableRaw> {
  /**
   * DB生データをEntityに変換
   */
  toEntity(raw: VariableRaw): Variable {
    return {
      id: raw.id,
      name: raw.name,
      type: raw.type as any,
      label: raw.label || undefined,
      icon: raw.icon || undefined,
      valid: raw.valid === 1,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  /**
   * EntityをDB用のデータに変換
   */
  toRaw(entity: Partial<Variable>): VariableRaw {
    return {
      id: entity.id || this.generateId(),
      name: entity.name || '',
      type: entity.type || 'custom',
      label: entity.label || null,
      icon: entity.icon || null,
      valid: entity.valid !== undefined ? (entity.valid ? 1 : 0) : 1,
      createdAt: entity.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 全変数を取得（有効なもののみ）
   */
  getAll(): Variable[] {
    return this.fetchAll('SELECT * FROM variables WHERE valid = 1 ORDER BY name ASC');
  }

  /**
   * 全変数を取得（無効なものも含む）
   * 設定画面での表示用
   */
  getAllIncludingInvalid(): Variable[] {
    return this.fetchAll('SELECT * FROM variables ORDER BY createdAt ASC');
  }

  /**
   * IDで変数を取得
   */
  getById(id: string): Variable | null {
    return this.fetchOne('SELECT * FROM variables WHERE id = ?', [id]);
  }

  /**
   * 名前で変数を取得
   */
  getByName(name: string): Variable | null {
    return this.fetchOne('SELECT * FROM variables WHERE name = ?', [name]);
  }

  /**
   * タイプで変数を取得（有効なもののみ）
   */
  getByType(type: string): Variable[] {
    return this.fetchAll('SELECT * FROM variables WHERE type = ? AND valid = 1 ORDER BY name ASC', [type]);
  }

  /**
   * 変数を作成
   */
  create(input: CreateVariableInput): Variable {
    const raw = this.toRaw({
      name: input.name,
      type: input.type,
      label: input.label,
      icon: input.icon,
    });

    this.insert(
      `INSERT INTO variables (id, name, type, label, icon, valid, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [raw.id, raw.name, raw.type, raw.label, raw.icon, raw.valid, raw.createdAt, raw.updatedAt]
    );

    return this.toEntity(raw);
  }

  /**
   * 変数を更新
   */
  updateById(id: string, input: UpdateVariableInput): Variable | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const updatedAt = new Date().toISOString();

    this.update(
      `UPDATE variables
       SET name = ?, label = ?, icon = ?, updatedAt = ?
       WHERE id = ?`,
      [
        input.name ?? existing.name,
        input.label ?? existing.label,
        input.icon ?? existing.icon,
        updatedAt,
        id
      ]
    );

    return this.getById(id);
  }

  /**
   * 変数を削除
   */
  deleteById(id: string): boolean {
    const existing = this.getById(id);
    if (!existing) return false;

    this.delete('DELETE FROM variables WHERE id = ?', [id]);
    return true;
  }

  /**
   * プランに応じてvalidフラグを更新（customタイプのみ、FREE_VARIABLES_LIMIT分だけ有効にする）
   */
  updateValidFlags(limit: number): void {
    try {
      // customタイプの変数をすべて無効にする
      this.update(`UPDATE variables SET valid = 0 WHERE type = 'custom'`, []);

      // createdAt ASCで上位N件を有効にする
      this.update(`
        UPDATE variables
        SET valid = 1
        WHERE id IN (
          SELECT id FROM variables
          WHERE type = 'custom'
          ORDER BY createdAt ASC
          LIMIT ?
        )
      `, [limit]);

      Logger.info(`[VariableMapper] Updated valid flags: ${limit} variables are now valid`);
    } catch (error) {
      Logger.error('[VariableMapper] Failed to update valid flags:', error);
      throw error;
    }
  }
}

export const variableMapper = new VariableMapper();
