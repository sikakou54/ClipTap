/**
 * SQLiteスキーマ定義
 *
 * ClipTapアプリのデータベーススキーマを定義します。
 * 主要なテーブル:
 * - categories: スニペットのカテゴリ分類
 * - snippets: コピー可能なテキストスニペット
 * - variables: 変数のメタデータ（名前、ラベル、アイコンなど）
 * - profiles: 環境プロファイル（開発、本番など）
 * - profile_variables: プロファイル別の変数値（標準値も含む）
 * - snippet_profiles: スニペットとプロファイルの多対多関連
 */

/**
 * スキーマバージョン
 * マイグレーションの管理に使用
 */
export const SCHEMA_VERSION = 2;

/**
 * テーブル作成SQL
 */
export const CREATE_TABLES = {
  /**
   * categories - カテゴリマスタ
   * スニペットを分類するためのカテゴリ情報を管理
   *
   * @field id - UUID（主キー）
   * @field name - カテゴリ名（一意制約）
   * @field color - カテゴリカラー（HEX形式、例: #FF0000）
   * @field sortOrder - 表示順序（昇順）
   * @field createdAt - 作成日時（ISO 8601形式）
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
   * snippets - スニペットマスタ
   * ユーザーが登録したコピー可能なテキストスニペットを管理
   *
   * @field id - UUID（主キー）
   * @field title - スニペットのタイトル（省略可）
   * @field content - スニペットの本文（必須）
   * @field categoryId - 所属カテゴリID（外部キー、削除時NULL）
   * @field createdAt - 作成日時（ISO 8601形式）
   * @field updatedAt - 更新日時（ISO 8601形式）
   *
   * 外部キー制約:
   * - categoryId → categories.id (ON DELETE SET NULL)
   *
   * 注意:
   * - 変数を含むかどうかは VariableParser.hasVariables(content) で動的に判定
   * - プロファイルとの関連は snippet_profiles テーブルで多対多管理
   */
  snippets: `
    CREATE TABLE IF NOT EXISTS snippets (
      id TEXT PRIMARY KEY,
      title TEXT,
      content TEXT NOT NULL,
      categoryId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
    );
  `,

  /**
   * variables - 変数メタデータ
   * カスタム変数の定義情報を管理（値は含まない）
   *
   * @field id - UUID（主キー）
   * @field name - 変数名（一意制約、例: API_KEY）
   * @field type - 変数タイプ（'custom' | 'system'）
   * @field label - 表示ラベル（UI表示用、省略可）
   * @field icon - アイコン名（Ionicons名、省略可）
   * @field valid - 有効フラグ（0: 無効, 1: 有効）
   * @field createdAt - 作成日時（ISO 8601形式）
   * @field updatedAt - 更新日時（ISO 8601形式）
   *
   * 注意: 変数の値は profile_variables テーブルで管理
   * - 標準値: デフォルトプロファイル（isDefault=1）のprofile_variablesに格納
   * - 環境別値: 各プロファイルのprofile_variablesに格納
   */
  variables: `
    CREATE TABLE IF NOT EXISTS variables (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      label TEXT,
      icon TEXT,
      valid INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `,

  /**
   * profiles - 環境プロファイル
   * 開発環境、本番環境などの切り替え可能な環境設定を管理
   *
   * @field id - UUID（主キー）
   * @field name - プロファイル名（一意制約、例: 開発環境、本番環境）
   * @field isActive - アクティブフラグ（0: 非アクティブ, 1: アクティブ）
   * @field isDefault - デフォルトフラグ（0: 通常, 1: デフォルト）
   * @field valid - 有効フラグ（0: 無効, 1: 有効）
   * @field createdAt - 作成日時（ISO 8601形式）
   * @field updatedAt - 更新日時（ISO 8601形式）
   *
   * 制約:
   * - isActive=1 は常に1つのみ（アプリケーションレベルで制御）
   * - isDefault=1 は常に1つのみ（標準値の格納先）
   */
  profiles: `
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      isActive INTEGER DEFAULT 0,
      isDefault INTEGER DEFAULT 0,
      valid INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `,

  /**
   * profile_variables - プロファイル別変数値
   * 各プロファイルにおける変数の実際の値を管理
   *
   * @field id - UUID（主キー）
   * @field profileId - プロファイルID（外部キー）
   * @field variableId - 変数ID（外部キー）
   * @field value - 変数の値（必須）
   * @field createdAt - 作成日時（ISO 8601形式）
   * @field updatedAt - 更新日時（ISO 8601形式）
   *
   * 外部キー制約:
   * - profileId → profiles.id (ON DELETE CASCADE)
   * - variableId → variables.id (ON DELETE CASCADE)
   *
   * 一意制約:
   * - (profileId, variableId) の組み合わせは一意
   *
   * データモデル:
   * - デフォルトプロファイル（isDefault=1）: 標準値を格納
   * - その他のプロファイル: 環境固有の値を格納
   * - 値の解決優先度: アクティブプロファイル値 > デフォルトプロファイル値（標準値） > 空文字列
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
   * snippet_profiles - スニペット・プロファイル関連
   * スニペットと適用可能なプロファイルの多対多関係を管理
   *
   * @field snippetId - スニペットID（外部キー、複合主キー）
   * @field profileId - プロファイルID（外部キー、複合主キー）
   *
   * 外部キー制約:
   * - snippetId → snippets.id (ON DELETE CASCADE)
   * - profileId → profiles.id (ON DELETE CASCADE)
   *
   * 主キー:
   * - (snippetId, profileId) の組み合わせ
   *
   * 用途:
   * - 特定のスニペットがどのプロファイルで使用可能かを定義
   * - 環境別にスニペットをフィルタリング
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
 * インデックス作成SQL
 * クエリパフォーマンスを最適化するためのインデックス定義
 */
export const CREATE_INDEXES = {
  /**
   * スニペット検索用インデックス: カテゴリID
   * カテゴリ別スニペット一覧の高速化
   */
  snippetsCategory: `
    CREATE INDEX IF NOT EXISTS idx_snippets_category
    ON snippets(categoryId);
  `,

  /**
   * スニペット検索用インデックス: 更新日時（降順）
   * 最近更新されたスニペットの取得を高速化
   */
  snippetsUpdated: `
    CREATE INDEX IF NOT EXISTS idx_snippets_updated
    ON snippets(updatedAt DESC);
  `,

  /**
   * プロファイル検索用インデックス: アクティブフラグ（降順）
   * アクティブプロファイルの取得を高速化
   */
  profilesActive: `
    CREATE INDEX IF NOT EXISTS idx_profiles_active
    ON profiles(isActive DESC);
  `,

  /**
   * プロファイル変数検索用インデックス: プロファイルID
   * 特定プロファイルの変数一覧取得を高速化
   */
  profileVariablesProfile: `
    CREATE INDEX IF NOT EXISTS idx_profile_variables_profile
    ON profile_variables(profileId);
  `,

  /**
   * プロファイル変数検索用インデックス: 変数ID
   * 特定変数が使用されているプロファイルの検索を高速化
   */
  profileVariablesVariable: `
    CREATE INDEX IF NOT EXISTS idx_profile_variables_variable
    ON profile_variables(variableId);
  `,

  /**
   * スニペット・プロファイル関連検索用インデックス: スニペットID
   * 特定スニペットが使用可能なプロファイルの検索を高速化
   */
  snippetProfilesSnippet: `
    CREATE INDEX IF NOT EXISTS idx_snippet_profiles_snippet
    ON snippet_profiles(snippetId);
  `,

  /**
   * スニペット・プロファイル関連検索用インデックス: プロファイルID
   * 特定プロファイルで使用可能なスニペットの検索を高速化
   */
  snippetProfilesProfile: `
    CREATE INDEX IF NOT EXISTS idx_snippet_profiles_profile
    ON snippet_profiles(profileId);
  `,
};

/**
 * テーブル削除SQL
 * データベースリセット時に使用（外部キー制約を考慮した順序で定義）
 *
 * 削除順序:
 * 1. snippet_profiles（中間テーブル）
 * 2. profile_variables（中間テーブル）
 * 3. profiles（参照元テーブル）
 * 4. variables（参照元テーブル）
 * 5. snippets（参照元テーブル）
 * 6. categories（参照元テーブル）
 */
export const DROP_TABLES = {
  snippetProfiles: 'DROP TABLE IF EXISTS snippet_profiles;',
  profileVariables: 'DROP TABLE IF EXISTS profile_variables;',
  profiles: 'DROP TABLE IF EXISTS profiles;',
  variables: 'DROP TABLE IF EXISTS variables;',
  snippets: 'DROP TABLE IF EXISTS snippets;',
  categories: 'DROP TABLE IF EXISTS categories;',
};
