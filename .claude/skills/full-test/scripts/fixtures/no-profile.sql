-- no-profile
-- プロファイル0件。プロファイルセレクタを開いても落ちないことを確認する（§9.4）。

PRAGMA foreign_keys = ON;

DELETE FROM snippet_profiles;
DELETE FROM profile_variables;
DELETE FROM snippets;
DELETE FROM variables;
DELETE FROM categories;
DELETE FROM profiles;
DELETE FROM system_variable_formats;

INSERT INTO categories (id, name, color, sortOrder, createdAt) VALUES
  ('cat_work', '仕事', '#3B82F6', 0, '2026-01-01T00:00:00.000Z');

INSERT INTO variables (id, name, type, label, icon, valid, sortOrder, createdAt, updatedAt) VALUES
  ('var_client', 'client_name', 'custom', '取引先担当者名', 'person-outline', 1, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

INSERT INTO snippets (id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt) VALUES
  ('sn_orphan', 'プロファイルなし', '{{client_name}} は標準値も無いためトークンのまま残る。', 'cat_work', 0, 0, '2026-02-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');
