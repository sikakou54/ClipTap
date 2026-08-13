# G2 原因分類（retry3 のFAIL 15件）

対象は「検証ステップで落ちたもの」。
`1. TEST_SPEC_ERROR → 2. PRECONDITION_ERROR → 3. AUTOMATION_ERROR → 4. ENVIRONMENT_ERROR
→ 5. SPEC_IMPLEMENTATION_MISMATCH → 6. APPLICATION_DEFECT` の順で上から潰した。

判断はすべて `docs/test/results/retry3/evidence/` の証跡とソースコードだけで行い、
シミュレータは操作していない。

## 分類結果

| TestID | 失敗ステップ | 原因分類 | 根拠（仕様の節・コードの位置） | 対応 |
|---|---|---|---|---|
| TC-0011 | 13 ASSERT_DB | AUTOMATION_ERROR | 本文が `1行目\n\n2行目` になっていた。アプリ側は `apps/mobile/src/hooks/screens/useTextInputScreen.ts:119-121` の `handleTextChange` が `setText(newText)` するだけで一切加工しない。同じ「貼付→return→貼付」の並びを持つTC-0331（別画面 `SC-VARIABLE-PROFILE-VALUE-EDIT`）も full-20260813 で同一の `1行目//2行目` を出しており、画面固有ではなく入力手段の問題。TC-0343 で「語の直後への⌘V」がiOSのスマート挿入で空白を1つ増やすことも実測済み | 修正済（testspec-A.csv）。step 8〜10 を `PASTE_RAW` 1回（`1行目${NL}2行目`）へ統合し13→11ステップ。空欄への貼り付けはスマート挿入が働かない（TC-0012 step10 が実証） |
| TC-0012 | 13 ASSERT_DB | TEST_SPEC_ERROR | 期待値 `前半後半` に仕様の裏付けがない。§8.2「タイトル｜画面上は必須、**改行不可**、30文字まで」が定めるのは改行が入らないことだけ。実装は `apps/mobile/src/components/snippet/TextInputScreen.tsx:117` の `multiline={type === 'content'}` によりタイトルが単一行で、returnで `onSubmitEditing`→blur が起きるため後続の貼付が入らない（実際値 `前半`）。これは仕様に反していない | 修正済（testspec-A.csv）。step 13 を §8.2 に忠実な `select count(*) ... and title not like '%'||char(10)||'%'` = `1` へ変更 |
| TC-0114 | 16 ASSERT_DB | AUTOMATION_ERROR | 保存色 `#3B00F6` は R=59(未変更)・G=0・B=246(未変更)。プリセット既定 `#3B82F6` のR/Bがそのまま残り、Rには `0` が先頭挿入されて `059`(=59) になっていた。`apps/mobile/app/category/edit.tsx:230,259,288` は `maxLength={3}`、`useCategoryEditScreen.ts:254-267` の `handleRGBChange` は数字以外を落とすだけで値を書き戻さない＝アプリ側に欠陥なし。文字キーボード→数字キーパッドへ切り替わる間に最初の `CLEAR_TEXT` のデリートが届いていない | 修正済（testspec-A.csv）。step 8 の直後に「R欄をTAP」「WAIT 800」を挿入し16→18ステップ |
| TC-0115 | 16 ASSERT_DB | AUTOMATION_ERROR | 同上。失敗時AXツリーが `R=259 / G=255 / B=246`、`保存` は `disabled`。**アプリは255超を正しく拒否している**（`isValidRGB` / `canSave`）ので、DBに行が無いのは正しい挙動。同じ症状はTC-0111（R=259）・TC-0116（R=159）でも起きており、常に「Rだけ消えず先頭に1文字挿入」 | 修正済（testspec-A.csv）。TC-0114と同じ2ステップを挿入 |
| TC-0239 | 6 ASSERT_DB | TEST_SPEC_ERROR | 期待値 `5` が仕様と矛盾。§6.2 / §8.18「Freeの上限は、有効なプロファイル3件」。`ProfileMapper.updateValidFlags`（`ProfileMapper.ts:400-407`）が `RESET_VALID`→`SET_VALID_BY_LIMIT(isDefault DESC, sortOrder ASC LIMIT 3)` を流し、これが `apps/mobile/src/hooks/screens/useAppInitialization.ts:76-79` から**起動のたびに**呼ばれる。fixtureが5件 `valid=1` でも起動後は必ず3件（pf_std/pf_p1/pf_p2）。失敗時AXツリーもP3・P4だけに `無効` バッジが出ており実装は §13.2 の判定順どおり | 修正済（testspec-A.csv）。step 6 の期待値を `3` にし、`InitialState` を実態（起動時再計算後）へ合わせた |
| TC-0343 | 8 ASSERT_DB | AUTOMATION_ERROR | 失敗時AXツリーの変数名欄が `client_name 2`（13/30、**空白入り**）、`保存` は `disabled`、`変数名は英数字とアンダースコアのみ使用可能です` を表示。§8.5「英字または `_` で始まり、以降は英数字または `_`」に照らしアプリの拒否が正しい。空白はiOSのスマート挿入（語の直後への⌘Vで前に空白を1つ入れる）が原因で、`sim.sh paste` は `print -rn` でクリップボードへ入れるだけなので自動化側の付加ではない | 修正済（testspec-A.csv）。step 6 を `CLEAR_TEXT`(30)＋`PASTE_RAW client_name2` の2ステップへ分割し10→11ステップ |
| TC-2008 | 2 ASSERT_ORDER | AUTOMATION_ERROR | 実際値の先頭が `Fitness`、一致件数11。失敗時AXツリーは **iOSのホーム画面（Springboard）**（Fitness / Watch / 連絡先 / Expo Go / ClipTap …）。直前の `ASSERT_PREF` が `run.mjs:467` で `state.sh pref get` を呼び、retry3 時点の `state.sh` は `pref` ケース先頭で `stop_app`（＝アプリ終了）を実行していたため。アプリの並べ替えは無関係（`state.sh` は本作業中に基盤側で修正済み。下記「申し送り1」参照） | 修正済（testspec-C.csv）。`ASSERT_PREF` を最終ステップへ移動（step 1↔2 入替） |
| TC-2300 | 3 ASSERT_ORDER | AUTOMATION_ERROR | 同上（step 2 の `ASSERT_PREF` がアプリを終了させ、step 3 はSpringboardを見ていた） | 修正済（testspec-C.csv）。step 2↔3 入替 |
| TC-2301 | 3 ASSERT_ORDER | AUTOMATION_ERROR | 同上 | 修正済（testspec-C.csv）。step 2↔3 入替 |
| TC-2302 | 3 ASSERT_ORDER | AUTOMATION_ERROR | 同上 | 修正済（testspec-C.csv）。step 2↔3 入替 |
| TC-2303 | 3 ASSERT_ORDER | AUTOMATION_ERROR | 同上 | 修正済（testspec-C.csv）。step 2↔3 入替 |
| TC-2313 | 6 ASSERT_ORDER | AUTOMATION_ERROR | **押したのは「使用頻度」ではなく「更新日時」**。step 3 の証跡PNG（1206×2622）を実測すると、メニューカードは px_y 854〜1769、区切り線が 1208 / 1379 / 1553。AX座標は `AX_y = px_y × 0.29405 + 107.5`（AXGroup 354×771 が画面全体）なので、使用頻度の行中心は AX 588、更新日時の行中心は AX 488。ログのタップ座標は `1477,493` ＝更新日時の行。原因は `SortMenu.tsx:88` のカードが `Pressable`（accessible）で、子のラベルが合成されカード1要素になること。`label~=使用頻度` はカード全体に一致し、その中心が押されていた（FINDINGS 3 と同じ構造）。結果の並びも `要約プロンプト / （タイトルなし）/ 今日の積み上げ / あいさつ` ＝ **updatedAt DESC と完全一致**で、`SnippetMapper.getSorted` の `usage` は `ORDER BY copyCount DESC, createdAt DESC`（§8.9どおり）と実装済み | 修正済（testspec-C.csv）。step 4 を `TAP_IN` `label~=使用頻度` `0.5,0.85` へ変更（カード内での4行目の相対位置は 0.76〜0.95） |
| TC-2322 | 7 ASSERT_ORDER | **SPEC_IMPLEMENTATION_MISMATCH** | 下記「不具合票 BUG-G2-01」参照 | **修正しない**（不具合の証拠として残す） |
| TC-3205 | 3 ASSERT_DB | AUTOMATION_ERROR | 期待値7は正しい（`schema.ts:10` `SCHEMA_VERSION = 7`）が、参照先のDBが違う。`migrations.ts:710` の `setSchemaVersionToDb(systemDB, SCHEMA_VERSION)` のとおり `user_version` は **systemDB** に保存される。`state.sh sql` は `require_db`＝App Groupの**共有DB**しか開かない（`state.sh schema` だけが systemDB を見る）。共有DBの `user_version` は 0 のままで正常 | 修正済（testspec-D1.csv）。step 3 を共有DB側でV7を裏付ける `select count(*) from sqlite_master where ... name='system_variable_formats'` = `1` へ変更（V7の追加内容は `migrations.ts:565-575`） |
| TC-3403 | 6 ASSERT_TEXT_CONTAINS | AUTOMATION_ERROR | 失敗時AXツリーに `変数8, 無効, {{var_eight}}` の行は存在するが `offscreen`（AX y=931、画面下端は878.5）。`ASSERT_TEXT_CONTAINS` は `visible=true` を付けるため一致しなかっただけで、**無効バッジ自体は仕様どおり付いている**（§8.18 / §9.4） | 修正済（testspec-D1.csv）。step 6 の前に `SCROLL_TO label~=var_eight` を挿入し7→8ステップ |

## 件数

| 分類 | 件数 |
|---|---|
| TEST_SPEC_ERROR | 2 |
| PRECONDITION_ERROR | 0 |
| AUTOMATION_ERROR | 12 |
| ENVIRONMENT_ERROR | 0 |
| SPEC_IMPLEMENTATION_MISMATCH | 1 |
| APPLICATION_DEFECT | 0 |
| 合計 | 15 |

---

## 不具合票（台帳登録用）

### BUG-G2-01 検索結果が並べ替え設定を無視し、作成日時の昇順で固定される

| 項目 | 内容 |
|---|---|
| 検出テスト | TC-2322 / P-F09-026（retry3 step 7） |
| 対象機能 | F-07 検索 / F-09 並べ替え |
| 対象画面 | SC-SEARCH（モバイル）。共通ロジックのためWeb・キーボードも同条件 |
| 分類 | SPEC_IMPLEMENTATION_MISMATCH |
| 重要度案 | **中**（データ破壊はないが、同じ画面で入力した瞬間に並びが逆転し、利用者の設定が無視される。§8.9 の事後条件に真っ向から反する） |
| 再現性 | Always（retry3・full-20260813 とも同一） |

**再現手順**

1. fixture `baseline` を適用し、`sort=created`（既定：作成日時の新しい順）・plan=free・locale=ja で起動する
2. ホームの一覧が「要約プロンプト / 今日の積み上げ / あいさつ」（作成日時の新しい順）で並ぶことを確認する
3. ホームヘッダの検索アイコンを押す
4. 検索欄に `。` を入力し、デバウンス（300ms）満了まで待つ

**期待結果**

機能仕様書 §8.9 事後条件「**選択した順序で一覧が並ぶ**」および §8.9 機能詳細「作成日時｜新しい順」に従い、
検索結果も作成日時の新しい順（`（タイトルなし）`→`要約プロンプト`→`あいさつ`）で並ぶこと。

**実際結果**

作成日時の**昇順**で並ぶ（`あいさつ`(2026-02-01) → `要約プロンプト`(2026-02-04) → `（タイトルなし）`(2026-02-05)）。
証跡: `docs/test/results/retry3/evidence/TC-2322-7-FAIL.txt` のAXツリー（上から あいさつ@289 / 要約プロンプト@485 / （タイトルなし）@680）。
並べ替え設定（`@snippet_sort_preference`）を4種のどれにしても検索結果の並びは変わらない。

**仕様根拠**

- 機能仕様書 §8.9 事後条件: 「選択した順序で一覧が並ぶ。」
- 機能仕様書 §8.9 機能詳細: 「作成日時｜新しい順｜同値時 タイトル順」

**原因箇所**

- `packages/shared/src/mappers/snippetMapper.ts:64` `SEARCH: 'SELECT * FROM snippets WHERE title LIKE ? OR content LIKE ? ORDER BY createdAt ASC'`
- `packages/shared/src/mappers/snippetMapper.ts:66` `SEARCH_WITH_CATEGORY` も同じく `ORDER BY createdAt ASC`
- 呼び出し経路: `useSearch.ts:87` → `SnippetService.ts:116` → `SnippetMapper.search()`。この経路には `getSorted()` / `buildOrderClause` 相当の分岐が一切なく、並べ替え設定を受け取る引数も無い
- 対比: 一覧側の `SnippetMapper.getSorted()`（同ファイル `:363-388`）は4種すべてを §8.9 どおりに実装している

**補足（統括への申し送り）**

- 既定の作成日時順が「新しい順」であるのに対し検索は `ASC` のため、**既定設定のままでも一覧と検索で並びが逆転する**。設定変更の有無に関わらず再現する。
- TC-2322 の `ASSERT_ORDER` ロケータ `role=AXButton&has=label` は検索画面では機能していない（検索結果行のタイトルは `AXGenericElement`、`AXButton` はコピーアイコン `` の2件だけに付く。ホーム画面では逆にタイトルが `AXButton` になる）。ただし**ロケータを直しても並び順の不一致は解消しない**（AXツリーの表示順が上記のとおり昇順のため）。期待値を書き換えると不具合の証拠が消えるので、**この1件はステップを一切変更していない**。ロケータの是正は不具合修正の確認と同時に行うのが安全。

---

## 修正した部分ファイル

| ファイル | 変更したTestID |
|---|---|
| `docs/test/parts/testspec-A.csv` | TC-0011 / TC-0012 / TC-0114 / TC-0115 / TC-0239 / TC-0343 |
| `docs/test/parts/testspec-C.csv` | TC-2008 / TC-2300 / TC-2301 / TC-2302 / TC-2303 / TC-2313 |
| `docs/test/parts/testspec-D1.csv` | TC-3205 / TC-3403 |

`node .claude/skills/full-test/scripts/merge-parts.mjs` → `node .claude/skills/full-test/scripts/validate.mjs`
は警告0件・エラー0件で通過することを確認済み（テスト503件 / ステップ3871件）。

---

## 自動化基盤への申し送り（今回のFAILで判明。テスト仕様側では直せないもの）

1. **`ASSERT_PREF` がアプリを終了させていた（本作業中に基盤側で修正済み）。**
   retry3 実行時点では `run.mjs:467` → `state.sh pref get` → `state.sh` の `pref` ケース冒頭 `stop_app`
   となっており、**検証アクションが画面状態を壊していた**。
   現在の `state.sh` は `pref` の `set|del|clear` のときだけ `stop_app` する形へ直っている。
   本作業のテスト仕様修正（該当5件の `ASSERT_PREF` を最終ステップへ移動）は、
   基盤修正と重複するが順序非依存で害はないため、防御としてそのまま残した。
   - **残る注意**: `stop_app` はAsyncStorageのディスク書き出しを待つ役目も兼ねていた。
     **アプリがテスト中に書いた**永続設定を読むケース（TC-2313 step 7 の `usage` など）では、
     フラッシュ前の古い値を読む可能性がある。`prefs.mjs` 側で短いリトライを入れるか、
     `ASSERT_PREF` の直前に `WAIT` を置くのが安全。
   - `ASSERT_PREF` を手順の途中で使っているテストの棚卸しには
     `grep ',ASSERT_PREF,' docs/test/testspec.csv` が使える。

2. **モーダル・一覧行の合成ラベル問題は「タップ位置」にも及ぶ（FINDINGS 3 の拡張）。**
   `SortMenu` のカード（`Pressable`）が accessible なため、`label~=<行の文言>` が
   カード全体に一致し、**中心＝別の行**を押してしまう。到達不能になるだけでなく
   「押せているのに違うものを押している」ため、失敗が期待値のずれに見える点が特に危険。
   `TAP_IN` の相対位置で回避したが、行が増減すると比率がずれる。
   カードを `accessible={false}` にすれば13パターン（FINDINGS 3）と併せて根治する。

3. **⌘V（`sim.sh paste`）はiOSのスマート挿入で前後に文字を足す。**
   - 語の直後 → 半角空白が1つ入る（TC-0343 実測: `client_name` + `2` → `client_name 2`）
   - 改行の直後 → 改行がもう1つ入るとみられる（TC-0011 / TC-0331 で `1行目\n\n2行目`）
   - **空欄への貼り付けでは起きない**（TC-0012 step10 が実証）
   以降のテスト設計では「既存文字列の途中・末尾へ追記する」形を避け、
   `CLEAR_TEXT` してから完成形を1回で貼るか、`${NL}` を含めて1回で貼ること。
   なお改行が増える機序そのものは**要実測**（本作業ではシミュレータを操作していない）。
   修正後のTC-0011がPASSすれば自動化側で確定、なおFAILするならアプリ側として再起票が必要。

4. **キーボード種別が変わる入力欄は、最初の `CLEAR_TEXT` が効かない。**
   文字キーボード→数字キーパッドの切替中はデリートが落ちる。
   カスタムRGBの4件（TC-0111 / TC-0114 / TC-0115 / TC-0116）すべてで
   「R欄だけ消えず、先頭に1文字だけ挿入される」という同一症状。
   TC-0114 / TC-0115 は本作業で「先にTAP＋WAIT」を入れて修正したが、
   **TC-0111 / TC-0112 / TC-0116 は他担当の範囲のため未着手**。同じ修正が要る。

5. **`state.sh sql` は共有DBしか開かない。**
   systemDB（`Documents/SQLite/cliptap.db`）にある `user_version` は `ASSERT_DB` で検証できない。
   スキーマ版を直接検証したいなら `state.sh` に systemDB 用の読み取りコマンドを足すのが早い。
