/**
 * ClipTap SQLiteスキーマ定義（Mobile/Web共通）
 *
 * テーブル作成SQL、インデックス作成SQL、テーブル削除SQLを提供。
 */

/**
 * データベーススキーマバージョン
 */
export const SCHEMA_VERSION = 6;

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
};

/**
 * テーブル削除SQL定義（外部キー制約のため削除順序重要）
 */
export const DROP_TABLES = {
  snippetProfiles: 'DROP TABLE IF EXISTS snippet_profiles;',
  profileVariables: 'DROP TABLE IF EXISTS profile_variables;',
  profiles: 'DROP TABLE IF EXISTS profiles;',
  variables: 'DROP TABLE IF EXISTS variables;',
  snippets: 'DROP TABLE IF EXISTS snippets;',
  categories: 'DROP TABLE IF EXISTS categories;',
};

