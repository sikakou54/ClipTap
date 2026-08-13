# 不具合管理

保存先は `config.env` の `ISSUES_FILE`（既定 `docs/test/issues.md`）。
既存の台帳があれば**新規作成せず追記する**。既存の記述を上書き・削除しない。

## 登録対象

必ず登録する。

- `APPLICATION_DEFECT`
- `SPEC_IMPLEMENTATION_MISMATCH`

登録してよい（プロジェクトとして継続管理が必要と判断した場合）。

- 繰り返し起きる `AUTOMATION_ERROR`（例: ラベルが無くテストできない箇所）
- 恒常的な `ENVIRONMENT_ERROR`（例: 実機でしか確認できない機能）

登録しない。

- `TEST_SPEC_ERROR` / `PRECONDITION_ERROR`（テスト側を直せば消える）

FAILしたテストを無条件に不具合にしない。
[failure-classification.md](failure-classification.md) で分類を確定してから登録する。

---

## 登録の手順

```bash
B=.claude/skills/full-test/scripts/bug.mjs

# 1. 重複を必ず先に調べる（画面名・機能名・エラー文言・現象の語を並べる）
node $B search "定型文編集" "空で開く" "SC-SNIPPET-EDIT"

# 2a. 既存不具合と同一原因・同一現象なら、新規採番せず追記する
node $B recur BUG-0007 '{"detectedAt":"2026-08-12T18:30:00+09:00","testIds":["TC-0121"],
  "env":"iPhone 17 / iOS 26.5","actual":"タイトル欄が空のまま","evidence":["docs/test/results/20260812-1800/evidence/TC-0121-3-FAIL.png"]}'

# 2b. 新規なら登録する
node $B add '{ ... }'

# 3. 相互追跡の点検（results-tests.csv の BugID と台帳の検出テストが一致するか）
node $B check --run 20260812-1800
```

`add` は `title` / `cause` / `specRef` / `testIds` が無いと失敗する。
**主観だけでは登録できない**ようにしてある。

---

## 重複判定

`bug.mjs search` は台帳の本文に対するキーワード一致件数で候補を出す。
最終判定は次を総合して行う。

- 発生画面（`ScreenID`）
- 発生機能（`FeatureID`）
- 発生Route
- 発生条件（`Precondition` と `DataState`）
- 操作手順
- 期待結果 / 実際結果
- エラーメッセージ
- 発生箇所（分かっていればファイル・関数）
- 関連TestID

**同一原因・同一現象なら重複登録しない。** 既存BUG-IDへ次を追記する。

- 再現したTestID
- 再現日時
- 再現環境
- 新たな証跡

条件が違うだけで同じコード起因と推測できる場合も、まずは既存へ追記する。
別原因と判明した時点で分割する方が、重複を作るより追いやすい。

---

## BUG-ID

```
BUG-0001, BUG-0002, ...
```

`bug.mjs next-id` が既存の最大番号+1を返す。手で採番しない。

---

## 台帳フォーマット

```markdown
## BUG-0001

- **タイトル**:
- **ステータス**: Open
- **重要度**:
- **優先度**:
- **検出日時**:
- **検出テスト**:
- **関連PatternID**:
- **関連FeatureID**:
- **関連ScreenID**:
- **発生Route**:
- **発生環境**:
- **前提条件**:
- **再現手順**:
- **期待結果**:
- **実際結果**:
- **再現性**:
- **原因分類**:
- **仕様根拠**:
- **証跡**:
- **備考**:
```

第三者が再現・調査するのに必要な情報を省略しない。

---

## タイトル

現象を具体的に書く。何がどうなったかが1行で分かること。

| | 例 |
|---|---|
| 悪い | 定型文編集がおかしい |
| 良い | 既存の定型文を編集で開くとタイトルと本文が空欄で表示される |

| | 例 |
|---|---|
| 悪い | コピーがうまくいかない |
| 良い | 変数値を空で保存したプロファイルで、一覧の表示文字列とコピー結果が食い違う |

---

## 重要度

| 重要度 | 基準 |
|---|---|
| **Critical** | アプリが起動しない / クラッシュする / データが破損・消失する / セキュリティ上重大 / 主要機能が完全に利用不能 |
| **Major** | 主要機能の一部が使えない / 正しい操作でも処理を完了できない / 重要な画面遷移が成立しない |
| **Minor** | 代替手段がある / 特定条件でのみ発生する / 操作性や表示に問題がある |
| **Trivial** | 軽微な表示崩れ / 文言・レイアウトの些細な問題 |

ClipTapでの当てはめ。

- コピー結果が誤っている、保存した定型文が消える → **Critical**（このアプリの中核はコピーとデータ保持）
- 編集画面が空で開く、保存がエラーになる → **Major**
- 空状態の案内文が出ない、プルリフレッシュのインジケータが戻らない → **Minor**
- ダークモードでの軽微な色ずれ → **Trivial**

## 優先度

重要度と、発生条件の起こりやすさで決める。

| 優先度 | 目安 |
|---|---|
| P1 | Critical、または通常の使い方で必ず起きるMajor |
| P2 | 条件付きで起きるMajor、頻度の高いMinor |
| P3 | それ以外 |

---

## 再現性

| 値 | 意味 |
|---|---|
| `Always` | 実行するたびに再現する |
| `Intermittent` | 再現したりしなかったりする |
| `Once` | 1回だけ観測、再現手順が未確定 |
| `Unknown` | 再実行していない |

可能なら3回実行して再現率を `備考` に書く。
**再実行でPASSしたことを理由に最初のFAILを消してはいけない。**
その場合は `Intermittent` として登録し、再現率を残す。

---

## 仕様根拠

「期待した動作と違った」だけでは登録できない。次のいずれかを書く。

```
機能仕様書 §8.2 「保存した定型文が一覧、検索、コピーの対象になる」
機能仕様書 §10.4 プロファイル上限メッセージ
テスト仕様 PatternID: P-F02-007
ソースコード packages/shared/src/services/snippetService.ts の入力検証
定数定義 packages/shared/src/constants/inputLimits.ts INPUT_LIMITS.SNIPPET_TITLE_MAX
```

機能仕様書に記述が無いなら、それは不具合ではなく**未確定事項**の可能性がある。
その場合は `docs/機能仕様書.md` 第15章へ記録する対象として `備考` に書き、
原因分類は `TEST_SPEC_ERROR` にする。

---

## 証跡

ランナーは失敗したステップで必ず次を残す。

- `<RESULTS_DIR>/<runId>/evidence/<TestID>-<StepNo>-FAIL.png` — スクリーンショット
- `<RESULTS_DIR>/<runId>/evidence/<TestID>-<StepNo>-FAIL.txt` — Expected / Actual とAXツリー

台帳にはこのパスを書く。加えて次を記録する。

- TestID / PatternID / 失敗したStepNo
- 発生Route
- Simulator・OSバージョン（`results-tests.csv` の `Device` / `OSVersion`）
- 必要なら `sim.sh logs` の出力

**再現できる証跡を捨てない。** 証跡ファイルは実行結果ディレクトリに残す。

---

## トレーサビリティ

```
機能仕様 → 機能 → PatternID → TestID → TestResult → BUG-ID
```

双方向に辿れること。

- `results-tests.csv` の `BugID` 列 → 台帳の `## BUG-XXXX`
- 台帳の `検出テスト` → `testspec.csv` の `TestID`

`bug.mjs check --run <runId>` がこの対応の切れを検出する。
次のいずれかが1件でもあればレポートを確定できない。

- FAILなのに `FailureClass` が未確定（`REQUIRES_TRIAGE` のまま）
- `APPLICATION_DEFECT` / `SPEC_IMPLEMENTATION_MISMATCH` なのに `BugID` が空
- `BugID` が台帳に存在しない
- 台帳側に検出テストの記載が無い

---

## やってはいけないこと

- FAILを記録せずに次のテストへ進む
- `APPLICATION_DEFECT` を台帳へ登録しない
- 同じ不具合に複数のBUG-IDを振る
- 根拠なしに不具合と判断する
- 再実行でPASSしたことを理由に不具合を削除する
- 不具合を見つけたついでにアプリを修正する
- 登録後にテスト結果をPASSへ書き換える
- 台帳の既存内容を上書き・消去する
