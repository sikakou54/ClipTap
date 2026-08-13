-- sortable
-- 並べ替え検証用。4種の並べ替えで順序がすべて異なるようにしてある。
--
-- 期待順序
--   タイトル(昇順)     : AAA, BBB, CCC, DDD
--   作成日(新しい順)   : DDD, CCC, BBB, AAA
--   更新日(新しい順)   : BBB, AAA, DDD, CCC
--   使用頻度(多い順)   : CCC, DDD, AAA, BBB
--
-- 4種が別々の順序になっていないと、テストが通っても
-- 「その並べ替えが効いている」ことの証明にならない。

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
  ('sn_a', 'AAA', '本文A', NULL, 0, 10, '2026-02-01T00:00:00.000Z', '2026-03-03T00:00:00.000Z'),
  ('sn_b', 'BBB', '本文B', NULL, 0,  5, '2026-02-02T00:00:00.000Z', '2026-03-04T00:00:00.000Z'),
  ('sn_c', 'CCC', '本文C', NULL, 0, 30, '2026-02-03T00:00:00.000Z', '2026-03-01T00:00:00.000Z'),
  ('sn_d', 'DDD', '本文D', NULL, 0, 20, '2026-02-04T00:00:00.000Z', '2026-03-02T00:00:00.000Z');
