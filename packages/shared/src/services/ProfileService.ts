/**
 * プロファイルサービス
 *
 * @description
 * プロファイル（環境）のCRUD操作と変数値の設定を提供する共通サービス。
 * Mapper層を経由してデータアクセスを行う。
 *
 * @module ProfileService
 */

import { ProfileMapper, ProfileVariableMapper } from '../mappers/ProfileMapper';
import type {
  Profile,
  ProfileVariable,
  CreateProfileInput,
  UpdateProfileInput,
} from '../schema';
import { NotFoundError, DefaultProfileDeleteError, DuplicateNameError, EmptyContentError } from '../errors';

/**
 * プロファイルサービス
 *
 * @description
 * 静的メソッドでプロファイル操作を提供。
 * バリデーションを行い、Mapper層に処理を委譲。
 */
export class ProfileService {
  /**
   * 全プロファイルを取得（有効なもののみ）
   *
   * @returns 有効なプロファイルの配列（validフラグがtrueのもののみ）
   *
   * @remarks
   * - 無料プランの場合、上限を超えたプロファイルはvalidフラグがfalseになる
   * - sortOrder順でソート済み
   */
  static getAll(): Profile[] {
    return ProfileMapper.getAll();
  }

  /**
   * 全プロファイルを取得（無効なものも含む）
   *
   * @returns すべてのプロファイルの配列（validフラグに関わらず）
   *
   * @remarks
   * - 管理画面等で全プロファイルを表示する際に使用
   */
  static getAllIncludingInvalid(): Profile[] {
    return ProfileMapper.getAllIncludingInvalid();
  }

  /**
   * IDでプロファイルを取得
   *
   * @param id - プロファイルのID
   * @returns プロファイルオブジェクト（存在しない場合はnull）
   */
  static getById(id: string): Profile | null {
    return ProfileMapper.getById(id);
  }

  /**
   * 名前でプロファイルを取得
   *
   * @param name - プロファイル名
   * @returns プロファイルオブジェクト（存在しない場合はnull）
   */
  static getByName(name: string): Profile | null {
    return ProfileMapper.getByName(name);
  }

  /**
   * アクティブなプロファイルを取得
   *
   * @returns アクティブなプロファイル（存在しない場合はnull）
   *
   * @remarks
   * - 現在選択されているプロファイルを取得
   * - 変数展開時にデフォルトで使用される
   */
  static getActive(): Profile | null {
    return ProfileMapper.getActive();
  }

  /**
   * デフォルトプロファイルを取得
   *
   * @returns デフォルトプロファイル（存在しない場合はnull）
   *
   * @remarks
   * - isDefaultフラグがtrueのプロファイルを取得
   * - 通常は最初に作成されたプロファイル
   */
  static getDefault(): Profile | null {
    return ProfileMapper.getDefault();
  }

  /**
   * プロファイルを作成
   * @throws {EmptyContentError} プロファイル名が空の場合
   * @throws {DuplicateNameError} 同名のプロファイルが既に存在する場合
   */
  static create(data: CreateProfileInput): Profile {
    /* プロファイル名の前後空白をトリム */
    const trimmedName = data.name.trim();
    /* 空文字チェック（空白のみも不可） */
    if (!trimmedName) {
      throw new EmptyContentError();
    }

    /* 同名のプロファイルが既に存在するかチェック */
    const existing = ProfileMapper.getByName(trimmedName);
    if (existing) {
      throw new DuplicateNameError('profile', trimmedName);
    }

    /* バリデーション通過後、Mapper層に処理を委譲 */
    return ProfileMapper.create({ ...data, name: trimmedName });
  }

  /**
   * プロファイルを更新
   * @throws {NotFoundError} プロファイルが存在しない場合
   * @throws {EmptyContentError} プロファイル名が空の場合
   * @throws {DuplicateNameError} 同名のプロファイルが既に存在する場合
   */
  static update(id: string, data: UpdateProfileInput): Profile {
    /* 更新対象のプロファイルが存在するか確認 */
    const existing = ProfileMapper.getById(id);
    if (!existing) {
      throw new NotFoundError('profile', id);
    }

    let updateData = { ...data };
    /* プロファイル名が指定されている場合はバリデーションと重複チェック */
    if (data.name !== undefined) {
      /* プロファイル名の前後空白をトリム */
      const trimmedName = data.name.trim();
      /* 空文字チェック（空白のみも不可） */
      if (!trimmedName) {
        throw new EmptyContentError();
      }

      /* 名前が変更される場合のみ重複チェック（自分自身は除外） */
      if (trimmedName !== existing.name) {
        const duplicate = ProfileMapper.getByName(trimmedName);
        if (duplicate) {
          throw new DuplicateNameError('profile', trimmedName);
        }
      }

      /* トリム済みの名前で更新データを準備 */
      updateData = { ...updateData, name: trimmedName };
    }

    /* バリデーション通過後、Mapper層に処理を委譲 */
    return ProfileMapper.update(id, updateData);
  }

  /**
   * プロファイルを削除
   * @throws {NotFoundError} プロファイルが存在しない場合
   * @throws {DefaultProfileDeleteError} デフォルトプロファイルを削除しようとした場合
   */
  static delete(id: string): void {
    /* 削除対象のプロファイルが存在するか確認 */
    const profile = ProfileMapper.getById(id);
    if (!profile) {
      throw new NotFoundError('profile', id);
    }

    /* デフォルトプロファイルは削除不可（保護） */
    if (profile.isDefault) {
      throw new DefaultProfileDeleteError();
    }

    /* カスケード削除: プロファイル変数を先に削除してからプロファイルを削除（参照整合性維持） */
    ProfileVariableMapper.deleteByProfileId(id);
    ProfileMapper.delete(id);
  }

  /**
   * アクティブプロファイルを切り替え
   * @throws {NotFoundError} プロファイルが存在しない場合
   */
  static setActive(id: string): void {
    /* アクティブにするプロファイルが存在するか確認 */
    const profile = ProfileMapper.getById(id);
    if (!profile) {
      throw new NotFoundError('profile', id);
    }

    /* Mapper層に処理を委譲（全プロファイルのisActiveをリセット後、指定プロファイルのみアクティブ化） */
    ProfileMapper.setActive(id);
  }

  /**
   * デフォルトプロファイルを設定
   * @param id - デフォルトにするプロファイルID
   * @throws {NotFoundError} プロファイルが存在しない場合
   */
  static setDefault(id: string): void {
    /* デフォルトにするプロファイルが存在するか確認 */
    const profile = ProfileMapper.getById(id);
    if (!profile) {
      throw new NotFoundError('profile', id);
    }

    /* Mapper層に処理を委譲（全プロファイルのisDefaultをリセット後、指定プロファイルのみデフォルト化） */
    ProfileMapper.setDefault(id);
  }

  /**
   * プロファイル数を取得
   */
  static count(): number {
    return ProfileMapper.count();
  }

  /**
   * プランに応じてvalidフラグを更新
   */
  static updateValidFlags(limit: number): void {
    ProfileMapper.updateValidFlags(limit);
  }

  /* ======================================== */
  /* ProfileVariable操作 */
  /* ======================================== */

  /**
   * プロファイル変数の値を設定
   */
  static setProfileVariable(profileId: string, variableId: string, value: string): ProfileVariable {
    return ProfileVariableMapper.upsert({ profileId, variableId, value });
  }

  /**
   * プロファイル変数の値を削除
   */
  static deleteProfileVariable(profileId: string, variableId: string): void {
    const existing = ProfileVariableMapper.get(profileId, variableId);
    if (existing) {
      ProfileVariableMapper.delete(existing.id);
    }
  }

  /**
   * 全プロファイル変数を取得
   */
  static getAllProfileVariables(): ProfileVariable[] {
    return ProfileVariableMapper.getAll();
  }

  /**
   * 変数の全プロファイル値を一括設定
   */
  static setVariableValuesForVariable(
    _variableId: string,
    values: { profileId: string; variableId: string; value: string }[]
  ): void {
    for (const v of values) {
      ProfileVariableMapper.upsert(v);
    }
  }

  /**
   * プロファイルの変数マップを取得
   */
  static getProfileVariablesMap(profileId: string): Record<string, string> {
    const variables = ProfileVariableMapper.getByProfileIdWithVariableNames(profileId);
    const map: Record<string, string> = {};
    for (const v of variables) {
      map[v.name] = v.value;
    }
    return map;
  }

  /**
   * アクティブプロファイルの変数マップを取得
   */
  static getActiveProfileVariablesMap(): Record<string, string> {
    const activeProfile = ProfileMapper.getActive();
    if (!activeProfile) {
      return {};
    }
    return this.getProfileVariablesMap(activeProfile.id);
  }

  /**
   * デフォルトプロファイルの変数マップを取得
   */
  static getDefaultProfileVariablesMap(): Record<string, string> {
    const defaultProfile = ProfileMapper.getDefault();
    if (!defaultProfile) {
      return {};
    }
    return this.getProfileVariablesMap(defaultProfile.id);
  }

  /* ======================================== */
  /* 拡張メソッド（Mobile/Web共通） */
  /* ======================================== */

  /**
   * プロファイルIDで変数一覧を取得
   * @param profileId - プロファイルID
   * @returns プロファイル変数一覧
   */
  static getProfileVariables(profileId: string): ProfileVariable[] {
    return ProfileVariableMapper.getByProfileId(profileId);
  }

  /**
   * プロファイルを作成（最初のプロファイルは自動的にアクティブ化）
   * @param input - 作成するプロファイルの情報
   * @returns 作成されたプロファイル
   *
   * @remarks
   * - 1つ目のプロファイルを作成した場合は自動的にアクティブ化する
   */
  static createWithAutoActivate(input: CreateProfileInput): Profile {
    const profile = this.create(input);

    const allProfiles = this.getAll();
    if (allProfiles.length === 1) {
      ProfileMapper.setActive(profile.id);
      const updatedProfile = this.getById(profile.id);
      return updatedProfile || profile;
    }

    return profile;
  }

  /**
   * プロファイルを削除（アクティブなプロファイルの自動切り替え付き）
   * @param id - 削除するプロファイルのID
   * @param onAfterDelete - 削除後のコールバック（validフラグ更新等に使用）
   * @returns 削除に成功した場合はtrue
   *
   * @remarks
   * - 削除対象がアクティブな場合、デフォルト（標準）プロファイルにアクティブを切り替える
   * - デフォルトプロファイルは削除不可なので、必ず切り替え先が存在する
   */
  static deleteWithAutoSwitch(id: string, onAfterDelete?: () => void): boolean {
    const profile = this.getById(id);
    if (!profile) return false;

    /* アクティブなプロファイルを削除する場合は、デフォルトプロファイルに切り替え */
    if (profile.isActive) {
      const defaultProfile = this.getDefault();
      if (defaultProfile) {
        ProfileMapper.setActive(defaultProfile.id);
      }
    }

    this.delete(id);

    if (onAfterDelete) {
      onAfterDelete();
    }

    return true;
  }

  /**
   * プロファイルを作成または更新（upsert）
   *
   * @param data - プロファイルの情報（nameで既存を検索、あれば更新、なければ新規作成）
   * @returns 作成/更新されたプロファイル
   * @throws {EmptyContentError} プロファイル名が空の場合
   * @throws {DuplicateNameError} 同名のプロファイルが既に存在する場合（自分以外）
   */
  static upsert(data: CreateProfileInput): Profile {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      throw new EmptyContentError();
    }

    const existing = ProfileMapper.getByName(trimmedName);
    if (existing) {
      /* 既存プロファイルを更新（sortOrderが指定されている場合のみ更新） */
      const updateData: UpdateProfileInput = {
        name: trimmedName,
      };
      if (data.sortOrder !== undefined) {
        updateData.sortOrder = data.sortOrder;
      }
      return this.update(existing.id, updateData);
    } else {
      /* 新規作成（sortOrderは自動採番） */
      return this.create({
        name: trimmedName,
      });
    }
  }
}
