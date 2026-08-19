-- sysvars
-- システム変数7種・日本語別名・表記ゆれ・未解決トークンを1つの状態に集める（§8.6 / §8.23）。
--
-- 4種の並べ替えで各定型文が1番目か2番目に来るよう createdAt / updatedAt / copyCount を配ってある。
-- 一覧のコピーボタンは同じグリフ（copy-outline）が1カードに1つ並ぶだけで、
-- 何番目のカードかは順序指定でしか特定できない。この配分を変えるとテストが壊れる。

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

-- 値を1件も持たない有効な変数。標準値にも値が無いときトークンが残ることを確認する（§8.6）。
INSERT INTO variables (id, name, type, label, icon, valid, sortOrder, createdAt, updatedAt) VALUES
  ('var_novalue', 'no_value_var', 'custom', '値なし変数', 'person-outline', 1, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

-- 値そのものがシステム変数トークンを含む変数。§8.6「システム変数を先に、次にカスタム変数を展開する」の
-- 順序は、この形でしか外から観察できない。規則どおりならシステム変数展開は既に終わっているので、
-- 後から差し込まれた {{today}} は展開されずトークンのまま残る。
INSERT INTO variables (id, name, type, label, icon, valid, sortOrder, createdAt, updatedAt) VALUES
  ('var_stamp', 'stamp', 'custom', '日付印', 'calendar-outline', 1, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

INSERT INTO profile_variables (id, profileId, variableId, value, createdAt, updatedAt) VALUES
  ('pv_stamp', 'pf_main', 'var_stamp', '本日は{{today}}です', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

INSERT INTO snippets (id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt) VALUES
  ('sv_date',   'A 日付系',   '{{today}}|{{year}}|{{month}}|{{day}}|{{weekday}}',                  NULL, 0, 0, '2026-02-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z'),
  ('sv_time',   'B 時刻系',   '{{now}}|{{time}}',                                                  NULL, 0, 0, '2026-02-02T00:00:00.000Z', '2026-03-02T00:00:00.000Z'),
  ('sv_ja',     'C 和名',     '{{今日}}|{{現在}}|{{時刻}}|{{年}}|{{月}}|{{日}}|{{曜日}}',          NULL, 0, 0, '2026-02-08T00:00:00.000Z', '2026-03-03T00:00:00.000Z'),
  ('sv_case',   'D 表記ゆれ', '{{TODAY}}|{{ToDay}}|{{ today }}|{{ 今日 }}',                        NULL, 0, 0, '2026-02-07T00:00:00.000Z', '2026-03-04T00:00:00.000Z'),
  ('sv_unres',  'E 未解決',   '{{today:yyyy-MM-dd}}|{{存在しない変数}}|{{no_value_var}}',          NULL, 0, 0, '2026-02-03T00:00:00.000Z', '2026-03-08T00:00:00.000Z'),
  ('sv_title',  'F {{today}}の記録', '{{weekday}}に実施',                                          NULL, 1, 0, '2026-02-04T00:00:00.000Z', '2026-03-07T00:00:00.000Z'),
  ('sv_repeat', 'G 繰り返し', '{{today}}と{{today}}',                                              NULL, 0, 9, '2026-02-05T00:00:00.000Z', '2026-03-05T00:00:00.000Z'),
  ('sv_null',   NULL,         '無題だがタイトル同時コピーがONの本文。',                            NULL, 1, 8, '2026-02-06T00:00:00.000Z', '2026-03-06T00:00:00.000Z'),
  -- 展開順の観察用。使用頻度順で3番目（copyCount=7）、他の3種の並べ替えでは末尾に来るので
  -- 既存テストが押している1番目・2番目のカードを動かさない。
  ('sv_nested', 'H 入れ子',   '{{stamp}}',                                                         NULL, 0, 7, '2026-01-15T00:00:00.000Z', '2026-01-15T00:00:00.000Z');
