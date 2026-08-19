-- duplicate-title
-- 同一タイトルの定型文2件。タイトル昇順が同値になったときのタイブレーク（§8.9）を検証する。
-- 本文を別にしてあるので、どちらが上に来たかを本文で判定できる。

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

INSERT INTO variables (id, name, type, label, icon, valid, sortOrder, createdAt, updatedAt) VALUES
  ('var_client', 'client_name', 'custom', '取引先担当者名', 'person-outline', 1, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

INSERT INTO snippets (id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt) VALUES
  ('sn_same_old', '同名',   '古い方の本文。',   NULL, 0, 0, '2026-02-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z'),
  ('sn_same_new', '同名',   '新しい方の本文。', NULL, 0, 0, '2026-02-09T00:00:00.000Z', '2026-02-09T00:00:00.000Z'),
  ('sn_other',    'ZZZ',    '別タイトルの本文。', NULL, 0, 0, '2026-02-05T00:00:00.000Z', '2026-02-05T00:00:00.000Z');
