# TRIAGE-G1（操作ステップで落ちた24件）

対象run: `docs/test/results/retry3`
判定は証跡（AXツリー・スクリーンショット）とソースコードのみで行い、シミュレータは操作していない。

## 判定表

| TestID | 失敗ステップ | 原因分類 | 根拠 | 対応 |
|---|---|---|---|---|
| TC-0016 | 12 TAP | AUTOMATION_ERROR | 証跡のカテゴリ選択画面では未分類行が `未分類, ` の複合ラベル1要素。`label=未分類` の完全一致は0件 | ロケータを `label~=未分類` へ変更 |
| TC-0019 | 13 TAP | AUTOMATION_ERROR | プロファイル選択画面の行は `, A社用` の複合ラベル。完全一致が成立しない | `label~=A社用` へ変更 |
| TC-0021 | 12 TAP | AUTOMATION_ERROR | 同上（証跡は TC-0019 と同一構造） | step12 を `label~=A社用`、step13 を `label~=B社用` へ変更 |
| TC-0022 | 12 TAP | AUTOMATION_ERROR | 同上 | `label~=A社用` へ変更 |
| TC-0119 | 16 TAP | AUTOMATION_ERROR | 証跡はカテゴリ作成画面のままで `保存` が disabled、R入力欄が `259`。RGB入力は `textAlign:'center'` + `maxLength={3}`（`apps/mobile/app/category/edit.tsx:230,259,288,409`）のため、`CLEAR_TEXT` の中央タップでキャレットが文字列の中央に入り後半文字が消えない。残った文字のぶんだけ `PASTE_RAW` が maxLength で切り詰められ `59`→`259` になる。`canSave = categoryName.trim() !== '' && isCustomColorValid`（`useCategoryEditScreen.ts:147`）なので保存が押せず、step16 の遷移先に到達しない | step9〜14 を `TAP_IN(0.85,0.5)` で末尾へキャレット→`PRESS_KEY delete` ×3→`PASTE_RAW` の並びへ置換（step9〜23）。以降を繰り下げ |
| TC-0229 | 2 TAP | AUTOMATION_ERROR | 切替シートはモーダルで背景がAXツリーから外れ、`label~=Main` の一致は1件のみ。順序指定 `[1]` が範囲外 | `label~=Main[0]` へ変更 |
| TC-0331 | 3 TAP | ENVIRONMENT_ERROR | 「デバイス画面(iOSContentGroup)を特定できません」でAXツリーが取得できず、当該ステップだけで約12分（05:40:15→05:52:08）消費。retry2 では step1 で同種の空ツリー、full run では step14 まで到達しており、run ごとに落ちる位置が違う。同症状は他runの別テスト（TC-3380 / TC-4601 / TC-5008）にも散発 | 修正なし。再実行が必要（結果は未確定のまま残す） |
| TC-2210 | 2 TAP | AUTOMATION_ERROR | `fixture=many` のカテゴリ名は `カテゴリ01`〜`カテゴリ10` で正しい。証跡では `カテゴリ05` チップが x=1797（画面は x=1300〜1654）で `offscreen`。チップ列は横スクロールだが `SCROLL_TO` は縦方向にしかスクロールしない | チップ列を左へ送る `DRAG label=カテゴリ03 → label=すべて` を挿入。TAP は行内の `AXStaticText` と衝突しないよう `role=AXGenericElement&label=カテゴリ05` へ変更 |
| TC-2211 | 1 TAP | AUTOMATION_ERROR | 同上 | 同上（DRAG を step1 に挿入） |
| TC-3061 | 4 TYPE | AUTOMATION_ERROR | 証跡ではモーダル全体が `パスワードを設定, 同一ファイル確認に…, パスワード, キャンセル, OK` という1要素に畳まれている。`select-export-data.tsx:240` でモーダルのオーバーレイ `View` を `TouchableWithoutFeedback` が包んでおり、RNがそのViewへ `accessible=true` を付けるため子要素がAXツリーに出ない。個別ラベルは元から存在しない | 入力欄は `autoFocus` 済みなので `PASTE_RAW`（対象指定なし）へ変更。キャンセルは `TAP_IN label~=パスワードを設定 "0.30,0.58"` へ変更。step6 の `ASSERT_NOT_VISIBLE label=パスワードを設定` は複合ラベルのため元から必ず成立してしまうので `label~=` へ修正 |
| TC-3070 | 4 TAP | AUTOMATION_ERROR | 同上（`label=OK` は畳み込みのため0件） | `TAP_IN label~=パスワードを設定 "0.70,0.58"` へ変更 |
| TC-3071 | 4 TYPE | AUTOMATION_ERROR | 同上 | step4 を `PASTE_RAW`、step5 を `TAP_IN "0.70,0.58"` へ変更 |
| TC-3102 | 4 TYPE | AUTOMATION_ERROR | 同上 | step4 を `PASTE_RAW`、step5 を `TAP_IN "0.30,0.58"` へ変更 |
| TC-3304 | 7 TYPE | AUTOMATION_ERROR | 証跡では変数名欄が `[AXTextField] value="例: myname"`。プレースホルダは label ではなく value に出るため `label~=` では見つからない | `value~=例: myname` へ変更 |
| TC-4005 | 2 TAP | AUTOMATION_ERROR | 証跡はSpringBoard（アプリが前面にいない）。step1 の `ASSERT_PREF` は `state.sh pref get` を呼び、`state.sh:183-186` の `pref)` が無条件に `stop_app`（`xcrun simctl terminate`）するためアプリが終了する。full / retry1 / retry2 / retry3 の4回すべてで同一 | `ASSERT_PREF` を最終ステップへ移動（step1→step5） |
| TC-4101 | 2 TAP | AUTOMATION_ERROR | 同上 | `ASSERT_PREF` を最終ステップへ移動（step1→step5） |
| TC-4102 | 4 WAIT_FOR | AUTOMATION_ERROR | 証跡ではPaywallは表示済みで、`購入を復元` が y=885（画面下端は879）で `offscreen`。`WAIT_FOR` は `visible=true` を自動付与するため永久に成立しない | 読み込み完了の目印を画面内の見出し `label=Proプランの特典` へ変更。加えて step9 に `SCROLL_TO label~=購入を復元` を挿入（`ASSERT_ENABLED` も `visible=true` を要求するため） |
| TC-4108 | 3 WAIT_FOR | AUTOMATION_ERROR | 同上 | `WAIT_FOR label=Proプランの特典` へ変更 |
| TC-4109 | 3 WAIT_FOR | AUTOMATION_ERROR | 同上 | `WAIT_FOR label=Proプランの特典` へ変更 |
| TC-4110 | 3 WAIT_FOR | AUTOMATION_ERROR | 同上 | `WAIT_FOR label=Proプランの特典` へ変更 |
| TC-4111 | 3 WAIT_FOR | AUTOMATION_ERROR | 同上 | `WAIT_FOR label=Proプランの特典` へ変更。`利用規約`／`プライバシーポリシー` も offscreen なので step8 に `SCROLL_TO label~=利用規約` を挿入 |
| TC-4112 | 3 WAIT_FOR | AUTOMATION_ERROR | 同上 | `WAIT_FOR label=Proプランの特典` へ変更。step9 の `ASSERT_VISIBLE label~=購入を復元` も offscreen で成立しないため `label=Proプランの特典` へ変更 |
| TC-4113 | 4 WAIT_FOR | AUTOMATION_ERROR | 同上 | `WAIT_FOR label=Proプランの特典` へ変更。step6 の `ASSERT_COUNT label~=購入を復元` も `visible=true` が付くため `label=Proプランの特典` を数える形へ変更 |
| TC-4114 | 4 WAIT_FOR | AUTOMATION_ERROR | 同上（英語UI。`Restore Purchase` が offscreen） | `WAIT_FOR label=Pro Features` へ変更。step7 に `SCROLL_TO label~=Terms of Use` を挿入 |

## 件数

| 分類 | 件数 |
|---|---|
| TEST_SPEC_ERROR | 0 |
| PRECONDITION_ERROR | 0 |
| AUTOMATION_ERROR | 23 |
| ENVIRONMENT_ERROR | 1 |
| SPEC_IMPLEMENTATION_MISMATCH | 0 |
| APPLICATION_DEFECT | 0 |

修正したTestID（23件）:
TC-0016 / TC-0019 / TC-0021 / TC-0022 / TC-0119 / TC-0229 / TC-2210 / TC-2211 /
TC-3061 / TC-3070 / TC-3071 / TC-3102 / TC-3304 / TC-4005 / TC-4101 / TC-4102 /
TC-4108 / TC-4109 / TC-4110 / TC-4111 / TC-4112 / TC-4113 / TC-4114

未修正: TC-0331（ENVIRONMENT_ERROR。再実行が必要）

## 次のrunで残る見込みの問題（このグループでは直していない）

1. **TC-4111 / TC-4112 の前提条件が「Offering取得不可」を作れていない（PRECONDITION_ERROR）**
   TC-4111 step3 の証跡AXツリーに `年間プラン, 年間で¥3,000, $19.99/年` と `月額プラン, $1.99/月` が出ており、
   Offeringは取得できている。TC-4111 step5/6（`/年`・`/月` が画面内に無いこと）と
   TC-4112 step7（汎用エラー）は、WAIT_FOR を直しても成立しない。
   `network=off`（`config.env` の `ALLOW_NETWORK_TOGGLE=1` なので指定自体は可能）で作れるかは
   RevenueCatのOfferingキャッシュ次第で、**要実測**。作れないならパターンを `manual-only` へ回す判断が要る。

2. **TC-0331 step14（full run）の値が `1行目//2行目`**
   改行が2つ入っている。retry3 では環境要因で step3 までしか進まなかったため未確認。
   `PASTE_RAW` は `print -rn` で末尾改行を付けないため、`PRESS_KEY return` かアプリ側の複数行入力の
   どちらが原因かは切り分けが必要。検証ステップ側の担当で扱う。

## 他グループへ影響する共通原因

1. **`ASSERT_PREF` がアプリを終了させる**
   `state.sh` の `pref)` が `get` でも `stop_app` する。`ASSERT_PREF` を途中に置いたテストは
   以降のUI操作がすべてSpringBoardに当たる。本グループの TC-4005 / TC-4101 のほか、
   **TC-2008 / TC-2009 / TC-2300〜TC-2303 / TC-4301** も同じ証跡（SpringBoardのAXツリー）で落ちている。
   根本的には `state.sh pref get` を `stop_app` なしにするのが正しい。CSV側で最終ステップへ移す対処は
   スクリプトを直した場合も無害。

2. **RGB入力欄の CLEAR_TEXT が効かない**
   `textAlign:'center'` + `maxLength={3}` の組み合わせによるもので、
   **TC-0111 / TC-0114 / TC-0115 / TC-0116 / TC-0129** も同じ原因で値が壊れている
   （TC-0114 は `#3B00F6`、TC-0115 は空、TC-0116 は R=159 が残存）。
   TC-0119 と同じ `TAP_IN` + `PRESS_KEY delete` の並びに揃えるのが望ましい。

3. **パスワードモーダルのアクセシビリティ**
   `apps/mobile/app/settings/select-export-data.tsx:240` の `TouchableWithoutFeedback` が
   オーバーレイ全体を1つのアクセシビリティ要素に畳んでいる。
   自動テストからは相対座標でしか触れず、VoiceOverでも個別の操作ができない。
   アプリ側の課題として別途記録する価値がある（本タスクでは実装を変更していない）。
