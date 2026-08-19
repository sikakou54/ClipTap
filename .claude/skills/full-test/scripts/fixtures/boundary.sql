-- boundary
-- 境界値データ。文字数上限ちょうど・上限超過・NULL・空文字を1つの状態に集める。
--
-- タイトルは画面上30文字までだが、保存層は取込データ互換のため
-- NULLと30文字超を保持する（§8.2）。その両方を一覧・コピーで確認する。

PRAGMA foreign_keys = ON;

DELETE FROM snippet_profiles;
DELETE FROM profile_variables;
DELETE FROM snippets;
DELETE FROM variables;
DELETE FROM categories;
DELETE FROM profiles;
DELETE FROM system_variable_formats;

-- プロファイル名は20文字まで。20文字ちょうどと21文字を並べる。
INSERT INTO profiles (id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt) VALUES
  ('pf_main', 'Main',                     1, 1, 1, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('pf_20',   'あいうえおかきくけこさしすせそたちつてと',  0, 0, 1, 1, '2026-01-01T00:00:01.000Z', '2026-01-01T00:00:01.000Z'),
  ('pf_21',   'あいうえおかきくけこさしすせそたちつてとな', 0, 0, 1, 2, '2026-01-01T00:00:02.000Z', '2026-01-01T00:00:02.000Z');

-- カテゴリ名は20文字まで。
INSERT INTO categories (id, name, color, sortOrder, createdAt) VALUES
  ('cat_1',  'あ',                                       '#3B82F6', 0, '2026-01-01T00:00:00.000Z'),
  ('cat_20', 'あいうえおかきくけこさしすせそたちつてと', '#10B981', 1, '2026-01-01T00:00:01.000Z');

-- 変数名は30文字まで。英字または `_` で始まり以降は英数字または `_`（§8.5）。
INSERT INTO variables (id, name, type, label, icon, valid, sortOrder, createdAt, updatedAt) VALUES
  ('var_min', 'a',                               'custom', 'あ', 'person-outline', 1, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('var_30',  'a23456789012345678901234567890',  'custom', 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほ', 'person-outline', 1, 1, '2026-01-01T00:00:01.000Z', '2026-01-01T00:00:01.000Z'),
  ('var_us',  '_underscore_start',               'custom', 'アンダースコア開始', 'person-outline', 1, 2, '2026-01-01T00:00:02.000Z', '2026-01-01T00:00:02.000Z');

-- 空文字の値は「未設定」として標準値へフォールバックする。
-- 表示とコピー結果が一致しないのは仕様違反（§8.6）。
INSERT INTO profile_variables (id, profileId, variableId, value, createdAt, updatedAt) VALUES
  ('pv_main_min', 'pf_main', 'var_min', '標準値',   '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('pv_20_min',   'pf_20',   'var_min', '',         '2026-01-01T00:00:01.000Z', '2026-01-01T00:00:01.000Z'),
  ('pv_21_min',   'pf_21',   'var_min', '個別の値', '2026-01-01T00:00:02.000Z', '2026-01-01T00:00:02.000Z');

INSERT INTO snippets (id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt) VALUES
  ('sn_t30',   '123456789012345678901234567890',  '30文字タイトル。',      'cat_1', 1, 0, '2026-02-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z'),
  ('sn_t31',   '1234567890123456789012345678901', '31文字タイトル（取込互換）。', 'cat_1', 1, 0, '2026-02-02T00:00:00.000Z', '2026-02-02T00:00:00.000Z'),
  ('sn_tnull', NULL,                              'タイトルNULL。',        'cat_1', 0, 0, '2026-02-03T00:00:00.000Z', '2026-02-03T00:00:00.000Z'),
  ('sn_tempty', '',                               'タイトル空文字。',      'cat_1', 0, 0, '2026-02-04T00:00:00.000Z', '2026-02-04T00:00:00.000Z'),
  ('sn_c1',    'a',                               'x',                     NULL,    0, 0, '2026-02-05T00:00:00.000Z', '2026-02-05T00:00:00.000Z'),
  ('sn_multi', '複数行本文',                      '1行目
2行目
3行目',                                                                              'cat_20', 1, 0, '2026-02-06T00:00:00.000Z', '2026-02-06T00:00:00.000Z'),
  ('sn_emoji', '絵文字🎯と記号<>&"',              '絵文字🎯 記号<>&" タブ	を含む本文。', NULL, 0, 0, '2026-02-07T00:00:00.000Z', '2026-02-07T00:00:00.000Z');
