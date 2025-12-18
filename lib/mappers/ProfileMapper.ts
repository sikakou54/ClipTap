/**
 * ProfileMapper - プロファイル・変数値のデータマッピング
 *
 * プロファイル（環境設定）と環境別のカスタム変数値を管理します。
 *
 * 主な機能:
 * - プロファイルのCRUD操作
 * - アクティブプロファイルの切り替え
 * - デフォルトプロファイルの管理
 * - プロファイル別カスタム変数値の管理
 * - 変数値の取得（プロファイル別・マップ形式）
 *
 * データモデル:
 * - profiles テーブル: プロファイル基本情報
 *   - isActive: 現在アクティブなプロファイル（常に1つのみ）
 *   - isDefault: デフォルトプロファイル（標準値の格納先、常に1つのみ）
 * - profile_variables テーブル: プロファイル別の変数値
 *   - デフォルトプロファイル: カスタム変数の標準値を格納
 *   - その他のプロファイル: 環境固有の値を格納
 *
 * 使用例:
 * ```typescript
 * // プロファイル作成
 * const profile = profileMapper.createProfile({ name: '開発環境' });
 *
 * // 変数値を設定
 * profileMapper.setVariableValue(profile.id, 'API_URL', 'https://dev.api.example.com');
 *
 * // プロファイル別の変数値を取得
 * const variables = profileMapper.getProfileVariablesMap(profile.id);
 * console.log(variables['API_URL']); // 'https://dev.api.example.com'
 * ```
 */

import { BaseMapper } from './BaseMapper';
import { database } from '../database/database';
import {
  Profile,
  ProfileVariable,
  ProfileWithVariables,
  CreateProfileInput,
  UpdateProfileInput,
  CreateProfileVariableInput,
  UpdateProfileVariableInput,
} from '../types/profile';
import { generateUniqueId, getCurrentTimestamp } from '../utils/dateHelpers';
import { Logger } from '../logger';

/**
 * プロファイルのDB生データ型
 */
interface ProfileRaw {
  id: string;
  name: string;
  isActive: number;      // SQLite boolean (0 or 1)
  isDefault: number;     // SQLite boolean (0 or 1)
  valid: number;         // SQLite boolean (0 or 1)
  createdAt: string;     // ISO 8601 datetime
  updatedAt: string;     // ISO 8601 datetime
}

/**
 * プロファイル変数のDB生データ型
 */
interface ProfileVariableRaw {
  id: string;
  profileId: string;
  variableId: string;
  value: string;
  createdAt: string;     // ISO 8601 datetime
  updatedAt: string;     // ISO 8601 datetime
}

/**
 * ProfileMapper - プロファイル・変数値のデータアクセス層
 *
 * プロファイル（環境）ごとの設定と、カスタム変数の値を管理します。
 */
class ProfileMapper extends BaseMapper<Profile, ProfileRaw> {
  toEntity(raw: ProfileRaw): Profile {
    return {
      id: raw.id,
      name: raw.name,
      isActive: raw.isActive === 1,
      isDefault: raw.isDefault === 1,
      valid: raw.valid === 1,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  toRaw(entity: Partial<Profile>): ProfileRaw {
    return {
      id: entity.id || '',
      name: entity.name || '',
      isActive: entity.isActive ? 1 : 0,
      isDefault: entity.isDefault ? 1 : 0,
      valid: entity.valid !== undefined ? (entity.valid ? 1 : 0) : 1,
      createdAt: entity.createdAt || '',
      updatedAt: entity.updatedAt || '',
    };
  }

  /**
   * すべてのプロファイルを取得（有効なもののみ）
   */
  getAll(): Profile[] {
    const result = this.fetchAll(`
      SELECT * FROM profiles
      WHERE valid = 1
      ORDER BY createdAt ASC
    `);
    Logger.info(`[ProfileMapper.getAll] Found ${result.length} valid profiles`);
    return result;
  }

  /**
   * すべてのプロファイルを取得（無効なものも含む）
   * 設定画面での表示用
   */
  getAllIncludingInvalid(): Profile[] {
    return this.fetchAll(`
      SELECT * FROM profiles
      ORDER BY createdAt ASC
    `);
  }

  /**
   * IDでプロファイルを取得
   */
  getById(id: string): Profile | null {
    return this.fetchOne(`SELECT * FROM profiles WHERE id = ?`, [id]);
  }

  /**
   * 名前でプロファイルを取得
   */
  getByName(name: string): Profile | null {
    return this.fetchOne(`SELECT * FROM profiles WHERE name = ?`, [name]);
  }

  /**
   * アクティブなプロファイルを取得
   */
  getActive(): Profile | null {
    return this.fetchOne(`SELECT * FROM profiles WHERE isActive = 1 LIMIT 1`);
  }

  /**
   * 標準プロファイルを取得
   */
  getDefault(): Profile | null {
    return this.fetchOne(`SELECT * FROM profiles WHERE isDefault = 1 LIMIT 1`);
  }

  /**
   * プロファイルを作成
   */
  createProfile(input: CreateProfileInput, isDefault: boolean = false): Profile {
    const now = getCurrentTimestamp();
    const profile: Profile = {
      id: generateUniqueId(),
      name: input.name,
      isActive: false,
      isDefault: isDefault,
      valid: true,
      createdAt: now,
      updatedAt: now,
    };

    const raw = this.toRaw(profile);
    this.insert(
      `INSERT INTO profiles (id, name, isActive, isDefault, valid, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [raw.id, raw.name, raw.isActive, raw.isDefault, raw.valid, raw.createdAt, raw.updatedAt]
    );

    Logger.info(`[ProfileMapper] Created profile: ${profile.id} (isDefault: ${isDefault})`);
    return profile;
  }

  /**
   * プロファイルを更新
   */
  updateProfile(id: string, input: UpdateProfileInput): Profile | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const updated: Profile = {
      ...existing,
      ...input,
      updatedAt: getCurrentTimestamp(),
    };

    const raw = this.toRaw(updated);
    super.update(
      `UPDATE profiles
       SET name = ?, isActive = ?, isDefault = ?, valid = ?, updatedAt = ?
       WHERE id = ?`,
      [raw.name, raw.isActive, raw.isDefault, raw.valid, raw.updatedAt, id]
    );

    Logger.info(`[ProfileMapper] Updated profile: ${id}`);
    return updated;
  }

  /**
   * プロファイルを削除
   */
  deleteProfile(id: string): boolean {
    super.delete(`DELETE FROM profiles WHERE id = ?`, [id]);
    Logger.info(`[ProfileMapper] Deleted profile: ${id}`);
    return true;
  }

  /**
   * アクティブプロファイルを切り替え
   */
  setActive(id: string): boolean {
    try {
      // すべてのプロファイルを非アクティブに
      super.update(`UPDATE profiles SET isActive = 0`, []);

      // 指定されたプロファイルをアクティブに
      super.update(`UPDATE profiles SET isActive = 1, updatedAt = ? WHERE id = ?`, [getCurrentTimestamp(), id]);

      Logger.info(`[ProfileMapper] Set active profile: ${id}`);
      return true;
    } catch (error) {
      Logger.error('[ProfileMapper] Failed to set active profile:', error);
      return false;
    }
  }

  /**
   * プロファイルと変数をまとめて取得
   */
  getWithVariables(id: string): ProfileWithVariables | null {
    const profile = this.getById(id);
    if (!profile) return null;

    const variables = profileVariableMapper.getByProfileId(id);

    return {
      ...profile,
      variables,
    };
  }

  /**
   * すべてのプロファイルと変数をまとめて取得
   */
  getAllWithVariables(): ProfileWithVariables[] {
    const profiles = this.getAll();
    return profiles.map(profile => ({
      ...profile,
      variables: profileVariableMapper.getByProfileId(profile.id),
    }));
  }

  /**
   * プランに応じてvalidフラグを更新（FREE_PROFILES_LIMIT分だけ有効にする）
   * デフォルトプロファイル（isDefault=1）は常に有効で、limitにカウントする
   */
  updateValidFlags(limit: number): void {
    try {
      Logger.info(`[ProfileMapper] updateValidFlags called with limit: ${limit}`);

      // すべて無効にする
      super.update(`UPDATE profiles SET valid = 0`, []);

      // デフォルトプロファイルは常に有効にする（limitに含む）
      const defaultCount = database.getAllSync<{ count: number }>(`SELECT COUNT(*) as count FROM profiles WHERE isDefault = 1`);
      const defaultProfileCount = defaultCount[0]?.count || 0;

      super.update(`UPDATE profiles SET valid = 1 WHERE isDefault = 1`, []);

      // デフォルトを除いた残りの枠数を計算
      const remainingLimit = Math.max(0, limit - defaultProfileCount);

      if (remainingLimit > 0) {
        // createdAt ASCで上位N件を有効にする（デフォルト以外）
        super.update(`
          UPDATE profiles
          SET valid = 1
          WHERE id IN (
            SELECT id FROM profiles
            WHERE isDefault = 0
            ORDER BY createdAt ASC
            LIMIT ?
          )
        `, [remainingLimit]);
      }

      Logger.info(`[ProfileMapper] Updated valid flags: total ${limit} profiles (including default)`);
    } catch (error) {
      Logger.error('[ProfileMapper] Failed to update valid flags:', error);
      throw error;
    }
  }
}

class ProfileVariableMapper extends BaseMapper<ProfileVariable, ProfileVariableRaw> {
  toEntity(raw: ProfileVariableRaw): ProfileVariable {
    return {
      id: raw.id,
      profileId: raw.profileId,
      variableId: raw.variableId,
      value: raw.value,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  toRaw(entity: Partial<ProfileVariable>): ProfileVariableRaw {
    return {
      id: entity.id || '',
      profileId: entity.profileId || '',
      variableId: entity.variableId || '',
      value: entity.value || '',
      createdAt: entity.createdAt || '',
      updatedAt: entity.updatedAt || '',
    };
  }

  /**
   * プロファイルIDで変数を取得
   */
  getByProfileId(profileId: string): ProfileVariable[] {
    return this.fetchAll(
      `SELECT * FROM profile_variables WHERE profileId = ? ORDER BY createdAt ASC`,
      [profileId]
    );
  }

  /**
   * プロファイルIDで変数を取得（変数名を含む）
   * ProfileServiceのマップ生成用
   */
  getByProfileIdWithVariableNames(profileId: string): Array<{ name: string; value: string }> {
    const results = database.getAllSync<{ name: string; value: string }>(
      `SELECT v.name, pv.value
       FROM profile_variables pv
       JOIN variables v ON pv.variableId = v.id
       WHERE pv.profileId = ?
       ORDER BY pv.createdAt ASC`,
      [profileId]
    );
    return results;
  }

  /**
   * IDで変数を取得
   */
  getById(id: string): ProfileVariable | null {
    return this.fetchOne(`SELECT * FROM profile_variables WHERE id = ?`, [id]);
  }

  /**
   * プロファイルIDと変数IDで変数を取得
   */
  getByProfileIdAndVariableId(profileId: string, variableId: string): ProfileVariable | null {
    return this.fetchOne(
      `SELECT * FROM profile_variables WHERE profileId = ? AND variableId = ?`,
      [profileId, variableId]
    );
  }

  /**
   * 変数を作成（既存の場合は更新）
   * UPSERT操作を実現するため、INSERT OR REPLACE を使用
   */
  upsertVariable(input: CreateProfileVariableInput): ProfileVariable {
    const now = getCurrentTimestamp();

    try {
      // 既存レコードをチェック
      const existing = this.getByProfileIdAndVariableId(input.profileId, input.variableId);

      if (existing) {
        // 既存の場合: 値とupdatedAtのみ更新
        super.update(
          `UPDATE profile_variables SET value = ?, updatedAt = ? WHERE id = ?`,
          [input.value, now, existing.id]
        );
        Logger.info(`[ProfileVariableMapper] Updated existing variable: ${existing.id}`);
        return {
          ...existing,
          value: input.value,
          updatedAt: now,
        };
      }

      // 新規作成: 通常のINSERT
      const newId = generateUniqueId();
      const variable: ProfileVariable = {
        id: newId,
        profileId: input.profileId,
        variableId: input.variableId,
        value: input.value,
        createdAt: now,
        updatedAt: now,
      };

      super.insert(
        `INSERT INTO profile_variables (id, profileId, variableId, value, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [variable.id, variable.profileId, variable.variableId, variable.value, variable.createdAt, variable.updatedAt]
      );

      Logger.info(`[ProfileVariableMapper] Created variable: ${variable.id}`);
      return variable;
    } catch (error) {
      // UNIQUE制約エラーの場合（競合状態で発生する可能性がある）
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        Logger.warn('[ProfileVariableMapper] UNIQUE constraint error, retrying with update...');
        // 再度取得して更新
        const existing = this.getByProfileIdAndVariableId(input.profileId, input.variableId);
        if (existing) {
          super.update(
            `UPDATE profile_variables SET value = ?, updatedAt = ? WHERE id = ?`,
            [input.value, now, existing.id]
          );
          return {
            ...existing,
            value: input.value,
            updatedAt: now,
          };
        }
      }

      Logger.error('[ProfileVariableMapper] Failed to create/update variable:', error);
      throw error;
    }
  }

  /**
   * 変数を削除
   */
  deleteById(id: string): boolean {
    super.delete(`DELETE FROM profile_variables WHERE id = ?`, [id]);
    Logger.info(`[ProfileVariableMapper] Deleted variable: ${id}`);
    return true;
  }

  /**
   * プロファイルの変数をすべて削除
   */
  deleteByProfileId(profileId: string): boolean {
    super.delete(`DELETE FROM profile_variables WHERE profileId = ?`, [profileId]);
    Logger.info(`[ProfileVariableMapper] Deleted all variables for profile: ${profileId}`);
    return true;
  }
}

export const profileMapper = new ProfileMapper();
export const profileVariableMapper = new ProfileVariableMapper();
