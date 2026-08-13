# テスト仕様書レビュー結果（第三者レビュー）

対象: `docs/test/features.csv` / `screens.csv` / `routes.csv` / `pattern-matrix.csv` / `testspec.csv`
判断基準: `docs/機能仕様書.md`（正本） > `apps/mobile/` `packages/shared/` の実装 > `csv-schema.md` / `patterns.md`
実測（シミュレータ実行）は行っていない。以下はすべて成果物とソースコードの突き合わせによる。

機械検証（`validate.mjs` エラー0件 / `coverage.mjs` 全項目100%）で保証済みの範囲は再確認していない。

---

## 指摘1: F-14「全復元・選択インポート」が実質未検証のまま `in-scope` になっている

- **対象**: F-14 全般 / TC-3200〜TC-3207 / P-F14-001〜P-F14-E02 / `docs/test/features.csv:15`
- **重要度**: 高
- **内容**:
  F-14 のテストは8件あるが、8件すべてが「入出力画面のインポート**行**が表示される／英語表記になる／ダークでも表示される／活性である／Proでも同じ」という**画面表示の確認だけ**で、インポート機能そのものを1ステップも実行していない。
  58パターン中50パターンが `UNREACHABLE`（DocumentPickerがAXツリーに出ない）で、残る8パターンがこの表示確認である。
  結果として次の仕様がすべて未検証になっている。
  - 全復元の確認ダイアログと単一トランザクション（§8.14 全復元 1〜4）
  - 旧スキーマ（V3〜V6）の一時DB上での移行（§8.14 共通検証）
  - パスワード／チェックサム／拡張子／スキーマ過新の各拒否（§8.14、§10.4）
  - 標準・アクティブプロファイルの補完条件（§8.14 全復元3、選択インポート）
  - 選択インポートの同名判定（前後空白の差でカテゴリ・プロファイルは関連付かず、変数はロールバックする）（§8.14 選択インポート）
  - 反映途中失敗時のロールバック（§8.14 事後条件）

  それにもかかわらず `features.csv` の Scope は `in-scope` であり、`coverage.mjs` は `UNREACHABLE` を母数から外す実装（`coverage.mjs:53-77`）なので、この状態でも網羅率は100%と表示される。**100%という数字はF-14について何も保証していない。**
  `Scope` の語彙には `manual-only` があるが、23機能で1件も使われていない。
- **根拠**: 機能仕様書 §8.14 全文 / `docs/test/pattern-matrix.csv` の F-14 行 / `.claude/skills/full-test/scripts/coverage.mjs:53-77`
- **修正案**:
  1. F-14（および後述の指摘2に該当するF-13のエクスポート実行以降）の Scope を `manual-only` へ改め、`coverage.mjs` の母数から明示的に外す。
  2. 同時に、手動検証手順書（`.cliptap` の作成→別端末での全復元→選択インポート→ロールバック確認）を `docs/test/` へ追加し、そこから `UNREACHABLE` パターンIDを参照して**どのパターンを人手で見るか**を対応付ける。現状は167件の `UNREACHABLE` に対する受け皿がどこにも無い（指摘4も参照）。
  3. 上記が用意できるまでは「インポート・エクスポートは自動テストの対象外」であることを実行レポートの先頭に明記する。

---

## 指摘2: 一覧の「表示順」を主張するテストが、期待順序を自分で書いた SQL でしか検証していない

- **対象**: TC-0233 / TC-0222 / TC-0124 / TC-0350（`docs/test/testspec.csv`）
- **重要度**: 高
- **内容**:
  TC-0233 の目的は「プロファイル一覧が標準を先頭に**表示順**で並ぶこと」だが、順序を確かめているステップは次の1つだけである。

  ```
  ASSERT_DB  select group_concat(name, '/') from (select name from profiles order by isDefault desc, sortOrder asc);  → Main/A社用/B社用
  ```

  この SQL は期待する並び順そのものを `ORDER BY` に書いているため、**画面が何を描画していても必ず成立する**。UI側の確認は `ASSERT_SCREEN_HAS` が3回（Main / A社用 / B社用 が「存在する」こと）だけで、順序を見ていない。
  TC-0222「標準を切り替えると切替先が一覧の**先頭へ移る**こと」も同じ構造で、UI側の確認が1つも無い。TC-0124（カテゴリのsortOrder順）、TC-0350（カスタム変数のsortOrder順）も同様。

  `ASSERT_ORDER` は Action 語彙にあり、他機能では46ステップで使われている（例: TC-1000 `ASSERT_ORDER role=AXButton&has=label → A 日付系,B 時刻系`）。ここで使わない理由が成果物から読み取れない。

  直近のコミット `ccd05f8 feat: プロファイル一覧で標準を先頭に表示する` はまさにこの表示順の実装であり、**その回帰を守るはずのテストが実装を1行も見ていない**。
- **根拠**: 機能仕様書 §8.4「標準プロファイルを先頭に置き、その後は `sortOrder`順で表示し」/ §9.1 プロファイル管理「標準を先頭にした保存済み順の一覧」/ `csv-schema.md` の `ASSERT_ORDER` 定義
- **修正案**: TC-0233 / TC-0222 / TC-0124 / TC-0350 に `ASSERT_ORDER` を追加する。行の集約ラベルは `A社用, 標準にする, 削除` の形になるため、`ASSERT_ORDER role=AXButton&has=label&visible=true` に対し `Main,A社用,B社用` のような前方一致で比較できる形へ調整する（一致方式が完全一致しかないなら、ロケータを行名テキストへ絞る）。既存の `ASSERT_DB` は「DBの状態」の確認として残してよいが、それだけを表示順の根拠にしない。

---

## 指摘3: §10.4 のエラー文言が testspec にほとんど現れず、到達可能な1件はパターン自体が存在しない

- **対象**: `pattern-matrix.csv` C-F03-04（P-F03-011〜P-F03-017）/ `testspec.csv` 全般
- **重要度**: 高
- **内容**:
  機能仕様書 §10.4 に列挙された利用者向けエラー33件のうち、`testspec.csv` の期待値として1度も現れないものが23件ある（「内容を入力してください」は本文欄のプレースホルダーとしての出現のみで、エラー表示としては未検証）。
  大半は Web専用・DocumentPicker経由・実機Sandbox必須で `UNREACHABLE` 側に根拠が記録されているが、次の1件は**モバイルで到達可能なのに、パターン網羅表に行そのものが無い**。

  | 条件（§10.4） | 日本語表示 | 状態 |
  |---|---|---|
  | モバイル・RGB範囲外 | `RGB値は0から255の範囲で入力してください` | **パターンが存在しない** |

  §10.4 は「通常は保存ボタンを無効にするが、**カテゴリ名欄から保存処理へ入った場合は表示する**」と到達経路まで明記している。実装も一致する。

  - `apps/mobile/app/category/edit.tsx:122` — カテゴリ名の `TextInput` に `onSubmitEditing={handleSave}`
  - `apps/mobile/src/hooks/screens/useCategoryEditScreen.ts:197-199` — `if (useCustomColor && !isCustomColorValid) throw new InvalidRgbValueError();`
  - `useCategoryEditScreen.ts:214` — `catch { showErrorAlert(translateError(error)); }`

  つまり「カスタムRGBタブでRを256にし、カテゴリ名欄で `PRESS_KEY return`」でアラートが出る。
  C-F03-04 は「プリセット選択・カスタムRGB正常値・RGB空欄・RGB範囲外・RGB下限・RGB上限・非数字混入の7通り」と宣言しているが、RGB範囲外（P-F03-014）の期待値は「保存ボタンが操作不能になる」で止まっており、§10.4 が定義したもう一方の経路が条件軸に入っていない。

  併せて、`error.empty_title`（`タイトルを入力してください`）も同じ `onSubmitEditing` 型の防御コード（`useSnippetFormScreen.ts:215-217`、`canSave` により保存ボタンは無効）だが、`UNREACHABLE` としても記録されていない。「洗い出していない」のか「到達不能と判断した」のかが成果物から読み取れない。
- **根拠**: 機能仕様書 §10.4 / `apps/mobile/app/category/edit.tsx:122` / `apps/mobile/src/hooks/screens/useCategoryEditScreen.ts:197` / `apps/mobile/src/hooks/screens/useSnippetFormScreen.ts:215`
- **修正案**:
  1. C-F03-04 に「カスタムRGBが範囲外の状態でカテゴリ名欄からreturnキーで保存処理へ入る」パターンを追加し、`ASSERT_SCREEN_HAS RGB値は0から255の範囲で入力してください` を期待値にする。
  2. §10.4 の33件を一覧化し、各行に対応する PatternID（REACHABLE / UNREACHABLE + 根拠）を必ず1つ割り当てる。割り当てのない行を残さない。

---

## 指摘4: `UNREACHABLE` 167件に対する検証の受け皿が無い

- **対象**: `pattern-matrix.csv` の `Reachability=UNREACHABLE` 全167行 / `features.csv`
- **重要度**: 高
- **内容**:
  700パターン中167件（23.9%）が `UNREACHABLE` である。根拠は個別に読んだ限り妥当で、「面倒だから」に類するものは見当たらなかった（DocumentPicker48件、共有シート9+4件、Web14件、拡張キーボード13件、Android4件、StoreKit/外部認証16件、ほか個別のUI制約）。
  問題は**その先が無い**ことである。167件のうち原理的に検証不能なものはごく一部で、大半は「実機なら可能」「Sandboxなら可能」「手動なら可能」に分類される。にもかかわらず、
  - `features.csv` の `Scope` は23機能すべて `in-scope`（F-15 のみ `out-of-scope`）で、`manual-only` が1件も無い
  - `docs/test/` に手動検証手順書が存在しない
  - `coverage.mjs` は `UNREACHABLE` を母数から外すため、これらは網羅率のどこにも現れない

  結果、「自動テストを全部流してPASS」＝「リリース可」と誤読される構造になっている。特にF-13/F-14（データ入出力）とF-17（購入・復元）は、失敗時の影響が大きいのに自動側の穴が大きい。
- **根拠**: `.claude/skills/full-test/scripts/coverage.mjs:36-40, 53-77` / `docs/test/features.csv` / `docs/test/` にマニュアル手順が無いこと
- **修正案**: `UNREACHABLE` を「実機で可能」「Sandboxで可能」「手動で可能」「原理的に不能」の4つに分類し、前3者は手動チェックリストへ移す。`UnreachableReason` の末尾に移送先（手動手順書の項番）を書けば台帳のまま追跡できる。

---

## 指摘5: `screens.csv` の Signature が26画面中13画面で未検証

- **対象**: `docs/test/screens.csv` / `docs/test/parts/SIGNATURE-STATUS.md`
- **重要度**: 中
- **内容**:
  `SIGNATURE-STATUS.md` 自身が「未検証（初回実行で確定させる）」として13画面を挙げている（SC-SEARCH / SC-SNIPPET-CREATE / SC-SNIPPET-TITLE-INPUT / SC-SNIPPET-CONTENT-INPUT / SC-SNIPPET-PROFILE-SELECT / SC-PROFILE-EDIT / SC-PROFILE-VARIABLE-EDIT / SC-VARIABLE-EDIT / SC-VARIABLE-PROFILE-VALUE-EDIT / SC-SETTINGS-EXPORT-IMPORT / SC-SETTINGS-SELECT-IMPORT-DATA / SC-SUBSCRIPTION-MANAGE / SC-SUBSCRIPTION-PAYWALL）。
  `ASSERT_SCREEN` は testspec 全体で700回近く使われ、うち未検証画面を対象にするものが SC-SNIPPET-CREATE 34回、SC-SNIPPET-TITLE-INPUT 22回、SC-VARIABLE-EDIT 41回、SC-SEARCH 43回などに及ぶ。1つでも文字列がずれていれば、無関係な機能のテストが数十件まとめて落ちる。
  文言自体は `packages/shared/src/i18n/ja.json` と突き合わせて存在を確認した（`snippet.create=定型文作成`、`snippet.title_input=タイトルを入力`、`variables.variable_label_hint=ツールバーに表示される名前` など）ので、文字列そのものの誤りは見当たらない。残る不確実性は「その文字列が完全一致で1要素として現れるか」「他画面と衝突しないか」で、これは実測でしか潰せない。
- **根拠**: `docs/test/parts/SIGNATURE-STATUS.md`「未検証（初回実行で確定させる）」/ `packages/shared/src/i18n/ja.json:33,34,40,44,48,52,107,154,246,252,253,307`
- **修正案**: 本番実行の前に `sim.sh count '<Signature>'` を13画面分だけ流し、一致件数1を確認する。この確認をしないまま全件実行すると、初回の結果表がAUTOMATION_ERRORで埋まり、本当の不具合が埋もれる。

---

## 指摘6: ネットワーク遮断の扱いがグループ間で矛盾し、TC-2014 は必ず BLOCKED になる

- **対象**: TC-2014（P-F01-015）/ P-F19-004 / P-F17-036 / P-F18-120
- **重要度**: 中
- **内容**:
  同じ制約（`config.env` の `ALLOW_NETWORK_TOGGLE=0`）に対して判断が割れている。

  | パターン | 判断 |
  |---|---|
  | P-F19-004（広告取得失敗） | `UNREACHABLE`。理由に `ALLOW_NETWORK_TOGGLE=0` を明記 |
  | P-F17-036（RevenueCat障害） | `UNREACHABLE`。同上 |
  | P-F18-120（権利検証失敗） | `UNREACHABLE`。同上 |
  | **P-F01-015（オフラインでも業務データを読む）** | **`REACHABLE`。TC-2014 の Precondition が `network=off`** |

  `run.mjs:192-195` は `ALLOW_NETWORK_TOGGLE !== '1'` のとき `Blocked` を投げるため、TC-2014 は実行すれば必ず BLOCKED になる。`validate.mjs` は `network=off` を語彙として認めるだけで config は見ないので機械検証を通過してしまう。
- **根拠**: `.claude/skills/full-test/config.env` `ALLOW_NETWORK_TOGGLE=0` / `.claude/skills/full-test/scripts/run.mjs:191-197` / `docs/test/testspec.csv:2297`
- **修正案**: 実行前に `ALLOW_NETWORK_TOGGLE=1` を許可するか、TC-2014 を取り下げて P-F01-015 を他3件と同じ根拠で `UNREACHABLE` にするか、どちらかへ統一する。オフライン動作は CLAUDE.md の最上位ルールなので、個人的には前者（1件だけ許可する）を推す。

---

## 指摘7: §8.6 の「システム変数を先に、次にカスタム変数を展開する」順序を確かめるパターンが無い

- **対象**: C-F06-01〜C-F06-10（`pattern-matrix.csv` の F-06 全31パターン）
- **重要度**: 中
- **内容**:
  §8.6「展開の共通規則」の 2. は展開順を明示している。この順序が観察できるのは「カスタム変数の値がシステム変数トークンを含む」場合だけで、規則どおりならシステム変数展開が先に終わっているため、後から差し込まれた `{{today}}` は**展開されずトークンのまま残る**。逆順の実装なら日付へ置換される。
  C-F06-* を通読したが、この組合せのパターンが1件も無い。`sysvars` fixture にも該当データが無い。順序という規則が仕様書に明記されているのに、それを分岐として抽出できていない。
  同様に「カスタム変数の値が別のカスタム変数トークンを含む」場合（再帰展開の有無）も仕様書に記載が無く、パターンにも無い。こちらは仕様側の不足なので、機能仕様書へ反映する候補になる（§1.1: 実装を正として仕様書を追従。判断できない差はユーザー確認）。
- **根拠**: 機能仕様書 §8.6「展開の共通規則」2.「システム変数を先に、次にカスタム変数を展開する」
- **修正案**: `baseline` か `sysvars` に「値が `{{today}}` を含むカスタム変数」を1件足し、それを参照する定型文をコピーして `ASSERT_CLIPBOARD` でトークンが残ることを確認するパターンを C-F06-* に追加する。

---

## 指摘8: §8.11 のコピー失敗時の表示差にパターンが無い（`UNREACHABLE` としても記録されていない）

- **対象**: C-F11-08（P-F11-018 / P-F11-019）
- **重要度**: 中
- **内容**:
  §8.11 モバイルには次の非対称が明記されている。

  > ホーム・検索の本文コピーは、どちらかが失敗してエラーを表示した場合も画面ハンドラが例外を再送出しないため、カード側では約2秒間のコピー済み表示を行う。**タイトルコピーは失敗を再送出するためコピー済み表示を行わない。**

  C-F11-08 は「コピー済み表示（P-F11-018）」と「触覚フィードバック（P-F11-019、UNREACHABLE）」の2件だけで、失敗経路の表示差を扱うパターンが存在しない。決定的に失敗を起こせないなら `UNREACHABLE` として根拠付きで残すべきで、行そのものが無いと「洗い出していない」と区別がつかない。
  同じ理由で §8.12 の加算条件「モバイル本体はクリップボード書込みと触覚フィードバックの**両方**の完了」も、触覚側が観測不能である旨は P-F11-019 に書かれているが、F-12 側（C-F12-01）にはその制約が引き継がれていない。
- **根拠**: 機能仕様書 §8.11 モバイル 3項目め / §8.12 事前条件
- **修正案**: 失敗経路のパターンを2件（本文コピー失敗時は表示する／タイトルコピー失敗時は表示しない）追加し、`UNREACHABLE` + 「クリップボード書込みの失敗を外部から決定的に起こせない」を根拠に記録する。

---

## 指摘9: 行内ボタンの操作が座標比 `TAP_IN` に依存している（24ステップ / 23テスト）

- **対象**: TC-0120 / TC-0121 / TC-0218 / TC-0219 / TC-0221 / TC-0222 / TC-0224〜TC-0227 / TC-0239 / TC-0340〜TC-0342 / TC-3305〜TC-3307 / TC-3363 / TC-3365 / TC-3370〜TC-3373
- **重要度**: 中
- **内容**:
  カテゴリ管理・プロファイル管理・変数管理の行内ボタン（削除 / 標準にする）は親の `TouchableOpacity` が `accessible` のためAXツリーに独立要素として出ない（`FINDINGS.md` 所見3、`apps/mobile/app/settings/profiles.tsx:55,102-113`）。これを回避するため、行の矩形に対する相対座標 `0.78,0.5`（標準にする）と `0.93,0.5`（削除）で押している。
  `csv-schema.md`「ロケータ構文」は「要素は座標ではなくラベルで指定する」を原則としており、この24ステップだけがその原則の外にある。行の幅、プロファイル名の長さ、`無効` バッジや `標準` バッジの有無でボタン位置は動くため、レイアウト変更で静かに別の要素を押すようになる。
  緩和策として、23テスト中22テストは `TAP_IN` の直後に確認ダイアログを `ASSERT_SCREEN_HAS` していて誤爆を検知できる。**例外は TC-0221 で、`TAP_IN` の次がいきなり `TAP label=OK`** になっており、押し損ねた場合の症状が「OKが見つからない＝実行できなかった」になり、原因が分かりにくい。
  また TC-3305 / TC-3306 / TC-3307 / TC-3363 / TC-3365 / TC-3370〜TC-3373 は `TAP_IN` のロケータに `visible=true` を明示していない（ランナーが自動付与するので動作はするが、`TAP` と違って `TAP_IN` は安全域外の自動スクロールを行わないため、`over-limit`（5行）で下位の行を狙うときに画面外・広告バナー下に入るリスクが残る）。
- **根拠**: `.claude/skills/full-test/reference/csv-schema.md`「要素は座標ではなくラベルで指定する」/ `.claude/skills/full-test/scripts/run.mjs:300-305`（`TAP_IN` は `visibleLocator` は付けるがスクロールはしない）/ `apps/mobile/app/settings/profiles.tsx:102-113`
- **修正案**:
  1. TC-0221 に `ASSERT_SCREEN_HAS プロファイル「A社用」を標準にしますか？` を `TAP_IN` の直後へ挿入する（他22テストと揃える）。
  2. `over-limit` を使う `TAP_IN` の前に `SCROLL_TO` を入れて対象行を安全域へ寄せる。
  3. 根本策として `FINDINGS.md` 所見3の提案（行コンテナを `accessible={false}` にする）を実装側へ回す。実現すれば13パターンが `REACHABLE` へ戻り、この24ステップもラベル指定へ置き換えられる。

---

## 指摘10: 「長大入力」の境界値が本文60文字で、境界として意味を持たない

- **対象**: P-F02-014 / TC-0014
- **重要度**: 中
- **内容**:
  C-F02-06 は「本文の文字数上限なし」を確かめる軸として P-F02-014 を置くが、入力するのは60文字で、期待値も `length(content)=60`。
  `patterns.md`「1. 入力パターン」の「長大入力」は「本文に上限は無い。**数千文字**を貼り付ける」と定義されている。60文字はタイトル上限（30文字）の2倍でしかなく、「上限が無い」ことの根拠にならない。`TYPE_PASTE` / `PASTE_RAW` を使えば数千文字も投入できる（絵文字テストの P-F02-013 で貼り付け系は既に使われている）。
- **根拠**: `.claude/skills/full-test/reference/patterns.md`「長大入力 / 本文に上限は無い。数千文字を貼り付ける」/ 機能仕様書 §8.2「本文 … 文字数上限はない」
- **修正案**: `PASTE_RAW` で2,000〜5,000文字を投入し、`ASSERT_DB select length(content) …` で欠落しないことを確認する形へ変更する。ついでに一覧・プレビューが落ちないこと（`ASSERT_NO_JS_ERROR`）も見ておくと、この観点の目的に合う。

---

## 指摘11: `ConditionID` の表記ゆれ（`C-04-90` / `C-05-90`）

- **対象**: P-F04-E01（`C-04-90`）/ P-F05-E01（`C-05-90`）
- **重要度**: 低
- **内容**:
  `patterns.md` は `ConditionID` を `C-<FeatureID省略形>-<連番2桁>`（例 `C-F04-01`）と定めているが、この2行だけ `F` が抜けている。`validate.mjs` は `ConditionID` の空欄しか見ないので通過する。
  `coverage.mjs` は `ConditionID` を集合として数えるため、表記ゆれがあると同じ軸が2つに割れて条件網羅率の分母が水増しされる。
- **根拠**: `.claude/skills/full-test/reference/patterns.md`「パターンIDの付け方」/ `docs/test/pattern-matrix.csv` の該当2行
- **修正案**: `C-F04-90` / `C-F05-90` へ揃える。ついでに `validate.mjs` へ `ConditionID` の形式チェック（`/^C-F\d{2}-\d{2}$/`）を足せば再発しない。

---

## 指摘12: `TestData` 列に解決済みの申し送りが残置している

- **対象**: TC-1000〜TC-1007 / TC-1103 / TC-1206 / TC-1302（11テスト、68行）
- **重要度**: 低
- **内容**:
  `TestData` が `sysvars.sql（要追加。fixture-requests-B.md 参照）` のままになっている。実際には `.claude/skills/full-test/scripts/fixtures/sysvars.sql` が存在し、`fixture-requests-B.md` 冒頭も「**要求1 `sysvars` は対応済み。**追加の要求は無い」と書いている。
  実行者がこれを見ると「fixtureが未整備＝このテストは流せない」と誤解する。
- **根拠**: `.claude/skills/full-test/scripts/fixtures/sysvars.sql` の存在 / `docs/test/parts/fixture-requests-B.md:3-7`
- **修正案**: 該当68行の `TestData` を `sysvars.sql`（TC-1103 は `sysvars.sql + formats.sql`）へ置換する。

---

## 指摘13: `screens.csv` が `csv-schema.md` の定義から2点ずれている

- **対象**: `docs/test/screens.csv`
- **重要度**: 低
- **内容**:
  1. `csv-schema.md` は `File` 列について「`apps/mobile/app/**` の全ファイルが1行ずつ現れること」と定めるが、`apps/mobile/app/_layout.tsx` と `apps/mobile/app/settings/_layout.tsx` の2件が無い。レイアウトなので画面台帳に載せない判断は理解できるが、その判断が成果物のどこにも書かれていない（「読み取れない」）。
  2. `Presentation` 列の語彙は `stack / modal / transparentModal / fullScreenModal / card` だが、SC-SNIPPET-CREATE と SC-SNIPPET-EDIT が `modal|card` という複合値を持つ。`isTabletDevice` で分岐する意図は `patterns.md`「タブレット差」から推測できるが、語彙外の値であることに変わりはなく、機械検証も効かない。
- **根拠**: `.claude/skills/full-test/reference/csv-schema.md` screens.csv の `File` / `Presentation` の定義
- **修正案**: `_layout.tsx` を除外した旨を `screens.csv` の直上コメントか `SIGNATURE-STATUS.md` に1行書く。`Presentation` は `modal` に寄せ、タブレット時に `card` になることは `SpecRef` か別列で持つ。

---

## 指摘14: SC-VARIABLE-FORMAT-EDIT の Signature が一度も使われていない

- **対象**: SC-VARIABLE-FORMAT-EDIT / TC-1101 など同画面を扱う11テスト
- **重要度**: 低
- **内容**:
  書式選択画面を経由するテストは11件あるが、`ASSERT_SCREEN SC-VARIABLE-FORMAT-EDIT` は0回である。代わりに `ASSERT_SCREEN_HAS 既定` を使っている。
  `SIGNATURE-STATUS.md` によればこの Signature（`label~=既定 + -label=すべて既定に戻す`）は実機で不一致を確認して修正済みの唯一の例で、せっかく確定させたものが使われていない。「既定」の部分一致だけでは、書式一覧画面（`SC-SETTINGS-SYSTEM-VARIABLE-FORMATS`、`すべて既定に戻す` を持つ）に留まっていても成立し得る。
- **根拠**: `docs/test/screens.csv:17` / `docs/test/parts/SIGNATURE-STATUS.md`「修正済み（実機で不一致を確認）」
- **修正案**: TC-1101 の Step 7 など、書式選択画面へ入った直後を `ASSERT_SCREEN SC-VARIABLE-FORMAT-EDIT` へ置き換える。

---

## 指摘15: `Category` 列の付け方にぶれがある

- **対象**: TC-2322 / TC-2323（`互換性`）/ 性能5件（TC-2012 / TC-2128 / TC-2210 / TC-2211 / TC-2320）
- **重要度**: 低
- **内容**:
  - TC-2322「検索結果が並べ替え設定どおりの順序で並ぶこと」／TC-2323「検索語が空のときは並べ替え設定どおりに並ぶこと」が `互換性` になっている。バージョン間・データ版間の互換ではなく通常の表示順の確認なので `正常系` か `表示` が妥当。`互換性` はこの2件しか無く、実質「互換性の観点は0件」である。
  - `性能` 5件はいずれも「200件のDBでも動く」という確認で、時間を1つも測っていない。機能仕様書 §14.6 の性能要件は「検索入力の300ミリ秒デバウンス」「索引の使用」であり、デバウンスは C-F07-04（P-F07-019 / P-F07-020）が担当している。したがって `性能` カテゴリの5件は実質 `大量データでの正常系` である。
  誤りではないが、実行後に「異常系34件（6.9%）・互換性2件・性能5件」という内訳だけを見ると、実態と違う印象を与える。
- **根拠**: 機能仕様書 §14.6 性能 / `csv-schema.md` の `Category` 定義
- **修正案**: TC-2322 / TC-2323 を `表示` へ。`性能` の5件は名称どおりの計測を入れないなら `正常系`（大量データ）へ寄せ、`Condition` に「大量データ」の軸であることを明記する。

---

## 併せて確認し、問題が無かった点

指摘を作るために調べて、結果として妥当だったものも記録しておく。

- **画面台帳の網羅**: `apps/mobile/app/**` の `.tsx` 27件のうち、`_layout.tsx` 2件を除く25件がすべて `screens.csv` にある（`webview.tsx` は利用規約／プライバシーポリシーの2行へ分割）。ルート台帳98行にも、全26 ScreenID が最低1行ずつ現れる。
- **機能台帳と §7 の一致**: F-01〜F-23 が過不足なく揃い、`Platform` 列も §7 の表（○ / ― / 参照のみ）と矛盾しない。
- **`ASSERT_DB` の健全性**: 全 `ASSERT_DB` の参照テーブル・列がV7スキーマ（`packages/shared/src/database/schema.ts`）に実在する。`id='sn_greet'` 等の**fixture行IDの参照は全件、対応するfixture SQLに実在する**（機械チェックで0件の不整合）。
- **期待文言と i18n の一致**: 期待値に現れる日本語UI文言を `packages/shared/src/i18n/ja.json` / `en.json` と突き合わせた結果、不一致は0件。`{{name}}` `{{limit}}` の補間後の形（`「company」は既に存在します`、`変数 client_name を削除しますか?`、`プロファイル「A社用」を標準にしますか？` 等）も定義どおり。
- **テストの独立性**: 496テストすべてが `Precondition` に `plan=` を持ち、`install=fresh` の4件を除く492件が `fixture=` を持つ。ランナーは各テストの先頭で `applyDirectives` を実行する（`run.mjs:588-589`）ため、`Cleanup=none` が多くても実行順の依存は生じない。
- **`UNREACHABLE` の根拠**: 167件すべてを読んだ。外部プロセス（DocumentPicker / 共有シート / StoreKit / 外部認証UI）、別実行基盤（Web / Android / .appex）、AXツリーに出ない表現（Ioniconsのラジオ、装飾バッジ、WebView本文、色）、config制約（`ALLOW_NETWORK_TOGGLE=0`、`STEP_INTERVAL_MS=600`）、実装上の防御コード（`useProfileEditScreen.ts:109`、`ProfileService.setDefault` のガード）のいずれかに帰着しており、根拠として妥当。実装への参照（`select-export-data.tsx:224`、`profiles.tsx:105`）も実際のコードと一致していた（行番号は±2のずれ）。**唯一の例外が指摘6のネットワークである。**
- **境界値の対**: タイトル30/31（P-F02-007/008）、プロファイル名20/21（P-F04-005/006）、変数名30/31（P-F05-013/014）、ラベル30/31（P-F05-016/017）、RGB 0/255/256（P-F03-014/015/016）、Freeプロファイル3件ちょうど/超過（P-F18-011/013）、Free変数5件ちょうど/超過（P-F18-021/022）がいずれも対で存在する。片側だけの境界値は見つからなかった。
- **Free / Pro の対**: 挙動が変わるF-04・F-05・F-13・F-18・F-19・F-23 のいずれにも両方のパターンがある。
- **件数状態**: 0件／1件／複数件／上限到達が F-02（C-F02-15）、F-04（C-F04-10）、F-05（C-F05-15）、F-13（C-F13-03）に揃っている。
- **日付依存**: 期待値の日付・時刻はすべて `${TODAY:...}` `${TODAY_EN:...}` `${NOW:...}` で書かれており、固定日付の埋め込みは無い。
- **設計上の所見**: `FINDINGS.md` の6件（検索が並べ替えを無視する／管理画面のフルアクセス注記欠落／入れ子ボタンのAX問題／`/profile/variable-edit` への導線が無い／未連携バッジ／アプリ版数表示）は、いずれも仕様と実装の突き合わせとして妥当で、期待値も仕様書側に寄せてある。実装に合わせて期待値を書き換えた形跡は見当たらなかった。

---

## レビュー総括

### 指摘件数

| 重要度 | 件数 | 指摘番号 |
|---|---:|---|
| 高 | 4 | 1, 2, 3, 4 |
| 中 | 6 | 5, 6, 7, 8, 9, 10 |
| 低 | 5 | 11, 12, 13, 14, 15 |
| **合計** | **15** | |

### 全体の所見

496テスト・約3,800ステップの内容は、規模のわりに質が高い。特に fixture行IDの参照整合、i18n文言との一致、境界値の対、Free/Proの対、`UNREACHABLE` の根拠付けは、抜き取りではなく全件の機械チェックをかけても破綻が出なかった。F-18（プラン上限再計算）と F-02（定型文CRUD）の条件分解は、仕様書の記述を条件軸へ落とす作業として模範的である。

一方で、次の2つは構造的な弱点として残っている。

1. **網羅率100%が何も保証していない。** `coverage.mjs` は `UNREACHABLE` を母数から外し、`validate.mjs` は「REACHABLEなのにTestIDが無い」をエラーにする。この2つが組み合わさると、**REACHABLE と書いた行にテストを割り当てた瞬間に必ず100%になる**。実際に F-14 は58パターン中50件を `UNREACHABLE` にし、残る8件が「画面に行が表示される」だけのテストで、それでも100%と出る。数字を根拠にリリース判断をしてはいけない。

2. **「順序」と「エラー表示」という2種類の観点が体系的に弱い。** 指摘2（表示順をSQLの `ORDER BY` で自己充足的に検証）と指摘3（§10.4の33件中、到達可能な1件がパターンごと欠落）は、どちらも単発のミスではなく、期待値を書くときの型が定まっていないことに起因する。とくに指摘2は、直近コミットで追加された「標準を先頭に表示する」挙動をテストが素通りするため、実害が出やすい。

### 実行してよいか

**条件付きで実行してよい。** ただし、実行前に次の2点を必ず済ませること。

- **指摘5**（未検証Signature 13画面の一致件数確認）… これをやらずに流すと、初回の結果表が AUTOMATION_ERROR で埋まり、本物の不具合が埋もれる。所要は数分で、費用対効果が最も高い。
- **指摘6**（TC-2014 の扱いを決める）… 現状のまま流すと必ず BLOCKED が1件出る。許可するか取り下げるかを先に決める。

指摘2・3・7・8（期待値と観点の欠落）は、**初回実行と並行して修正し、2回目の実行で取り込む**のが現実的である。これらは既存テストを壊さない追加・置換であり、初回実行を止める理由にはならない。

指摘1・4（F-13 / F-14 の手動受け皿）は自動実行とは別の作業だが、**リリース判定より前に必ず片付けること**。現状の成果物は「インポートとエクスポートは誰も検証していない」という事実を、100%という数字で覆い隠している。実行レポートを出すときは、網羅率と併記して「`UNREACHABLE` 167件（うちデータ入出力の実処理59件）は自動・手動のいずれでも未検証」と明記しておくのが誠実である。
