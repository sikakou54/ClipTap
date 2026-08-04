/**
 * 変数サービス
 *
 * @description
 * カスタム変数のCRUD操作とリゾルバー生成を提供する共通サービス。
 * Mapper層を経由してデータアクセスを行う。
 *
 * @module VariableService
 */

import { VariableMapper } from '../mappers/VariableMapper';
import { ProfileVariableMapper } from '../mappers/ProfileMapper';
import { ProfileService } from './ProfileService';
import type { Variable, CreateVariableInput, UpdateVariableInput } from '../schema';
import type { VariableResolver } from '../variables/parser';
import { hasVariables, replaceVariables, VARIABLE_TOKEN_PATTERN } from '../variables/parser';
import { resolveSystemVariableValue } from '../variables/systemVariables';
import { SystemVariableFormatRegistry } from './SystemVariableFormatRegistry';
import {
  NotFoundError,
  DuplicateNameError,
  VariableNameRequiredError,
  VariableNameTooLongError,
  VariableNameInvalidError,
  VariableNameReservedError,
  SystemVariableDeleteError,
} from '../errors';
import { isReservedVariableName } from '../constants/variables';

/**
 * カスタム変数リゾルバー作成に必要なコンテキスト
 */
export interface VariableResolverContext {
  /** 購読状態（Proプランかどうか） */
  isSubscribed: boolean;
  /** 指定プロファイルの変数値マップ（変数名 → 値） */
  profileVariablesMap: Record<string, string>;
  /** デフォルトプロファイルの変数値マップ（変数名 → 値） */
  defaultProfileVariablesMap: Record<string, string>;
}

/** 変数名の最大長 */
const MAX_VARIABLE_NAME_LENGTH = 50;

/** 変数名のパターン（英数字とアンダースコアのみ、先頭は英字またはアンダースコア） */
const VARIABLE_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * 変数名のバリデーション
 */
function validateVariableName(name: string, currentId: string | null): void {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new VariableNameRequiredError();
  }

  if (trimmedName.length > MAX_VARIABLE_NAME_LENGTH) {
    throw new VariableNameTooLongError(MAX_VARIABLE_NAME_LENGTH, trimmedName.length);
  }

  if (!VARIABLE_NAME_PATTERN.test(trimmedName)) {
    throw new VariableNameInvalidError(trimmedName);
  }

  if (isReservedVariableName(trimmedName)) {
    throw new VariableNameReservedError(trimmedName);
  }

  const existing = VariableMapper.getByName(trimmedName);
  if (existing && existing.id !== currentId) {
    throw new DuplicateNameError('variable', trimmedName);
  }
}

/**
 * 変数サービス
 */
export class VariableService {
  /**
   * 全変数を取得（有効なもののみ）
   */
  static getAll(): Variable[] {
    return VariableMapper.getAll();
  }

  /**
   * 全変数を取得（無効なものも含む）
   */
  static getAllIncludingInvalid(): Variable[] {
    return VariableMapper.getAllIncludingInvalid();
  }

  /**
   * カスタム変数のみ取得
   */
  static getCustomVariables(): Variable[] {
    return VariableMapper.getCustomVariables();
  }

  /**
   * IDで変数を取得
   */
  static getById(id: string): Variable | null {
    return VariableMapper.getById(id);
  }

  /**
   * 名前で変数を取得
   */
  static getByName(name: string): Variable | null {
    return VariableMapper.getByName(name);
  }

  /**
   * 変数を作成
   * @throws {VariableNameRequiredError} 変数名が空の場合
   * @throws {VariableNameTooLongError} 変数名が長すぎる場合
   * @throws {VariableNameInvalidError} 変数名の形式が無効な場合
   * @throws {VariableNameReservedError} システム変数名と衝突する場合
   * @throws {DuplicateNameError} 同名の変数が既に存在する場合
   */
  static create(data: CreateVariableInput): Variable {
    /* 変数名のバリデーション（空文字、長さ、形式、予約語、重複チェック） */
    validateVariableName(data.name, null);

    /* バリデーション通過後、名前をトリムしてMapper層に処理を委譲 */
    return VariableMapper.create({
      ...data,
      name: data.name.trim(),
    });
  }

  /**
   * 変数を更新
   * @throws {NotFoundError} 変数が存在しない場合
   * @throws {VariableNameRequiredError} 変数名が空の場合
   * @throws {VariableNameTooLongError} 変数名が長すぎる場合
   * @throws {VariableNameInvalidError} 変数名の形式が無効な場合
   * @throws {VariableNameReservedError} システム変数名と衝突する場合
   * @throws {DuplicateNameError} 同名の変数が既に存在する場合
   */
  static update(id: string, data: UpdateVariableInput): Variable {
    /* 更新対象の変数が存在するか確認 */
    const existing = VariableMapper.getById(id);
    if (!existing) {
      throw new NotFoundError('variable', id);
    }

    /* 名前が更新される場合のみバリデーションを実行（自分自身との重複は許可） */
    if (data.name !== undefined) {
      validateVariableName(data.name, id);
    }

    /* バリデーション通過後、名前をトリムしてMapper層に処理を委譲 */
    return VariableMapper.update(id, {
      ...data,
      name: data.name?.trim(),
    });
  }

  /**
   * 変数を削除
   * @throws {NotFoundError} 変数が存在しない場合
   * @throws {SystemVariableDeleteError} システム変数を削除しようとした場合
   */
  static delete(id: string): void {
    /* 削除対象の変数が存在するか確認 */
    const variable = VariableMapper.getById(id);
    if (!variable) {
      throw new NotFoundError('variable', id);
    }

    /* システム変数は削除不可（保護） */
    if (variable.type === 'system') {
      throw new SystemVariableDeleteError();
    }

    /* 手動カスケード削除: 変数に紐づく全プロファイル値を先に削除（参照整合性維持） */
    ProfileVariableMapper.deleteByVariableId(id);
    /* 変数本体を削除 */
    VariableMapper.delete(id);
  }

  /**
   * 変数数を取得
   */
  static count(): number {
    return VariableMapper.count();
  }

  /**
   * 有効なカスタム変数のみ取得
   */
  static getValidCustomVariables(): Variable[] {
    return VariableMapper.getAll().filter((v) => v.type === 'custom');
  }

  /**
   * 有効な変数数を取得
   */
  static countValid(): number {
    return VariableMapper.getAll().filter((v) => v.type === 'custom').length;
  }

  /**
   * プランに応じてvalidフラグを更新
   */
  static updateValidFlags(limit: number): void {
    VariableMapper.updateValidFlags(limit);
  }

  /**
   * 変数の標準値を取得
   */
  static getStandardValue(variableName: string): string {
    const defaultVariablesMap = ProfileService.getDefaultProfileVariablesMap();
    return defaultVariablesMap[variableName] || '';
  }

  /**
   * カスタム変数リゾルバーを作成
   */
  static createCustomVariableResolver(
    context: VariableResolverContext,
    options?: { freeTierLimit?: number }
  ): VariableResolver {
    const freeTierLimit = options?.freeTierLimit ?? 5;

    return (name: string): string | null => {
      /* カスタム変数のみを取得 */
      const customVariables = VariableMapper.getAll().filter((v) => v.type === 'custom');

      /* Proプランの場合は全カスタム変数、無料プランの場合は作成日時が古い順に制限数までのみ有効 */
      const enabledVariables = context.isSubscribed
        ? customVariables
        : customVariables.slice(0, freeTierLimit);

      /* 指定された名前の変数を検索 */
      const variable = enabledVariables.find((v) => v.name === name);
      if (!variable) {
        return null;
      }

      /* 値の解決優先順位: 指定プロファイル → デフォルトプロファイル → 空文字 */
      if (context.profileVariablesMap[name] !== undefined) {
        return context.profileVariablesMap[name];
      }

      if (context.defaultProfileVariablesMap[name] !== undefined) {
        return context.defaultProfileVariablesMap[name];
      }

      /* プロファイル変数に値が設定されていない場合は空文字を返す */
      return '';
    };
  }

  /**
   * プラットフォーム固有のコンテキストを注入してカスタム変数リゾルバーを作成
   */
  static createContextualVariableResolver(
    subscriptionService: { isSubscribed(): boolean },
    options?: { freeTierLimit?: number }
  ): (profileId?: string) => VariableResolver {
    return (profileId?: string): VariableResolver => {
      const isSubscribed = subscriptionService.isSubscribed();
      const profileVariablesMap = profileId
        ? this.getProfileVariablesMap(profileId)
        : this.getActiveProfileVariablesMap();
      const defaultProfileVariablesMap = this.getDefaultProfileVariablesMap();

      return this.createCustomVariableResolver(
        { isSubscribed, profileVariablesMap, defaultProfileVariablesMap },
        options
      );
    };
  }

  /**
   * プロファイルの変数マップを取得
   */
  private static getProfileVariablesMap(profileId: string): Record<string, string> {
    return ProfileService.getProfileVariablesMap(profileId);
  }

  /**
   * アクティブプロファイルの変数マップを取得
   */
  private static getActiveProfileVariablesMap(): Record<string, string> {
    return ProfileService.getActiveProfileVariablesMap();
  }

  /**
   * デフォルトプロファイルの変数マップを取得
   */
  private static getDefaultProfileVariablesMap(): Record<string, string> {
    return ProfileService.getDefaultProfileVariablesMap();
  }

  /* ======================================== */
  /* 変数値の操作 */
  /* ======================================== */

  /**
   * 変数名の重複チェック
   * @param name - チェックする変数名
   * @param excludeId - 除外する変数ID（編集時に自分自身を除外）
   * @returns 重複している場合はtrue
   */
  static isNameDuplicate(name: string, excludeId?: string): boolean {
    const existing = VariableMapper.getByName(name);
    return existing !== null && existing.id !== excludeId;
  }

  /**
   * カスタム変数を作成または更新（名前ベースのupsert）
   *
   * @param data - 変数の情報（nameで既存を検索、あれば更新、なければ新規作成）
   * @returns 作成/更新された変数
   * @throws {VariableNameRequiredError} 変数名が空の場合
   * @throws {VariableNameTooLongError} 変数名が長すぎる場合
   * @throws {VariableNameInvalidError} 変数名の形式が無効な場合
   * @throws {VariableNameReservedError} システム変数名と衝突する場合
   * @throws {DuplicateNameError} 同名の変数が既に存在する場合（自分以外）
   */
  static upsert(data: CreateVariableInput & { sortOrder?: number }): Variable {
    const existing = VariableMapper.getByName(data.name);
    if (existing) {
      /* 既存変数を更新（sortOrderが指定されている場合のみ更新） */
      const updateData: UpdateVariableInput = {
        name: data.name,
        label: data.label,
        icon: data.icon,
      };
      if (data.sortOrder !== undefined) {
        updateData.sortOrder = data.sortOrder;
      }
      return this.update(existing.id, updateData);
    } else {
      /* 新規作成（sortOrderは自動採番） */
      return this.create({
        name: data.name,
        type: 'custom',
        label: data.label,
        icon: data.icon,
      });
    }
  }

  /**
   * プロファイル別の変数値を一括で作成/更新
   * @param variableId - 変数ID
   * @param profileValues - プロファイルIDと値のマップ
   */
  static upsertValuesForProfiles(variableId: string, profileValues: Record<string, string>): void {
    for (const [profileId, value] of Object.entries(profileValues)) {
      const trimmedValue = value.trim();

      /* 空文字の場合は削除してデフォルトプロファイルの値にフォールバック */
      if (trimmedValue === '') {
        this.deleteValueForProfile(profileId, variableId);
      } else {
        ProfileVariableMapper.upsert({
          profileId,
          variableId,
          value: trimmedValue,
        });
      }
    }
  }

  /**
   * 単一プロファイルの変数値を作成/更新
   * @param profileId - プロファイルID
   * @param variableId - 変数ID
   * @param value - 変数値
   */
  static upsertValueForProfile(profileId: string, variableId: string, value: string): void {
    ProfileVariableMapper.upsert({
      profileId,
      variableId,
      value: value.trim(),
    });
  }

  /**
   * 単一プロファイルの変数値を削除
   * @param profileId - プロファイルID
   * @param variableId - 変数ID
   * @returns 削除に成功した場合はtrue
   */
  static deleteValueForProfile(profileId: string, variableId: string): boolean {
    const existing = ProfileVariableMapper.get(profileId, variableId);
    if (existing) {
      ProfileVariableMapper.delete(existing.id);
      return true;
    }
    return false;
  }

  /**
   * 複数プロファイルの変数値を削除
   * @param variableId - 変数ID
   * @param profileIds - プロファイルIDの配列
   */
  static deleteValuesForProfiles(variableId: string, profileIds: string[]): void {
    for (const profileId of profileIds) {
      this.deleteValueForProfile(profileId, variableId);
    }
  }

  /**
   * 全カスタム変数の取得（sortOrder順でソート済み）
   * @returns カスタム変数の配列
   */
  static getAllCustomVariablesSorted(): Variable[] {
    // Mapper側で既にsortOrder ASCでソート済み
    return VariableMapper.getByType('custom');
  }

  /**
   * 全カスタム変数の取得（無効なものも含む、sortOrder順でソート済み）
   * @returns カスタム変数の配列
   */
  static getAllCustomVariablesIncludingInvalidSorted(): Variable[] {
    // Mapper側で既にsortOrder ASCでソート済み
    return VariableMapper.getAllIncludingInvalid().filter((v) => v.type === 'custom');
  }

  /**
   * 有効なカスタム変数のみを取得（Free tier制限付き）
   * @param isSubscribed - Proプランに加入している場合はtrue
   * @param freeTierLimit - 無料プランの変数数制限（デフォルト: 5）
   * @returns 有効なカスタム変数の配列
   */
  static getEnabledCustomVariables(isSubscribed: boolean, freeTierLimit: number = 5): Variable[] {
    const sortedVars = this.getAllCustomVariablesSorted();
    return isSubscribed ? sortedVars : sortedVars.slice(0, freeTierLimit);
  }

  /* ======================================== */
  /* 同期版 変数展開（UI表示用） */
  /* ======================================== */

  /**
   * テキスト内の変数を同期的に展開（UI表示用）
   *
   * @description
   * システム変数とカスタム変数を同期的に展開します。
   * useDashboard等のUI表示用途に最適化されています。
   *
   * @param text - 展開対象のテキスト
   * @param options - 展開オプション
   * @returns 変数展開後のテキスト
   */
  static expandTextSync(
    text: string,
    options: {
      locale: string;
      profileVariablesMap: Record<string, string>;
      defaultProfileVariablesMap: Record<string, string>;
      variables?: Variable[];
    }
  ): string {
    const { locale, profileVariablesMap, defaultProfileVariablesMap, variables } = options;

    if (!hasVariables(text)) {
      return text;
    }

    const validVariables = variables ?? VariableMapper.getAll().filter((v) => v.valid);

    return text.replace(VARIABLE_TOKEN_PATTERN, (match: string, variableName: string): string => {
      const trimmedName = variableName.trim();

      /* システム変数を最優先で解決（ユーザー定義変数で上書き不可） */
      const systemValue = resolveSystemVariableValue(
        trimmedName,
        locale,
        new Date(),
        SystemVariableFormatRegistry.getAll()
      );
      if (systemValue !== null) {
        return systemValue;
      }

      /* validフラグがtrueのカスタム変数のみ展開対象 */
      const variable = validVariables.find((v) => v.name === trimmedName);
      if (!variable) {
        return match; // 未知の変数はそのまま保持
      }

      /* 値の解決優先順位: プロファイル固有 → デフォルト → 未設定（トークン保持） */
      const profileValue = profileVariablesMap[variable.name];
      if (profileValue !== undefined) {
        return profileValue;
      }

      const defaultValue = defaultProfileVariablesMap[variable.name];
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      /* 値が未設定の場合はトークンを保持してユーザーに気づかせる */
      return match;
    });
  }

  /**
   * プロファイルIDから変数マップを構築するヘルパー
   *
   * @param profileId - プロファイルID
   * @param variables - 変数の配列
   * @param profileVariables - プロファイル変数の配列
   * @returns 変数名から値へのマップ
   */
  static buildProfileVariablesMapFromArrays(
    profileId: string | null,
    variables: Variable[],
    profileVariables: Array<{ profileId: string; variableId: string; value: string }>
  ): Record<string, string> {
    if (!profileId) return {};

    const map: Record<string, string> = {};
    for (const pv of profileVariables) {
      if (pv.profileId === profileId) {
        const variable = variables.find((v) => v.id === pv.variableId);
        if (variable) {
          map[variable.name] = pv.value;
        }
      }
    }
    return map;
  }

  /* ======================================== */
  /* プレビュー生成 */
  /* ======================================== */

  /**
   * テキストの変数を解決してプレビュー用のテキストを生成
   *
   * @param title - タイトルテキスト
   * @param content - コンテンツテキスト
   * @param options - オプション
   * @param options.locale - ロケール（デフォルト: 'en'）
   * @param options.customResolver - カスタム変数リゾルバー
   * @param options.preserveUnknown - 未知の変数をそのまま保持するか（デフォルト: true）
   * @returns 解決されたタイトルとコンテンツ
   */
  static async resolvePreviewText(
    title: string,
    content: string,
    options: {
      locale?: string;
      customResolver?: VariableResolver;
      preserveUnknown?: boolean;
    } = {}
  ): Promise<{ title: string; content: string }> {
    const { locale = 'en', customResolver, preserveUnknown = true } = options;

    const titleHasVars = hasVariables(title);
    const contentHasVars = hasVariables(content);

    const resolvedTitle = !title
      ? ''
      : titleHasVars
        ? await replaceVariables(title, {
            locale,
            customResolver,
            preserveUnknown,
            formats: SystemVariableFormatRegistry.getAll(),
          })
        : title;

    const resolvedContent = !content
      ? ''
      : contentHasVars
        ? await replaceVariables(content, {
            locale,
            customResolver,
            preserveUnknown,
            formats: SystemVariableFormatRegistry.getAll(),
          })
        : content;

    return { title: resolvedTitle, content: resolvedContent };
  }
}
