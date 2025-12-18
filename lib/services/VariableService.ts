/**
 * VariableService - 変数管理サービス
 */

import { Variable } from '../types/variable';
import { variableMapper } from '../mappers/VariableMapper';
import { profileVariableMapper, profileMapper } from '../mappers/ProfileMapper';
import { Logger } from '../logger';
import { RESERVED_VARIABLE_NAMES, MAX_VARIABLE_NAME_LENGTH } from '../constants/variables';
import i18next from 'i18next';
import { UI_CONSTANTS } from '../constants/ui';

export class VariableService {
  /**
   * 変数名のバリデーション
   */
  private validateVariableName(name: string, isNewVariable: boolean = false): void {
    // 空チェック
    if (!name || !name.trim()) {
      throw new Error(i18next.t('error.variable_name_required'));
    }

    // 長さチェック
    if (name.length > MAX_VARIABLE_NAME_LENGTH) {
      throw new Error(i18next.t('error.variable_name_too_long', { max: MAX_VARIABLE_NAME_LENGTH }));
    }

    // フォーマットチェック
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      throw new Error(i18next.t('error.variable_name_invalid'));
    }

    // 予約語チェック
    if (RESERVED_VARIABLE_NAMES.includes(name as any)) {
      throw new Error(i18next.t('error.variable_name_reserved', { name }));
    }

    // 重複チェック（新規作成時のみ）
    if (isNewVariable) {
      const existing = variableMapper.getByName(name);
      if (existing) {
        throw new Error(i18next.t('error.variable_name_exists', { name }));
      }
    }
  }

  /**
   * 変数名の重複チェック
   */
  isVariableNameDuplicate(name: string, excludeId?: string): boolean {
    try {
      const existing = variableMapper.getByName(name);
      // 存在しない、または編集中の変数自身の場合は重複ではない
      return existing !== null && existing.id !== excludeId;
    } catch (error) {
      Logger.error('Failed to check variable name duplicate:', error);
      return false;
    }
  }

  /**
   * カスタム変数のメタデータを作成または更新（variablesテーブルのみ）
   * ※profile_variablesには登録しない。値の登録はupsertVariableValuesForProfilesを使用。
   *
   * @param variableId - 変数ID（更新時に指定、新規作成時はundefined）
   * @param name - 変数名
   * @param label - 表示ラベル（オプション）
   * @param icon - アイコン名（オプション）
   */
  async upsertVariableMetadata(
    variableId: string | undefined,
    name: string,
    label?: string,
    icon?: string
  ): Promise<Variable> {
    try {
      // 変数メタデータの取得または作成
      let variable: Variable;

      if (variableId) {
        // 既存の変数: IDで取得して更新
        const existing = variableMapper.getById(variableId);
        if (!existing) {
          throw new Error(`Variable not found: ${variableId}`);
        }

        // 変数名が変更された場合はバリデーション
        if (existing.name !== name) {
          this.validateVariableName(name, false);

          // 重複チェック（自分自身を除く）
          if (this.isVariableNameDuplicate(name, variableId)) {
            throw new Error(i18next.t('error.variable_name_exists', { name }));
          }
        }

        const updated = variableMapper.updateById(variableId, { name, label, icon });
        if (!updated) throw new Error('Failed to update variable metadata');
        variable = updated;
        Logger.info(`[VariableService] Updated variable: ${name}`);

      } else {
        // 新規作成: バリデーション実行
        this.validateVariableName(name, true);

        variable = variableMapper.create({
          name,
          type: 'custom',
          label,
          icon,
        });
        Logger.info(`[VariableService] Created variable: ${name}`);
      }

      return variable;
    } catch (error) {
      Logger.error('[VariableService] Failed to create or update variable:', error);
      throw error;
    }
  }

  /**
   * プロファイル別の変数値を一括で作成/更新（profile_variablesテーブル）
   * ※値が空の場合は削除も行う（後方互換性のため）
   *
   * @param variableId - 変数ID
   * @param profileValues - { profileId: value } のマップ
   */
  async upsertVariableValuesForProfiles(
    variableId: string,
    profileValues: Record<string, string>
  ): Promise<void> {
    try {
      for (const [profileId, value] of Object.entries(profileValues)) {
        const trimmedValue = value.trim();

        if (trimmedValue === '') {
          // 値が空の場合は削除
          await this.deleteVariableValueForProfile(profileId, variableId);
        } else {
          // 値がある場合はUPSERT
          profileVariableMapper.upsertVariable({
            profileId,
            variableId,
            value: trimmedValue,
          });
          Logger.info(`[VariableService] Upserted profile variable for profile ${profileId}`);
        }
      }
    } catch (error) {
      Logger.error('[VariableService] Failed to upsert profile variables:', error);
      throw error;
    }
  }

  /**
   * 単一プロファイルの変数値を作成/更新
   */
  async upsertVariableValueForProfile(
    profileId: string,
    variableId: string,
    value: string
  ): Promise<void> {
    try {
      profileVariableMapper.upsertVariable({
        profileId,
        variableId,
        value: value.trim(),
      });
      Logger.info(`[VariableService] Upserted profile variable for profile ${profileId}`);
    } catch (error) {
      Logger.error('[VariableService] Failed to upsert profile variable:', error);
      throw error;
    }
  }

  /**
   * 単一プロファイルの変数値を削除
   */
  async deleteVariableValueForProfile(profileId: string, variableId: string): Promise<boolean> {
    try {
      const existing = profileVariableMapper.getByProfileIdAndVariableId(profileId, variableId);
      if (existing) {
        profileVariableMapper.deleteById(existing.id);
        Logger.info(`[VariableService] Deleted profile variable for profile ${profileId}`);
        return true;
      }
      return false;
    } catch (error) {
      Logger.error('[VariableService] Failed to delete profile variable:', error);
      return false;
    }
  }

  /**
   * 複数プロファイルの変数値を削除
   */
  async deleteVariableValuesForProfiles(
    variableId: string,
    profileIds: string[]
  ): Promise<void> {
    try {
      for (const profileId of profileIds) {
        await this.deleteVariableValueForProfile(profileId, variableId);
      }
    } catch (error) {
      Logger.error('[VariableService] Failed to delete profile variables:', error);
      throw error;
    }
  }


  /**
   * 全カスタム変数の取得（有効なもののみ、作成日時の昇順でソート済み）
   */
  getAllCustomVariables(): Variable[] {
    try {
      const allVars = variableMapper.getByType('custom');
      // 作成日時で昇順ソート
      return allVars.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } catch (error) {
      Logger.error('Failed to get all custom variables:', error);
      return [];
    }
  }

  /**
   * 全カスタム変数の取得（無効なものも含む、設定画面での表示用）
   */
  getAllCustomVariablesIncludingInvalid(): Variable[] {
    try {
      const allVars = variableMapper.getAllIncludingInvalid().filter(v => v.type === 'custom');
      // 作成日時で昇順ソート
      return allVars.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } catch (error) {
      Logger.error('Failed to get all custom variables including invalid:', error);
      return [];
    }
  }

  /**
   * 有効なカスタム変数のみを取得（作成日時の昇順でソート済み）
   * 無料版: 上位5個、Pro版: 全て
   */
  getEnabledCustomVariables(isSubscribed: boolean): Variable[] {
    try {
      const sortedVars = this.getAllCustomVariables();

      // Pro版は全て、無料版は上位指定個数のみ
      return isSubscribed ? sortedVars : sortedVars.slice(0, UI_CONSTANTS.FEATURE_LIMITS.FREE_TIER_VARIABLES);
    } catch (error) {
      Logger.error('Failed to get enabled custom variables:', error);
      return [];
    }
  }

  /**
   * 変数の取得
   */
  getVariableByName(name: string): Variable | null {
    try {
      return variableMapper.getByName(name);
    } catch (error) {
      Logger.error('Failed to get variable by name:', error);
      return null;
    }
  }

  /**
   * 変数を削除（IDベース）
   */
  deleteVariable(id: string): boolean {
    try {
      const variable = variableMapper.getById(id);
      if (!variable) {
        Logger.warn(`[VariableService] Variable not found: ${id}`);
        return false;
      }

      const result = variableMapper.deleteById(id);
      if (result) {
        Logger.info(`[VariableService] Variable deleted: ${variable.name} (${id})`);

        // 削除後、validフラグを再計算（次の変数が有効になる可能性がある）
        // Note: Lazy import to avoid circular dependency
        import('./PurchaseService').then(({ purchaseService }) => {
          purchaseService.updateValidFlags();
          Logger.info('[VariableService] Updated valid flags after variable deletion');
        }).catch(error => {
          Logger.error('[VariableService] Failed to update valid flags:', error);
        });
      }
      return result;
    } catch (error) {
      Logger.error('[VariableService] Failed to delete variable:', error);
      return false;
    }
  }

  /**
   * 変数の標準値を取得（デフォルトプロファイルの値）
   */
  getStandardValue(variableName: string): string {
    const defaultProfile = profileMapper.getDefault();
    if (!defaultProfile) return '';

    const variables = profileVariableMapper.getByProfileIdWithVariableNames(defaultProfile.id);
    const variable = variables.find(v => v.name === variableName);
    return variable?.value || '';
  }

  /**
   * プロファイル用のカスタム変数リゾルバーを作成
   * ※重複したリゾルバーロジックを統合
   *
   * @param profileId 対象プロファイルID（未指定の場合はアクティブプロファイル）
   * @returns CustomVariableResolver関数
   */
  createCustomVariableResolver(profileId?: string): (name: string) => Promise<string | null> {
    return async (name: string): Promise<string | null> => {
      try {
        // サブスクリプション状態を取得
        const { purchaseService } = await import('./PurchaseService');
        const isSubscribed = purchaseService.isSubscribed();

        // 有効なカスタム変数を取得
        const enabledVars = this.getEnabledCustomVariables(isSubscribed);
        const variable = enabledVars.find(v => v.name === name);

        if (!variable) return null;

        // プロファイル固有の値を取得
        const { profileService } = await import('./ProfileService');
        const profileVariablesMap = profileId
          ? profileService.getProfileVariablesMap(profileId)
          : profileService.getActiveProfileVariablesMap();

        if (profileVariablesMap[name]) {
          return profileVariablesMap[name];
        }

        // デフォルト値を取得
        const defaultProfileVariablesMap = profileService.getDefaultProfileVariablesMap();
        return defaultProfileVariablesMap[name] || '';
      } catch (error) {
        Logger.error(`[VariableService] Failed to resolve variable: ${name}`, error);
        return null;
      }
    };
  }

}

export const variableService = new VariableService();
