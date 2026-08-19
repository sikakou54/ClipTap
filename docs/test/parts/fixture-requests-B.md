# fixture追加要求（グループB: 変数展開・プレビュー・コピー）

## 状況

**要求1 `sysvars` は対応済み。** `scripts/fixtures/sysvars.sql` が要求どおりの内容で追加されている
（プロファイル1・変数1・定型文8、並べ替え4種で各定型文が1〜2番目に来る配分）。
以降の記述は、その配分を後から変更してはいけない理由の記録として残す。

**追加の要求は無い。**

**2026-08-13 追記（レビュー指摘7の対応で `sysvars` を1回だけ追記した）。**
統括の許可のもとグループBが直接編集した。追加したのは次の3行だけで、既存行は1行も変えていない。

| 追加 | 内容 | 既存テストへの影響 |
|---|---|---|
| `variables` | `var_stamp`（`stamp` / ラベル `日付印` / `valid=1` / `sortOrder=1`） | ホーム画面に変数ツールバーは無い（`VariableToolbar` は `TextInputScreen` 専用）ので一覧の要素は増えない |
| `profile_variables` | `pv_stamp`（`pf_main` の `stamp` = `本日は{{today}}です`） | 既存の `no_value_var` は値なしのままなので TC-1005 の未解決トークン検証は不変 |
| `snippets` | `sv_nested`（`H 入れ子` / 本文 `{{stamp}}` / `copyCount=7` / `createdAt`・`updatedAt` = `2026-01-15`） | 4種の並べ替えで1番目・2番目に来ないことをSQLで検算済み。使用頻度順でだけ3番目に来る（`label=[2]`） |

検算した並び（`sysvars` 適用後）。太字が既存テストの押している位置。

- タイトル昇順: **A 日付系 / B 時刻系** / C / D / E / F / G / H 入れ子 / (null)
- 作成日時降順: **C 和名 / D 表記ゆれ** / (null) / G / F / E / B / A / H 入れ子
- 更新日時降順: **E 未解決 / F {{today}}の記録** / (null) / G / D / C / B / A / H 入れ子
- 使用頻度降順: **G 繰り返し / (null)** / H 入れ子 / C / D / F / E / B / A

使うテストは TC-1015（`P-F06-032`）だけ。

## 要求1: `sysvars`（対応済み）

### 必要な状態

システム変数7種・日本語別名・大文字小文字・前後空白・未解決トークンを含む定型文が
**保存済みで存在する**状態。

### 理由

- `docs/機能仕様書.md` §8.6 の展開規則は「保存済みの定型文をコピー・プレビューしたときの出力」で定義されている。
  クリップボードの実値（`ASSERT_CLIPBOARD`）で検証するには、対象トークンを含む定型文がDBに要る。
- 既存fixtureにあるシステム変数トークンは `baseline` の `sn_report` タイトル `進捗報告（{{today}}）` だけで、
  `now` / `time` / `year` / `month` / `day` / `weekday` と日本語別名・表記ゆれ・未解決トークンを
  1件も検証できない。
- 画面操作（作成画面で本文を入力）で前提を作ると、`scripts/state.sh` 冒頭の方針
  「前提を画面操作で作ると、前提を作る過程の不具合でテスト自体が倒れる」に反する。
  加えて `sim.sh type` は `osascript keystroke` のため、日本語トークン `{{今日}}` の入力を決定的に行えない。

### 使うテスト

TC-1000 / TC-1001 / TC-1002 / TC-1003 / TC-1004 / TC-1005 / TC-1006 / TC-1007 / TC-1103 / TC-1302

### 設計上の制約（この内容にした理由）

一覧のコピーボタンはアイコンのみでラベルを持たないため、順序指定（`[n]`）で特定する。
順序が確定するのは画面上端の1〜2件目だけなので、**4種の並べ替えで各定型文が1番目か2番目に来るよう**
`createdAt` / `updatedAt` / `copyCount` を配ってある。この配分を変えるとテストの前提が崩れる。

| 並べ替え | 1番目 | 2番目 |
|---|---|---|
| `title` | A 日付系 | B 時刻系 |
| `created` | C 和名 | D 表記ゆれ |
| `updated` | E 未解決 | F {{today}}の記録 |
| `usage` | G 繰り返し | H（タイトルなし） |

### `scripts/fixtures/sysvars.sql`（このまま追加してよい）

```sql
-- sysvars
-- システム変数7種・日本語別名・表記ゆれ・未解決トークンを1つの状態に集める（§8.6 / §8.23）。
--
-- 4種の並べ替えで各定型文が1番目か2番目に来るよう createdAt / updatedAt / copyCount を配ってある。
-- 一覧のコピーボタンはラベルを持たず順序で特定するため、この配分を変えるとテストが壊れる。

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

INSERT INTO snippets (id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt) VALUES
  ('sv_date',   'A 日付系',   '{{today}}|{{year}}|{{month}}|{{day}}|{{weekday}}',                  NULL, 0, 0, '2026-02-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z'),
  ('sv_time',   'B 時刻系',   '{{now}}|{{time}}',                                                  NULL, 0, 0, '2026-02-02T00:00:00.000Z', '2026-03-02T00:00:00.000Z'),
  ('sv_ja',     'C 和名',     '{{今日}}|{{現在}}|{{時刻}}|{{年}}|{{月}}|{{日}}|{{曜日}}',          NULL, 0, 0, '2026-02-08T00:00:00.000Z', '2026-03-03T00:00:00.000Z'),
  ('sv_case',   'D 表記ゆれ', '{{TODAY}}|{{ToDay}}|{{ today }}|{{ 今日 }}',                        NULL, 0, 0, '2026-02-07T00:00:00.000Z', '2026-03-04T00:00:00.000Z'),
  ('sv_unres',  'E 未解決',   '{{today:yyyy-MM-dd}}|{{存在しない変数}}|{{no_value_var}}',          NULL, 0, 0, '2026-02-03T00:00:00.000Z', '2026-03-08T00:00:00.000Z'),
  ('sv_title',  'F {{today}}の記録', '{{weekday}}に実施',                                          NULL, 1, 0, '2026-02-04T00:00:00.000Z', '2026-03-07T00:00:00.000Z'),
  ('sv_repeat', 'G 繰り返し', '{{today}}と{{today}}',                                              NULL, 0, 9, '2026-02-05T00:00:00.000Z', '2026-03-05T00:00:00.000Z'),
  ('sv_null',   NULL,         '無題だがタイトル同時コピーがONの本文。',                            NULL, 1, 8, '2026-02-06T00:00:00.000Z', '2026-03-06T00:00:00.000Z');
```

### 確認事項

`sv_case` の `{{ 今日 }}` と `sv_ja` の日本語トークンはSQLファイルへ直接書く。
`state.sh fixture` は `sqlite3 "$db" < "$f"` で流し込むため、ファイルがUTF-8であれば追加処理は要らない。
