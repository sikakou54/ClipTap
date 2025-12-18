/**
 * ProfileService - プロファイル管理サービス
 */

import { profileMapper, profileVariableMapper } from '../mappers/ProfileMapper';
import {
  Profile,
  ProfileVariable,
  ProfileWithVariables,
  CreateProfileInput,
  UpdateProfileInput,
  CreateProfileVariableInput,
  UpdateProfileVariableInput,
} from '../types/profile';
import { Logger } from '../logger';
import i18next from 'i18next';

class ProfileService {
  /**
   * すべてのプロファイルを取得（有効なもののみ）
   */
  getAllProfiles(): Profile[] {
    return profileMapper.getAll();
  }

  /**
   * すべてのプロファイルを取得（無効なものも含む）
   * 設定画面での表示用
   */
  getAllProfilesIncludingInvalid(): Profile[] {
    return profileMapper.getAllIncludingInvalid();
  }

  /**
   * プロファイルを取得（変数込み）
   */
  getAllProfilesWithVariables(): ProfileWithVariables[] {
    return profileMapper.getAllWithVariables();
  }

  /**
   * IDでプロファイルを取得
   */
  getProfileById(id: string): Profile | null {
    return profileMapper.getById(id);
  }

  /**
   * プロファイルを取得（変数込み）
   */
  getProfileWithVariables(id: string): ProfileWithVariables | null {
    return profileMapper.getWithVariables(id);
  }

  /**
   * アクティブなプロファイルを取得
   */
  getActiveProfile(): Profile | null {
    return profileMapper.getActive();
  }

  /**
   * アクティブなプロファイルを取得（変数込み）
   */
  getActiveProfileWithVariables(): ProfileWithVariables | null {
    const activeProfile = this.getActiveProfile();
    if (!activeProfile) return null;

    return profileMapper.getWithVariables(activeProfile.id);
  }

  /**
   * デフォルトプロファイルを取得
   */
  getDefaultProfile(): Profile | null {
    return profileMapper.getDefault();
  }

  /**
   * プロファイルを作成
   */
  createProfile(input: CreateProfileInput): Profile {
    // 名前をトリムして検証
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error(i18next.t('error.empty_content'));
    }

    // 名前の重複チェック
    const existing = profileMapper.getByName(trimmedName);
    if (existing) {
      throw new Error(i18next.t('error.duplicate_profile_name'));
    }

    const profile = profileMapper.createProfile({ ...input, name: trimmedName });

    // 最初のプロファイルの場合は自動的にアクティブに設定
    const allProfiles = this.getAllProfiles();
    if (allProfiles.length === 1) {
      profileMapper.setActive(profile.id);
      // アクティブ状態を反映した最新のプロファイルを取得
      const updatedProfile = profileMapper.getById(profile.id);
      return updatedProfile || profile;
    }

    return profile;
  }

  /**
   * プロファイルを更新
   */
  updateProfile(id: string, input: UpdateProfileInput): Profile | null {
    // 名前を変更する場合は重複チェック
    if (input.name) {
      const trimmedName = input.name.trim();
      if (!trimmedName) {
        throw new Error(i18next.t('error.empty_content'));
      }

      const existing = profileMapper.getByName(trimmedName);
      if (existing && existing.id !== id) {
        throw new Error(i18next.t('error.duplicate_profile_name'));
      }

      input = { ...input, name: trimmedName };
    }

    return profileMapper.updateProfile(id, input);
  }

  /**
   * プロファイルを削除
   */
  deleteProfile(id: string): boolean {
    const profile = this.getProfileById(id);
    if (!profile) return false;

    // アクティブなプロファイルを削除する場合は、別のプロファイルをアクティブにする
    if (profile.isActive) {
      const allProfiles = this.getAllProfiles();
      const otherProfiles = allProfiles.filter(p => p.id !== id);

      if (otherProfiles.length > 0) {
        profileMapper.setActive(otherProfiles[0].id);
      }
    }

    // プロファイルを削除（CASCADE で変数も自動削除される）
    const result = profileMapper.deleteProfile(id);

    // 削除後、validフラグを再計算（次の環境が有効になる可能性がある）
    if (result) {
      // Note: Lazy import to avoid circular dependency
      import('./PurchaseService').then(({ purchaseService }) => {
        purchaseService.updateValidFlags();
        Logger.info('[ProfileService] Updated valid flags after profile deletion');
      }).catch(error => {
        Logger.error('[ProfileService] Failed to update valid flags:', error);
      });
    }

    return result;
  }

  /**
   * アクティブプロファイルを切り替え
   */
  setActiveProfile(id: string): boolean {
    const profile = this.getProfileById(id);
    if (!profile) {
      Logger.error(`[ProfileService] Profile not found: ${id}`);
      return false;
    }

    return profileMapper.setActive(id);
  }

  /**
   * プロファイル変数を取得
   */
  getProfileVariables(profileId: string): ProfileVariable[] {
    return profileVariableMapper.getByProfileId(profileId);
  }

  /**
   * アクティブなプロファイルの変数を取得
   */
  getActiveProfileVariables(): ProfileVariable[] {
    const activeProfile = this.getActiveProfile();
    if (!activeProfile) return [];

    return profileVariableMapper.getByProfileId(activeProfile.id);
  }

  /**
   * プロファイル変数を作成/更新（UPSERT）
   */
  upsertProfileVariable(input: CreateProfileVariableInput): ProfileVariable {
    // プロファイルの存在確認
    const profile = this.getProfileById(input.profileId);
    if (!profile) {
      throw new Error(`Profile not found: ${input.profileId}`);
    }

    // upsertVariableは既にUPSERTロジックを持っている
    return profileVariableMapper.upsertVariable(input);
  }

  /**
   * プロファイル変数を削除
   */
  deleteProfileVariable(id: string): boolean {
    return profileVariableMapper.deleteById(id);
  }

  /**
   * プロファイルの変数をすべて削除
   */
  deleteAllProfileVariables(profileId: string): boolean {
    return profileVariableMapper.deleteByProfileId(profileId);
  }

  /**
   * アクティブなプロファイルの変数をマップとして取得
   * VariableParserで使用
   */
  getActiveProfileVariablesMap(): Record<string, string> {
    const activeProfile = this.getActiveProfile();
    if (!activeProfile) return {};

    const variables = profileVariableMapper.getByProfileIdWithVariableNames(activeProfile.id);
    const map: Record<string, string> = {};

    for (const variable of variables) {
      map[variable.name] = variable.value;
    }

    return map;
  }

  /**
   * 指定したプロファイルの変数をマップとして取得
   * プレビュー用
   */
  getProfileVariablesMap(profileId: string): Record<string, string> {
    const variables = profileVariableMapper.getByProfileIdWithVariableNames(profileId);
    const map: Record<string, string> = {};

    for (const variable of variables) {
      map[variable.name] = variable.value;
    }

    return map;
  }

  /**
   * デフォルトプロファイルの変数をマップとして取得（標準値）
   */
  getDefaultProfileVariablesMap(): Record<string, string> {
    const defaultProfile = profileMapper.getDefault();
    if (!defaultProfile) return {};

    return this.getProfileVariablesMap(defaultProfile.id);
  }
}

export const profileService = new ProfileService();
