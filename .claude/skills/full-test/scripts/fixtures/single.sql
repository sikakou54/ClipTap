-- single
-- 各マスタ1件。件数1の表示と、削除できない/できるの境目を確認する。

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

INSERT INTO variables (id, name, type, label, icon, valid, sortOrder, createdAt, updatedAt) VALUES
  ('var_client', 'client_name', 'custom', '取引先担当者名', 'person-outline', 1, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

INSERT INTO profile_variables (id, profileId, variableId, value, createdAt, updatedAt) VALUES
  ('pv_main_client', 'pf_main', 'var_client', 'ご担当者様', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

INSERT INTO snippets (id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt) VALUES
  ('sn_only', '唯一の定型文', '{{client_name}} 宛の本文。', 'cat_work', 0, 0, '2026-02-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');
