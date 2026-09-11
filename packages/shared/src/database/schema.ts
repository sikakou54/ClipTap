/**
 * ClipTap SQLiteスキーマ定義（Mobile/Web共通）
 *
 * テーブル作成SQL、インデックス作成SQL、テーブル削除SQLを提供。
 */

/**
 * データベーススキーマバージョン
 */
export const SCHEMA_VERSION = 8;

/** インポートで受け付ける最古のスキーマバージョン */
export const MIN_SUPPORTED_SCHEMA_VERSION = 3;

/**
 * テーブル作成SQL定義
 */
export const CREATE_TABLES = {
  /**
   * カテゴリテーブル
   */
  categories: `
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT,
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    );
  `,

  /**
   * スニペットテーブル
   */
  snippets: `
    CREATE TABLE IF NOT EXISTS snippets (
      id TEXT PRIMARY KEY,
      title TEXT,
      content TEXT NOT NULL,
      categoryId TEXT,
      copyWithTitle INTEGER DEFAULT 0,
      copyCount INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
    );
  `,

  /**
   * カスタム変数テーブル
   */
  variables: `
    CREATE TABLE IF NOT EXISTS variables (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      label TEXT,
      icon TEXT,
      valid INTEGER DEFAULT 1,
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `,

  /**
   * プロファイルテーブル
   */
  profiles: `
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      isActive INTEGER DEFAULT 0,
      isDefault INTEGER DEFAULT 0,
      valid INTEGER DEFAULT 1,
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `,

  /**
   * プロファイル変数値テーブル
   */
  profileVariables: `
    CREATE TABLE IF NOT EXISTS profile_variables (
      id TEXT PRIMARY KEY,
      profileId TEXT NOT NULL,
      variableId TEXT NOT NULL,
      value TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (profileId) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (variableId) REFERENCES variables(id) ON DELETE CASCADE,
      UNIQUE(profileId, variableId)
    );
  `,

  /**
   * スニペット-プロファイル関連テーブル（多対多）
   */
  snippetProfiles: `
    CREATE TABLE IF NOT EXISTS snippet_profiles (
      snippetId TEXT NOT NULL,
      profileId TEXT NOT NULL,
      PRIMARY KEY (snippetId, profileId),
      FOREIGN KEY (snippetId) REFERENCES snippets(id) ON DELETE CASCADE,
      FOREIGN KEY (profileId) REFERENCES profiles(id) ON DELETE CASCADE
    );
  `,

  /**
   * システム変数の書式設定テーブル
   */
  systemVariableFormats: `
    CREATE TABLE IF NOT EXISTS system_variable_formats (
      variableKey TEXT PRIMARY KEY,
      pattern TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `,

  /**
   * ショートカットテーブル
   *
   * @remarks
   * 1件のショートカットは必ず1件のプロファイルに属する。
   * 名前の一意性はプロファイル内に限るため、列単位のUNIQUEではなく複合UNIQUEで表す。
   * 実行時に外部キーを強制していないため、プロファイル削除時のカスケードは
   * ProfileMapperが明示的に行う（profile_variablesと同じ扱い）。
   */
  shortcuts: `
    CREATE TABLE IF NOT EXISTS shortcuts (
      id TEXT PRIMARY KEY,
      profileId TEXT NOT NULL,
      name TEXT NOT NULL,
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (profileId) REFERENCES profiles(id) ON DELETE CASCADE,
      UNIQUE(profileId, name)
    );
  `,

  /**
   * ショートカット値テーブル
   */
  shortcutValues: `
    CREATE TABLE IF NOT EXISTS shortcut_values (
      id TEXT PRIMARY KEY,
      shortcutId TEXT NOT NULL,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      useCount INTEGER DEFAULT 0,
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (shortcutId) REFERENCES shortcuts(id) ON DELETE CASCADE
    );
  `,
};

/**
 * インデックス作成SQL定義（検索・ソート性能向上用）
 */
export const CREATE_INDEXES = {
  snippetsCategory: `
    CREATE INDEX IF NOT EXISTS idx_snippets_category
    ON snippets(categoryId);
  `,
  snippetsUpdated: `
    CREATE INDEX IF NOT EXISTS idx_snippets_updated
    ON snippets(updatedAt DESC);
  `,
  snippetsCopyCount: `
    CREATE INDEX IF NOT EXISTS idx_snippets_copy_count
    ON snippets(copyCount DESC);
  `,
  profilesActive: `
    CREATE INDEX IF NOT EXISTS idx_profiles_active
    ON profiles(isActive DESC);
  `,
  profileVariablesProfile: `
    CREATE INDEX IF NOT EXISTS idx_profile_variables_profile
    ON profile_variables(profileId);
  `,
  profileVariablesVariable: `
    CREATE INDEX IF NOT EXISTS idx_profile_variables_variable
    ON profile_variables(variableId);
  `,
  snippetProfilesSnippet: `
    CREATE INDEX IF NOT EXISTS idx_snippet_profiles_snippet
    ON snippet_profiles(snippetId);
  `,
  snippetProfilesProfile: `
    CREATE INDEX IF NOT EXISTS idx_snippet_profiles_profile
    ON snippet_profiles(profileId);
  `,
  /**
   * ショートカットの所属プロファイルのindex
   *
   * @remarks
   * 一覧はプロファイルで絞って取得するため実際に使われる。
   * 併せて、移行・取込の後に `profileId` 列が存在することを確かめる経路でもある。
   * `finalizeLatestSchema` はテーブル名しか確認しないため、この列が欠けたまま
   * 最新スキーマとして通ってしまうのを防いでいる。参照するクエリが無いと誤解して消さないこと。
   */
  shortcutsProfile: `
    CREATE INDEX IF NOT EXISTS idx_shortcuts_profile
    ON shortcuts(profileId);
  `,
  shortcutValuesShortcut: `
    CREATE INDEX IF NOT EXISTS idx_shortcut_values_shortcut
    ON shortcut_values(shortcutId);
  `,
  /**
   * 使用回数のindex
   *
   * @remarks
   * useCount順の並べ替えは取得後のメモリ上で行うため、このindexで速くなるクエリは無い。
   * それでも置いているのは、移行・取込の後に `useCount` 列が存在することを確かめる唯一の経路だから。
   * `finalizeLatestSchema` はテーブル名しか確認せず、Mapperは `useCount ?? 0` で読むため、
   * 列が欠けても例外にならず全件0として静かに壊れる（migrations.tsの「派生indexが参照する列は
   * createIndexesWithDbの作成時に検知される」に対応）。参照するクエリが無いことを理由に消さないこと。
   */
  shortcutValuesUseCount: `
    CREATE INDEX IF NOT EXISTS idx_shortcut_values_use_count
    ON shortcut_values(useCount DESC);
  `,
};

/**
 * テーブル削除SQL定義（外部キー制約のため削除順序重要）
 */
export const DROP_TABLES = {
  shortcutValues: 'DROP TABLE IF EXISTS shortcut_values;',
  shortcuts: 'DROP TABLE IF EXISTS shortcuts;',
  systemVariableFormats: 'DROP TABLE IF EXISTS system_variable_formats;',
  snippetProfiles: 'DROP TABLE IF EXISTS snippet_profiles;',
  profileVariables: 'DROP TABLE IF EXISTS profile_variables;',
  profiles: 'DROP TABLE IF EXISTS profiles;',
  variables: 'DROP TABLE IF EXISTS variables;',
  snippets: 'DROP TABLE IF EXISTS snippets;',
  categories: 'DROP TABLE IF EXISTS categories;',
};
