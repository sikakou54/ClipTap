# TRIAGE-G3 — 画面判定・表示確認で落ちた22件の原因確定

対象実行: `docs/test/results/retry3`（iPhone 17 / iOS-26-5）
判断材料: `results.csv` / `evidence/*.txt` / `evidence/*.png` / ソースコード / `docs/機能仕様書.md`
シミュレータは操作していない。実測が必要なものは「要実測」と明記した。

---

## 1. 原因分類

| TestID | 失敗ステップ | 原因分類 | 根拠 | 対応 |
|---|---|---|---|---|
| TC-0013 | 13 ASSERT_SCREEN_HAS | AUTOMATION_ERROR | `ui texts` は出力時に `esc()` を通し `"` を `\"` へ変換する（`ui.swift` の `esc()`／`case "texts"`）。証跡の表示中テキストも `記号<>&\"` になっている。期待値 `記号<>&"` は原理的に一致しない。実装は記号をそのまま保存・表示できており、同テストのStep12 ASSERT_DB はPASS | Input を `記号<>&\"` へ変更（`testspec-A.csv`） |
| TC-0111 | 15 ASSERT_SCREEN_HAS | AUTOMATION_ERROR | R=259 G=128 B=246、プレビューは初期色 #3B82F6 のまま。R欄は初期値59に貼付文字が先頭へ1文字だけ入った形（`059`/`159`/`259` が4テストで再現）、B欄は3桁で埋まっており貼付が入らない。つまり `CLEAR_TEXT`（タップ＋Delete送出）がR/B欄を空にできず、`PASTE_RAW` がキャレット位置へ追記されている。`rgbInput` は `textAlign:'center'` かつ `maxLength=3`。アプリ側は範囲外値でプレビューを既定色へ戻し保存を無効化しており、実装は一貫している | R/G/Bの入力を「TAP → WAIT → DOUBLE_TAP（既存値を選択）→ PASTE_RAW（選択を置換）」へ作り直し（`testspec-A.csv`）。**要実測**（選択置換で入るかは再実行で確認） |
| TC-0112 | 10 ASSERT_DISABLED | AUTOMATION_ERROR | 証跡のR欄は `59` のまま（空になっていない）ため保存が有効。TC-0111と同一原因 | 「TAP → WAIT → DOUBLE_TAP → PRESS_KEY delete」で空にする手順へ変更（`testspec-A.csv`）。**要実測** |
| TC-0116 | 15 ASSERT_SCREEN_HAS | AUTOMATION_ERROR | R=159（`1`＋初期値59）、B=246のまま。TC-0111と同一原因。なお英字除去自体は機能しており、`handleRGBChange` の `replace(/[^0-9]/g,'')` どおり | TC-0111と同じ手順へ変更（`testspec-A.csv`）。**要実測** |
| TC-0127 | 10 ASSERT_SCREEN_HAS | AUTOMATION_ERROR | 一覧行のラベルは `記号<>&\", \uF5F6`。TC-0013と同一原因 | Input を `記号<>&\"` へ変更（`testspec-A.csv`） |
| TC-0306 | 11 ASSERT_SCREEN | TEST_SPEC_ERROR | Signatureの問題ではない。証跡には「エラー／変数名を入力してください／OK」のダイアログが写っており、値編集画面が開いていない。`useVariableEditScreen.handleOpenValueEdit` は `name.trim()` が空なら `VariableNameRequiredError` を投げる。つまり「名前が空白だけのまま値を入力する」手順は実UIでは到達不能。機能仕様書§8.5にこのガードの記述は無く、期待値は推測で書かれていた | 手順を実UIへ合わせて書き直し（値セル押下→エラー表示→OK→保存が操作不能→DB不変）。TestPurposeも実態に合わせて修正（`testspec-A.csv`） |
| TC-2009 | 2 ASSERT_SCREEN_HAS | AUTOMATION_ERROR | 証跡はiOSホーム画面（Fitness/Watch/…）。直前のTC-1116が `locale=en`、TC-2008以降が `locale=ja` で、`sim.sh locale` の `defaults write -g AppleLanguages` がSpringBoardを再起動しPreconditionで起動したアプリを落としている。TC-2008も同症状、約60秒後のTC-2115からは正常。前提条件の記述自体は正しく、待ちと再起動の扱いが自動化側に無い | 先頭に `WAIT 3000` + `RELAUNCH` を追加（`testspec-C.csv`）。**恒久対処は共通側**（下記5.参照） |
| TC-2014 | 1 ASSERT_SCREEN | ENVIRONMENT_ERROR | 証跡は開発ビルドのランチャー画面（`Development Build` / `Searching for development servers...` / `ClipTap、http://192.168.0.10:8081`）。`network=off` でホストWi-Fiを切るとLAN経由のMetroへ到達できず、開発ビルドはJSバンドルを読めない。全4回の実行で同一症状。アプリの不具合ではなく、オフライン検証には本番相当ビルドが要る | **修正しない。** 結果はBLOCKED相当のまま。再実行にはリリースビルド（またはlocalhost経由のMetro）が必要 |
| TC-2115 | 3 ASSERT_SCREEN | AUTOMATION_ERROR | 証跡は「インポート・エクスポート」画面。Step2の `role=AXGenericElement&has=label[3]` は順序指定で、fixtureによりプロファイルチップの要素数が変わるため入出力アイコン（`swap-horizontal-outline`）を押していた。ホームのアイコンは 設定`\uF56C` / 入出力`\uF5B1` / 検索`\uF563` / 追加`\uF105`（`app/index.tsx`）。`reference/icons.md` も順序指定を避けるよう明示している。SC-SEARCHのSignature（プレースホルダ）は今回の直接原因ではないが将来の落とし穴のため併せて修正 | Step2の Target を `label=\uF563` へ変更（`testspec-C.csv`）。screens.csvのSC-SEARCH Signatureも変更（表2） |
| TC-2116 | 3 ASSERT_SCREEN | AUTOMATION_ERROR | 同上 | 同上 |
| TC-2123 | 3 ASSERT_SCREEN | AUTOMATION_ERROR | 同上 | 同上 |
| TC-2128 | 3 ASSERT_SCREEN | AUTOMATION_ERROR | 同上 | 同上 |
| TC-2131 | 3 ASSERT_SCREEN | AUTOMATION_ERROR | 同上 | 同上 |
| TC-3034 | 4 ASSERT_VISIBLE | TEST_SPEC_ERROR | 証跡のタブは `定型文, (5)` のままで、「あいさつ」行のラベルだけ `\uF232`(chevron-down) が `\uF241`(chevron-up) に変わっている＝行本体タップは**展開/折りたたみ**。`SelectionSnippetItem.tsx` はチェックボックス側が `onToggleSelection`、本文側が `onToggleExpand`。機能仕様書§8.13に行タップの記述は無く、期待値は推測 | Step3を `TAP_NEAR`（アンカー `label~=進捗報告` / 対象 `label=\uF21A`＝checkbox）へ変更（`testspec-D1.csv`） |
| TC-3040 | 4 ASSERT_VISIBLE | TEST_SPEC_ERROR | 同上 | 同上。TestPurposeも「チェックボックスを押すと」に修正 |
| TC-3041 | 4 ASSERT_VISIBLE | TEST_SPEC_ERROR | 同上 | Step3を同様に変更。再選択のStep5は解除後グリフが `square-outline`＝`\uF593` になるため対象をそちらへ変更 |
| TC-3046 | 5 ASSERT_VISIBLE | TEST_SPEC_ERROR | 証跡のタブは `変数, (3)` のまま、client_name行が `\uF241` で展開済み。TC-3034と同一（`SelectionVariableItem.tsx` も同構造） | Step4を `TAP_NEAR`（アンカー `label~=変数` / 対象 `label=\uF21A`）へ変更 |
| TC-3060 | 4 ASSERT_VISIBLE | AUTOMATION_ERROR | パスワードモーダルはAX上1要素の複合ラベル `パスワードを設定, 同一ファイル確認に…, パスワード, キャンセル, OK`。`label=` の完全一致では特定できない（同テストのStep5 ASSERT_SCREEN_HAS は部分一致なので通る設計）。モーダルは表示できており実装は正しい | Step4/6/7 の Target を `label~=` の部分一致へ変更（`testspec-D1.csv`） |
| TC-3062 | 4 ASSERT_VISIBLE | AUTOMATION_ERROR | 同上（英語版 `Set Password, Set a password to verify…, Password, Cancel, OK`） | Step4の Target を `label~=Set Password` へ変更 |
| TC-3407 | 5 ASSERT_SCREEN_LACKS | TEST_SPEC_ERROR | 期待文字列「無効」が、fixture `over-limit` の変数値「**無効**側の値」に一致してしまう。Free時の行ラベルは `\uF4AC, 変数6, 無効, {{var_six}}, 無効側の値, \uF5F6`、Pro時は `\uF4AC, 変数6, {{var_six}}, 無効側の値, \uF5F6`（他runの証跡で確認）。バッジ自体は消えており実装は仕様どおり。期待値の書き方がフィクスチャのデータと衝突していた | Input を `, 無効,`（バッジだけに一致する区切り付き）へ変更、ExpectedResultも修正（`testspec-D1.csv`） |
| TC-4301 | 2 ASSERT_SCREEN | AUTOMATION_ERROR | 証跡はiOSホーム画面。直前のTC-4115が `locale=en`、本テストが `locale=ja`。TC-2009と同一原因（言語切替によるSpringBoard再起動）。次のTC-4401（ja→en）はPASSしており、切替直後の1〜2テストだけが落ちる | 先頭に `WAIT 3000` + `RELAUNCH` を追加（`testspec-D2.csv`）。**恒久対処は共通側**（下記5.参照） |
| TC-4601 | 8 ASSERT_VISIBLE | AUTOMATION_ERROR | スクリーンショットにはモーダルが正しく再表示され「「設定」アプリを開く」も見えているが、同時刻のAXダンプは `iOSContentGroup` の子要素が0件。1回目の表示（Step4）と英語版のTC-4604（`label=Open iPhone Settings app` の完全一致）はPASSしているため、ラベル自体の問題ではなくモーダル再表示時にAXツリーを読めていない。`ui waitfor` は起動時に取得した contentGroup を保持して再走査するため、遷移中に掴むと6秒間空のまま回り続ける | Step7の直後に `WAIT 1500` を挿入し、Step8を `label~=` に緩和（`testspec-D2.csv`）。**要実測**（待ちで解消しない場合は `ui.swift` の contentGroup 再取得が必要） |

### 分類ごとの件数

| 分類 | 件数 | TestID |
|---|---|---|
| TEST_SPEC_ERROR | 6 | TC-0306, TC-3034, TC-3040, TC-3041, TC-3046, TC-3407 |
| PRECONDITION_ERROR | 0 | — |
| AUTOMATION_ERROR | 15 | TC-0013, TC-0111, TC-0112, TC-0116, TC-0127, TC-2009, TC-2115, TC-2116, TC-2123, TC-2128, TC-2131, TC-3060, TC-3062, TC-4301, TC-4601 |
| ENVIRONMENT_ERROR | 1 | TC-2014 |
| SPEC_IMPLEMENTATION_MISMATCH | 0 | — |
| APPLICATION_DEFECT | 0 | — |
| 合計 | 22 | |

**不具合登録が必要なものは1件も無い。** アプリ側の誤りは検出されなかった。

---

## 2. 画面識別子（Signature）の変更

| ScreenID | 変更前 | 変更後 | 変更理由 |
|---|---|---|---|
| SC-SEARCH | `text~=定型文を検索` | `label=\uF55F` | 変更前は検索欄の**プレースホルダ**（`snippet.search_placeholder` = 「定型文を検索...」）。検索語を入力すると消えるため、入力後の `ASSERT_SCREEN` は必ず落ちる（実例: TC-0038 Step9 は Step6 の入力後に判定している）。変更後は `SearchBar` が常に描画する Ionicons `search`（U+F55F）で、入力値に左右されない |
| SC-VARIABLE-PROFILE-VALUE-EDIT | `text~=値を入力してください` | `label=完了 + -label=タイトルを入力 + -label=内容を入力` | 変更前は入力欄の**プレースホルダ**（`variables.enter_value_placeholder`）。既存値を編集するときは最初から消えているため判定できない。変更後はヘッダ右の「完了」（`common.done`）を基準にし、同じ「完了」を持つ2画面を除外条件で外す |

### 他画面と衝突しないことの確認

| 判定 | 確認方法 | 結果 |
|---|---|---|
| `label=\uF55F` が検索画面だけに現れる | `grep -rn 'name="search"' apps/mobile --include=*.tsx` | ヒットは `SearchBar.tsx`（アイコン）と `_layout.tsx`（`Stack.Screen name="search"`＝ルート名でアイコンではない）のみ。`SearchBar` の利用箇所は `app/search.tsx` の1つだけ。他の画面は `search-outline`(U+F563) を使っており別コードポイント |
| 素の `<Ionicons>` がAXに現れる | TC-2115証跡のインポート・エクスポート画面に `[AXStaticText] label="\uF399"`（`information-circle-outline`、View直下の素のIonicons）が出ている。`SearchBar` の検索アイコンも同じ構造 | 露出する |
| `label=完了` を持つ画面 | `grep -rn "common.done" apps packages --include=*.tsx --include=*.ts` | `variable/profile-value-edit.tsx` と `components/snippet/TextInputScreen.tsx` の2箇所のみ。後者は SC-SNIPPET-TITLE-INPUT（見出し「タイトルを入力」）と SC-SNIPPET-CONTENT-INPUT（見出し「内容を入力」）にしか使われず、両方を除外条件で外している |
| screens.csv 全26画面との重複 | 各行のSignatureを目視突き合わせ | 「完了」「\uF55F」を含むSignatureは他に無い。SC-SNIPPET-TITLE-INPUT / SC-SNIPPET-CONTENT-INPUT のSignatureは変更前後とも成立する（除外条件は相手画面のSignatureそのものを使っている） |
| ロケール依存 | 新Signatureの「完了」は日本語ラベル | 変更前（「値を入力してください」）も日本語で条件は同じ。`validate.mjs` が `locale=en` のテストでの `ASSERT_SCREEN` 使用を禁止しており、英語実行に影響しない |

`node .claude/skills/full-test/scripts/validate.mjs` は screens.csv 変更後も エラー0件 / 警告0件。

---

## 3. 修正したファイル

| ファイル | 変更内容 |
|---|---|
| `docs/test/screens.csv` | SC-SEARCH / SC-VARIABLE-PROFILE-VALUE-EDIT のSignature（表2） |
| `docs/test/parts/testspec-A.csv` | TC-0013(1行) / TC-0127(1行) の期待値、TC-0111・TC-0112・TC-0116 のRGB入力手順、TC-0306 の手順とTestPurpose |
| `docs/test/parts/testspec-C.csv` | TC-2009 に先頭2ステップ追加、TC-2115/2116/2123/2128/2131 の検索アイコン指定 |
| `docs/test/parts/testspec-D1.csv` | TC-3034/3040/3041/3046 のチェックボックス指定とTestPurpose、TC-3060/3062 のロケータ緩和、TC-3407 の期待文字列 |
| `docs/test/parts/testspec-D2.csv` | TC-4301 に先頭2ステップ追加、TC-4601 に待ちを挿入しロケータ緩和 |

修正しなかったもの: TC-2014（ENVIRONMENT_ERROR）。

---

## 4. 再実行で確認が必要なもの（要実測）

| TestID | 確認したいこと |
|---|---|
| TC-0111 / TC-0112 / TC-0116 | `DOUBLE_TAP` でRGB入力欄の既存値が選択され、`PASTE_RAW` / `PRESS_KEY delete` が置換・削除として効くか。効かない場合はキャレット位置に依存しない入力手段（`ui.swift` 側でのテキスト設定など）が必要 |
| TC-4601 | `WAIT 1500` でモーダル再表示時のAXツリーが読めるようになるか。読めない場合は `ui.swift` の contentGroup をポーリングのたびに取り直す修正が要る |
| TC-2014 | リリース相当ビルドでの再実行（現環境では実行不能） |

---

## 5. 共通側（スキル）へ申し送りたい点

いずれもG3の担当ファイルの外なので**変更していない**。統括で採否を判断してほしい。

1. **端末言語切替の直後にアプリが落ちる**（TC-2008 / TC-2009 / TC-4301 の真因）
   `sim.sh locale` は `defaults write -g AppleLanguages` を書くだけで、SpringBoardの再起動を待たない。`run.mjs` の `applyDirectives` は locale → relaunch の順に実行するが、再起動が後から来るとアプリが落ちる。
   対処案: 現在値と異なるときだけ書き込み、書き込んだ場合は SpringBoard の再起動完了を待ってから relaunch する。今回はテスト側に `WAIT`+`RELAUNCH` を足して回避したが、実行順が変わると別のテストが同じ症状になる。

2. **`ui texts` のエスケープと期待値の非対称**（TC-0013 / TC-0127 の真因）
   `texts` は `"` を `\"`、改行を `\n`、私用領域を `\uXXXX` にして出すが、`run.mjs` の `unesc()` は `\uXXXX` しか戻さない。結果、`"` や `\` を含む期待値は原理的に一致しない。
   対処案: 比較の直前に期待値へ同じ `esc()` 相当を適用する（そうすればCSV側にエスケープを書かなくてよくなる）。

3. **順序指定ロケータ `role=AXGenericElement&has=label[n]` が35ステップで使われている**
   ホームのプロファイルチップの要素数がfixtureで変わるため、`[3]` は fixture によって検索アイコンにも入出力アイコンにもなる（`baseline` 系はPASS、`boundary`/`many`/`over-limit` はFAIL）。G3担当の5件だけ `label=\uF563` へ直したが、残りも同じ危険を抱えている。`reference/icons.md` の方針どおりグリフ指定へ寄せるべき。

4. **モーダルの複合ラベル化**（TC-3060 / TC-3062）
   パスワード設定モーダルはAX上1要素にまとまるため、内部のボタンを個別にタップ・検証できない。`accessible` の付け方を見直すとテスト容易性が上がる（アプリ修正が要るのでここでは提案のみ）。
