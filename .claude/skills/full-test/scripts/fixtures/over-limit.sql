-- over-limit
-- Free上限超過。プロファイル5件中2件、カスタム変数8件中3件が valid=0。
-- 無効バッジ・Pro案内・展開対象からの除外を確認する（§8.18 / §13.2）。

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
  ('pf_b',    'B社用', 0, 0, 1, 2, '2026-01-01T00:00:02.000Z', '2026-01-01T00:00:02.000Z'),
  ('pf_c',    'C社用', 0, 0, 0, 3, '2026-01-01T00:00:03.000Z', '2026-01-01T00:00:03.000Z'),
  ('pf_d',    'D社用', 0, 0, 0, 4, '2026-01-01T00:00:04.000Z', '2026-01-01T00:00:04.000Z');

INSERT INTO variables (id, name, type, label, icon, valid, sortOrder, createdAt, updatedAt) VALUES
  ('var_v1', 'var_one',   'custom', '変数1', 'person-outline', 1, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('var_v2', 'var_two',   'custom', '変数2', 'person-outline', 1, 1, '2026-01-01T00:00:01.000Z', '2026-01-01T00:00:01.000Z'),
  ('var_v3', 'var_three', 'custom', '変数3', 'person-outline', 1, 2, '2026-01-01T00:00:02.000Z', '2026-01-01T00:00:02.000Z'),
  ('var_v4', 'var_four',  'custom', '変数4', 'person-outline', 1, 3, '2026-01-01T00:00:03.000Z', '2026-01-01T00:00:03.000Z'),
  ('var_v5', 'var_five',  'custom', '変数5', 'person-outline', 1, 4, '2026-01-01T00:00:04.000Z', '2026-01-01T00:00:04.000Z'),
  ('var_v6', 'var_six',   'custom', '変数6', 'person-outline', 0, 5, '2026-01-01T00:00:05.000Z', '2026-01-01T00:00:05.000Z'),
  ('var_v7', 'var_seven', 'custom', '変数7', 'person-outline', 0, 6, '2026-01-01T00:00:06.000Z', '2026-01-01T00:00:06.000Z'),
  ('var_v8', 'var_eight', 'custom', '変数8', 'person-outline', 0, 7, '2026-01-01T00:00:07.000Z', '2026-01-01T00:00:07.000Z');

INSERT INTO profile_variables (id, profileId, variableId, value, createdAt, updatedAt) VALUES
  ('pv_main_v1', 'pf_main', 'var_v1', '有効な値',   '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('pv_main_v6', 'pf_main', 'var_v6', '無効側の値', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

-- 無効な変数はトークンのまま残るはず（§8.6 / §8.10）
INSERT INTO snippets (id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt) VALUES
  ('sn_mix', '有効と無効', '有効={{var_one}} 無効={{var_six}}', NULL, 0, 0, '2026-02-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');
