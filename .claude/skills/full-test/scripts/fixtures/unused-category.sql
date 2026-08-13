-- unused-category
-- 定型文が1件も紐づかないカテゴリを含む状態。
-- ホームのカテゴリチップは定型文があるカテゴリだけを出す（§8.8）ため、
-- 「未使用」はチップに出ず、カテゴリ管理には出る、という差を検証できる。

PRAGMA foreign_keys = ON;

DELETE FROM snippet_profiles;
DELETE FROM profile_variables;
DELETE FROM snippets;
DELETE FROM variables;
DELETE FROM categories;
DELETE FROM profiles;
DELETE FROM system_variable_formats;

INSERT INTO categories (id, name, color, sortOrder, createdAt) VALUES
  ('cat_work',   '仕事',       '#3B82F6', 0, '2026-01-01T00:00:00.000Z'),
  ('cat_sns',    'SNS',        '#10B981', 1, '2026-01-01T00:00:01.000Z'),
  ('cat_prompt', 'プロンプト', '#8B5CF6', 2, '2026-01-01T00:00:02.000Z'),
  ('cat_unused', '未使用',     '#EF4444', 3, '2026-01-01T00:00:03.000Z');

INSERT INTO profiles (id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt) VALUES
  ('pf_main', 'Main', 1, 1, 1, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

INSERT INTO variables (id, name, type, label, icon, valid, sortOrder, createdAt, updatedAt) VALUES
  ('var_client', 'client_name', 'custom', '取引先担当者名', 'person-outline', 1, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

INSERT INTO snippets (id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt) VALUES
  ('sn_work',   '仕事の定型文',     '仕事の本文。',     'cat_work',   0, 0, '2026-02-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z'),
  ('sn_sns',    'SNSの定型文',      'SNSの本文。',      'cat_sns',    0, 0, '2026-02-02T00:00:00.000Z', '2026-02-02T00:00:00.000Z'),
  ('sn_prompt', 'プロンプトの定型文', 'プロンプトの本文。', 'cat_prompt', 0, 0, '2026-02-03T00:00:00.000Z', '2026-02-03T00:00:00.000Z');
