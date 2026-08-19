-- default-lower
-- 標準プロファイルが表示順の下位（sortOrder=4）にあり、全件が valid=1 の状態。
-- Freeへ切り替えたときの有効化が「標準を優先し、その後は表示順」（§13.2）で
-- 決まることを、表示順だけの判定と区別できる形にしてある。

PRAGMA foreign_keys = ON;

DELETE FROM snippet_profiles;
DELETE FROM profile_variables;
DELETE FROM snippets;
DELETE FROM variables;
DELETE FROM categories;
DELETE FROM profiles;
DELETE FROM system_variable_formats;

INSERT INTO profiles (id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt) VALUES
  ('pf_p1', 'P1', 1, 0, 1, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('pf_p2', 'P2', 0, 0, 1, 1, '2026-01-01T00:00:01.000Z', '2026-01-01T00:00:01.000Z'),
  ('pf_p3', 'P3', 0, 0, 1, 2, '2026-01-01T00:00:02.000Z', '2026-01-01T00:00:02.000Z'),
  ('pf_p4', 'P4', 0, 0, 1, 3, '2026-01-01T00:00:03.000Z', '2026-01-01T00:00:03.000Z'),
  ('pf_std', '標準P', 0, 1, 1, 4, '2026-01-01T00:00:04.000Z', '2026-01-01T00:00:04.000Z');

INSERT INTO variables (id, name, type, label, icon, valid, sortOrder, createdAt, updatedAt) VALUES
  ('var_v1', 'var_one', 'custom', '変数1', 'person-outline', 1, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

INSERT INTO snippets (id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt) VALUES
  ('sn_only', '定型文', '{{var_one}}', NULL, 0, 0, '2026-02-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');
