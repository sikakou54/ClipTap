-- profile-limited-category
-- あるカテゴリの定型文が、アクティブでないプロファイル専用になっている状態。
--
-- アクティブは Main。cat_only_a に属する定型文は A社用 だけに紐づくため、
-- Main では表示対象にならない。カテゴリチップに出るかどうかは §8.8 の
-- 「そのプロファイルで定型文が存在する個別カテゴリだけを表示」の解釈で決まる。

PRAGMA foreign_keys = ON;

DELETE FROM snippet_profiles;
DELETE FROM profile_variables;
DELETE FROM snippets;
DELETE FROM variables;
DELETE FROM categories;
DELETE FROM profiles;
DELETE FROM system_variable_formats;

INSERT INTO categories (id, name, color, sortOrder, createdAt) VALUES
  ('cat_common', '共通',   '#3B82F6', 0, '2026-01-01T00:00:00.000Z'),
  ('cat_only_a', 'A社専用', '#EF4444', 1, '2026-01-01T00:00:01.000Z');

INSERT INTO profiles (id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt) VALUES
  ('pf_main', 'Main',  1, 1, 1, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('pf_a',    'A社用', 0, 0, 1, 1, '2026-01-01T00:00:01.000Z', '2026-01-01T00:00:01.000Z');

INSERT INTO variables (id, name, type, label, icon, valid, sortOrder, createdAt, updatedAt) VALUES
  ('var_client', 'client_name', 'custom', '取引先担当者名', 'person-outline', 1, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

INSERT INTO snippets (id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt) VALUES
  ('sn_common', '全プロファイル向け', '関連0件なのですべてのプロファイルで出る。', 'cat_common', 0, 0, '2026-02-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z'),
  ('sn_a_only', 'A社用だけ',         'A社用プロファイルにだけ紐づく。',           'cat_only_a', 0, 0, '2026-02-02T00:00:00.000Z', '2026-02-02T00:00:00.000Z');

INSERT INTO snippet_profiles (snippetId, profileId) VALUES
  ('sn_a_only', 'pf_a');
