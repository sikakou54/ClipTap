// SQLiteスキーマ定義
export const SCHEMA_VERSION = 1;

export const CREATE_TABLES = {
  categories: `
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT,
      icon TEXT,
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    );
  `,

  snippets: `
    CREATE TABLE IF NOT EXISTS snippets (
      id TEXT PRIMARY KEY,
      title TEXT,
      content TEXT NOT NULL,
      categoryId TEXT,
      isPinned INTEGER DEFAULT 0,
      usageCount INTEGER DEFAULT 0,
      lastUsedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
    );
  `,

  tags: `
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
  `,

  snippetTags: `
    CREATE TABLE IF NOT EXISTS snippet_tags (
      snippetId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      PRIMARY KEY (snippetId, tagId),
      FOREIGN KEY (snippetId) REFERENCES snippets(id) ON DELETE CASCADE,
      FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
    );
  `,
};

export const CREATE_INDEXES = {
  snippetsCategory: `
    CREATE INDEX IF NOT EXISTS idx_snippets_category
    ON snippets(categoryId);
  `,

  snippetsUsage: `
    CREATE INDEX IF NOT EXISTS idx_snippets_usage
    ON snippets(usageCount DESC);
  `,

  snippetsPinned: `
    CREATE INDEX IF NOT EXISTS idx_snippets_pinned
    ON snippets(isPinned DESC);
  `,

  snippetsUpdated: `
    CREATE INDEX IF NOT EXISTS idx_snippets_updated
    ON snippets(updatedAt DESC);
  `,
};

export const DROP_TABLES = {
  snippetTags: 'DROP TABLE IF EXISTS snippet_tags;',
  tags: 'DROP TABLE IF EXISTS tags;',
  snippets: 'DROP TABLE IF EXISTS snippets;',
  categories: 'DROP TABLE IF EXISTS categories;',
};
