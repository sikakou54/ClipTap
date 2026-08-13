-- many
-- 大量データ（定型文200件・カテゴリ10件）。スクロール、検索の絞り込み、
-- 一覧の初期表示性能を確認する。タイトルは連番で一意にしてある。

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

WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 10)
INSERT INTO categories (id, name, color, sortOrder, createdAt)
SELECT 'cat_' || printf('%02d', n), 'カテゴリ' || printf('%02d', n), '#3B82F6', n - 1,
       '2026-01-01T00:00:00.000Z'
FROM seq;

WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 200)
INSERT INTO snippets (id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt)
SELECT 'sn_' || printf('%03d', n),
       '定型文' || printf('%03d', n),
       '本文' || printf('%03d', n) || ' {{client_name}}',
       'cat_' || printf('%02d', ((n - 1) % 10) + 1),
       n % 2,
       n,
       '2026-02-01T00:00:00.000Z',
       '2026-02-01T00:00:00.000Z'
FROM seq;
