-- baseline
-- 基準データ。カテゴリ3・定型文5・プロファイル3・カスタム変数3。Free上限ちょうど。
--
-- IDと日時は固定値にしてある。並べ替え・絞り込み・展開結果を
-- 期待値として書けるようにするため、実行のたびに変わる値を持たせない。

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
  ('cat_prompt', 'プロンプト', '#8B5CF6', 2, '2026-01-01T00:00:02.000Z');

INSERT INTO profiles (id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt) VALUES
  ('pf_main', 'Main',  1, 1, 1, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('pf_a',    'A社用', 0, 0, 1, 1, '2026-01-01T00:00:01.000Z', '2026-01-01T00:00:01.000Z'),
  ('pf_b',    'B社用', 0, 0, 1, 2, '2026-01-01T00:00:02.000Z', '2026-01-01T00:00:02.000Z');

INSERT INTO variables (id, name, type, label, icon, valid, sortOrder, createdAt, updatedAt) VALUES
  ('var_client',  'client_name', 'custom', '取引先担当者名', 'person-outline',        1, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('var_company', 'company',     'custom', '自社名',         'business-outline',      1, 1, '2026-01-01T00:00:01.000Z', '2026-01-01T00:00:01.000Z'),
  ('var_sender',  'sender_name', 'custom', '送信者名',       'person-circle-outline', 1, 2, '2026-01-01T00:00:02.000Z', '2026-01-01T00:00:02.000Z');

-- 標準プロファイルの値がフォールバック元になる（§8.6）。
-- pf_b には client_name の行を作らず、「行なし」のフォールバックを検証できるようにする。
INSERT INTO profile_variables (id, profileId, variableId, value, createdAt, updatedAt) VALUES
  ('pv_main_client',  'pf_main', 'var_client',  'ご担当者様',       '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('pv_main_company', 'pf_main', 'var_company', '株式会社サンプル', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('pv_main_sender',  'pf_main', 'var_sender',  '山田太郎',         '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('pv_a_client',     'pf_a',    'var_client',  'A社ご担当者様',    '2026-01-01T00:00:01.000Z', '2026-01-01T00:00:01.000Z'),
  ('pv_a_company',    'pf_a',    'var_company', '株式会社エー',     '2026-01-01T00:00:01.000Z', '2026-01-01T00:00:01.000Z'),
  -- 空文字は「未設定」として標準値へフォールバックする（表示とコピーが一致すること）
  ('pv_b_company',    'pf_b',    'var_company', '',                 '2026-01-01T00:00:02.000Z', '2026-01-01T00:00:02.000Z');

INSERT INTO snippets (id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt) VALUES
  ('sn_greet',   'あいさつ',              '{{client_name}}
いつもお世話になっております。{{company}}の{{sender_name}}です。', 'cat_work',   1,  0, '2026-02-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z'),
  ('sn_report',  '進捗報告（{{today}}）', '本日の進捗を報告します。',                    'cat_work',   0,  3, '2026-02-02T00:00:00.000Z', '2026-02-05T00:00:00.000Z'),
  ('sn_post',    '今日の積み上げ',        '# 今日の積み上げ
- ',                                                                                     'cat_sns',    0, 10, '2026-02-03T00:00:00.000Z', '2026-02-03T00:00:00.000Z'),
  ('sn_summary', '要約プロンプト',        '以下を要約してください。',                    'cat_prompt', 0,  1, '2026-02-04T00:00:00.000Z', '2026-02-06T00:00:00.000Z'),
  -- カテゴリなし・タイトルなしの組み合わせ（タイトルのみコピーが出ないケース）
  ('sn_notitle', NULL,                    'カテゴリもタイトルも持たない定型文。',        NULL,         0,  0, '2026-02-05T00:00:00.000Z', '2026-02-05T00:00:00.000Z');

-- sn_report だけを A社用 に紐付ける。関連0件の定型文は「すべてのプロファイル」扱い。
INSERT INTO snippet_profiles (snippetId, profileId) VALUES
  ('sn_report', 'pf_a');
