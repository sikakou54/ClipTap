# サンプル

`docs/test/` へ作る成果物の書き方を示す、動作する最小例。
ホーム画面の4テスト（13ステップ）だけを持つ。

```bash
# 検証
node .claude/skills/full-test/scripts/validate.mjs --dir .claude/skills/full-test/sample

# 網羅率
node .claude/skills/full-test/scripts/coverage.mjs --dir .claude/skills/full-test/sample

# 実行（シミュレータが必要）
node .claude/skills/full-test/scripts/run.mjs \
  --spec .claude/skills/full-test/sample/testspec.csv \
  --doc-dir .claude/skills/full-test/sample \
  --run-id sample

# レポート
node .claude/skills/full-test/scripts/report.mjs --run sample \
  --doc-dir .claude/skills/full-test/sample
```

## この例で示していること

- `TC-S001` 並べ替え順序の検証（`ASSERT_ORDER`）と永続設定の確認（`ASSERT_PREF`）
- `TC-S002` クリップボードの実値検証（`ASSERT_CLIPBOARD`）。事前に初期値を入れて、
  「元の値のままではない」ことまで確かめている
- `TC-S003` 絞り込みの検証を「出るもの」ではなく「消えるもの」で確認（`ASSERT_SCREEN_LACKS`）
- `TC-S004` 画面表示とDBの突き合わせ（`ASSERT_DB`）とJSエラーの確認
- `P-F02-900` は `UNREACHABLE`。除外せず根拠を残す書き方の例

条件分岐網羅率が80%なのは、`C-F02-01`（完全な空DB）が
Debugビルドでは到達できずテストを割り当てられないため。
到達できないことを根拠付きで記録し、網羅率に正直に反映させている。
