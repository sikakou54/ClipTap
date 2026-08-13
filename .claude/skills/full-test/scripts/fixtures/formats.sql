-- formats
-- システム変数の書式を既定以外へ設定した状態（§8.23）。
-- 既定書式へ戻す操作で行が削除されることも確認できる。

PRAGMA foreign_keys = ON;

DELETE FROM system_variable_formats;

INSERT INTO system_variable_formats (variableKey, pattern, updatedAt) VALUES
  ('today',   'yyyy年MM月dd日',      '2026-01-01T00:00:00.000Z'),
  ('now',     'yyyy-MM-dd HH:mm',    '2026-01-01T00:00:00.000Z'),
  ('weekday', 'EEEE',                '2026-01-01T00:00:00.000Z'),
  -- プリセットに無い値は既定書式へ戻して出力する（例外を投げない）
  ('time',    'INVALID_PATTERN',     '2026-01-01T00:00:00.000Z');
