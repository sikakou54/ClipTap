/**
 * ImportMapper
 *
 * @description
 * 一時データベースからインポート候補を取得する共通ロジック。
 * DbAdapterを使用してプラットフォーム差異を吸収する。
 *
 * @module ImportMapper
 */

import type {
  ImportCandidates,
  ImportCandidateSnippet,
  ImportCandidateSnippetProfile,
  ImportCandidateProfile,
  ImportCandidateVariable,
  ImportCandidateCategory,
  ImportCandidateVariableProfileValue,
} from '../schema';
import type {
  ProfileVariableRow,
  SnippetProfileRow,
  SnippetImportRow,
  ProfileImportRow,
} from './IImportMapper';
import type { DbAdapter } from '../adapters/DbAdapter';
import type {
  Category,
  Profile,
  ProfileVariable,
  Snippet,
  SnippetProfile,
  Variable,
} from '../schema';
import type { SystemVariableFormatRow } from './SystemVariableFormatMapper';

export interface FullRestoreData {
  categories: Category[];
  variables: Variable[];
  profiles: Profile[];
  profileVariables: ProfileVariable[];
  snippets: Snippet[];
  snippetProfiles: SnippetProfile[];
  systemVariableFormats: SystemVariableFormatRow[];
}

/**
 * SQLプレースホルダーを生成
 * @param count - プレースホルダーの数
 * @returns プレースホルダー文字列 (例: "?, ?, ?")
 */
const placeholders = (count: number): string =>
  Array.from({ length: count }, () => '?').join(',');

/**
 * ImportMapperクラス
 *
 * @description
 * DbAdapterを使用してインポート候補データを取得する。
 * 一時データベースからインポート候補を取得する共通ロジック。
 * アダプターは呼び出し元でopen()済みであることを前提とする。
 */
export class ImportMapper {
  private adapter: DbAdapter;

  constructor(adapter: DbAdapter) {
    this.adapter = adapter;
  }

  getAllCandidates(): ImportCandidates {
    /* 1. スニペットの取得（プロファイル紐付き情報は後で追加） */
    /* LEFT JOINで未分類スニペットも含む */
    const snippetsRaw = this.adapter.all<Omit<ImportCandidateSnippet, 'profiles'>>(`
      SELECT
        s.id, s.title, s.content, s.updatedAt,
        c.name as categoryName
      FROM snippets s
      LEFT JOIN categories c ON s.categoryId = c.id
      ORDER BY s.updatedAt DESC
    `);

    /* 各スニペットに紐づくプロファイルを取得 */
    const snippets: ImportCandidateSnippet[] = [];
    for (const s of snippetsRaw) {
      /* LEFT JOINでプロファイルが削除されている場合も対応 */
      const snippetProfilesData = this.adapter.all<ImportCandidateSnippetProfile>(`
        SELECT
          sp.profileId,
          p.name as profileName
        FROM snippet_profiles sp
        LEFT JOIN profiles p ON sp.profileId = p.id
        WHERE sp.snippetId = ?
      `, [s.id]);

      snippets.push({
        ...s,
        profiles: snippetProfilesData,
      });
    }

    /* 2. プロファイルの取得 */
    /* sortOrder順で表示 */
    const profiles = this.adapter.all<ImportCandidateProfile>(`
      SELECT id, name, isDefault, sortOrder, updatedAt
      FROM profiles
      ORDER BY sortOrder ASC
    `);

    /* 3. 変数の取得（プロファイル値含む） */
    /* カスタム変数のみ取得（システム変数は除外） */
    const variablesRaw = this.adapter.all<Omit<ImportCandidateVariable, 'profileValues'>>(`
      SELECT id, name, label, icon, sortOrder, updatedAt
      FROM variables
      WHERE type = 'custom'
      ORDER BY sortOrder ASC
    `);

    /* 各変数のプロファイルごとの値を取得 */
    const variables: ImportCandidateVariable[] = [];
    for (const v of variablesRaw) {
      /* LEFT JOINでプロファイルが削除されている場合も対応 */
      const profileValues = this.adapter.all<ImportCandidateVariableProfileValue>(`
        SELECT
          pv.profileId,
          pv.value,
          p.name as profileName
        FROM profile_variables pv
        LEFT JOIN profiles p ON pv.profileId = p.id
        WHERE pv.variableId = ?
      `, [v.id]);

      variables.push({
        ...v,
        profileValues,
      });
    }

    /* 4. カテゴリの取得 */
    /* sortOrderが設定されている場合はそれで、なければ名前順 */
    const categories = this.adapter.all<ImportCandidateCategory>(`
      SELECT id, name, color, sortOrder, createdAt
      FROM categories
      ORDER BY sortOrder ASC
    `);

    return {
      snippets,
      profiles,
      variables,
      categories,
    };
  }

  /** 全復元用に、業務データを加工せず取得する。 */
  getFullRestoreData(): FullRestoreData {
    const hasFormats = Boolean(
      this.adapter.get<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'system_variable_formats'"
      )
    );

    return {
      categories: this.adapter.all<Category>('SELECT * FROM categories'),
      variables: this.adapter.all<Variable>("SELECT * FROM variables WHERE type = 'custom'"),
      profiles: this.adapter.all<Profile>('SELECT * FROM profiles'),
      profileVariables: this.adapter.all<ProfileVariable>('SELECT * FROM profile_variables'),
      snippets: this.adapter.all<Snippet>('SELECT * FROM snippets'),
      snippetProfiles: this.adapter.all<SnippetProfile>('SELECT * FROM snippet_profiles'),
      systemVariableFormats: hasFormats
        ? this.adapter.all<SystemVariableFormatRow>('SELECT * FROM system_variable_formats')
        : [],
    };
  }

  getCategories(ids: string[]): ImportCandidateCategory[] {
    if (ids.length === 0) return [];

    /* createdAtを含めて取得 */
    return this.adapter.all(
      `SELECT id, name, color, sortOrder, createdAt FROM categories WHERE id IN (${placeholders(ids.length)})`,
      ids
    );
  }

  getVariables(ids: string[]): ImportCandidateVariable[] {
    if (ids.length === 0) return [];

    /* createdAt/updatedAt/sortOrderを含めて取得 */
    const variablesRaw = this.adapter.all<Omit<ImportCandidateVariable, 'profileValues'>>(
      `SELECT id, name, label, icon, type, valid, sortOrder, createdAt, updatedAt FROM variables WHERE id IN (${placeholders(ids.length)})`,
      ids
    );

    const variables: ImportCandidateVariable[] = [];
    for (const v of variablesRaw) {
      /* LEFT JOINでプロファイルが削除されている場合も対応 */
      const profileValues = this.adapter.all<ImportCandidateVariableProfileValue>(`
        SELECT
          pv.profileId,
          pv.value,
          p.name as profileName
        FROM profile_variables pv
        LEFT JOIN profiles p ON pv.profileId = p.id
        WHERE pv.variableId = ?
      `, [v.id]);

      variables.push({
        ...v,
        profileValues,
      });
    }

    return variables;
  }

  getProfiles(ids: string[]): ProfileImportRow[] {
    if (ids.length === 0) return [];

    /* createdAt/updatedAt/sortOrderを含めて取得 */
    return this.adapter.all(
      `SELECT id, name, isDefault, isActive, valid, sortOrder, createdAt, updatedAt FROM profiles WHERE id IN (${placeholders(ids.length)})`,
      ids
    );
  }

  getAllProfiles(): ProfileImportRow[] {
    return this.adapter.all('SELECT * FROM profiles');
  }

  getAllCategories(): ImportCandidateCategory[] {
    return this.adapter.all('SELECT * FROM categories');
  }

  getProfileVariables(
    variableIds: string[],
    profileIds: string[]
  ): ProfileVariableRow[] {
    if (variableIds.length === 0 || profileIds.length === 0) return [];

    /* 指定された変数IDとプロファイルIDの組み合わせで変数値を取得 */
    /* 例: variableId IN (1,2) AND profileId IN (A,B) → 4つの組み合わせのうち存在するものを返す */
    return this.adapter.all(
      `SELECT * FROM profile_variables WHERE variableId IN (${placeholders(variableIds.length)}) AND profileId IN (${placeholders(profileIds.length)})`,
      [...variableIds, ...profileIds]
    );
  }

  getSnippets(ids: string[]): SnippetImportRow[] {
    if (ids.length === 0) return [];

    /* LEFT JOINで未分類スニペットも含む */
    return this.adapter.all(
      `
      SELECT
        s.id, s.title, s.content, s.copyWithTitle, s.copyCount, s.categoryId,
        s.createdAt, s.updatedAt,
        c.name as categoryName
      FROM snippets s
      LEFT JOIN categories c ON s.categoryId = c.id
      WHERE s.id IN (${placeholders(ids.length)})
    `,
      ids
    );
  }

  getSnippetProfiles(snippetIds: string[]): SnippetProfileRow[] {
    if (snippetIds.length === 0) return [];

    return this.adapter.all(
      `SELECT snippetId, profileId FROM snippet_profiles WHERE snippetId IN (${placeholders(snippetIds.length)})`,
      snippetIds
    );
  }
}
