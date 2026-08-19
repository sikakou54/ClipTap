-- empty-variables
-- カスタム変数0件。変数管理の空状態と、変数ツールバーの表示を確認する。

PRAGMA foreign_keys = ON;

DELETE FROM snippet_profiles;
DELETE FROM profile_variables;
DELETE FROM snippets;
DELETE FROM variables;
DELETE FROM categories;
DELETE FROM profiles;
DELETE FROM system_variable_formats;

INSERT INTO profiles (id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt) VALUES
  ('pf_main', 'Main', 1, 1, 1, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

INSERT INTO categories (id, name, color, sortOrder, createdAt) VALUES
  ('cat_work', '仕事', '#3B82F6', 0, '2026-01-01T00:00:00.000Z');

INSERT INTO snippets (id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt) VALUES
  ('sn_plain', 'ただの定型文', '変数を含まない本文。', 'cat_work', 0, 0, '2026-02-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z'),
  ('sn_token', '未定義変数', '{{undefined_var}} は展開されない。', 'cat_work', 0, 0, '2026-02-02T00:00:00.000Z', '2026-02-02T00:00:00.000Z');
