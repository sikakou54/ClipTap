-- free-limit
-- Free上限ちょうど（プロファイル3・カスタム変数5、すべて valid=1）。
-- この状態から追加しようとすると上限メッセージが出る（§8.4 / §8.5 / §10.4）。

PRAGMA foreign_keys = ON;

DELETE FROM snippet_profiles;
DELETE FROM profile_variables;
DELETE FROM snippets;
DELETE FROM variables;
DELETE FROM categories;
DELETE FROM profiles;
DELETE FROM system_variable_formats;

INSERT INTO profiles (id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt) VALUES
  ('pf_main', 'Main',  1, 1, 1, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('pf_a',    'A社用', 0, 0, 1, 1, '2026-01-01T00:00:01.000Z', '2026-01-01T00:00:01.000Z'),
  ('pf_b',    'B社用', 0, 0, 1, 2, '2026-01-01T00:00:02.000Z', '2026-01-01T00:00:02.000Z');

INSERT INTO variables (id, name, type, label, icon, valid, sortOrder, createdAt, updatedAt) VALUES
  ('var_v1', 'var_one',   'custom', '変数1', 'person-outline',   1, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('var_v2', 'var_two',   'custom', '変数2', 'business-outline', 1, 1, '2026-01-01T00:00:01.000Z', '2026-01-01T00:00:01.000Z'),
  ('var_v3', 'var_three', 'custom', '変数3', 'person-outline',   1, 2, '2026-01-01T00:00:02.000Z', '2026-01-01T00:00:02.000Z'),
  ('var_v4', 'var_four',  'custom', '変数4', 'person-outline',   1, 3, '2026-01-01T00:00:03.000Z', '2026-01-01T00:00:03.000Z'),
  ('var_v5', 'var_five',  'custom', '変数5', 'person-outline',   1, 4, '2026-01-01T00:00:04.000Z', '2026-01-01T00:00:04.000Z');

INSERT INTO snippets (id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt) VALUES
  ('sn_only', '定型文', '{{var_one}}', NULL, 0, 0, '2026-02-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');
