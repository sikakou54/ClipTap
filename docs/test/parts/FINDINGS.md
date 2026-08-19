# 設計段階の所見（統括の判断待ち）

テスト実行前に、仕様書とソースコードの突き合わせで見つかったもの。
実行結果ではないため、まだ不具合管理台帳へは登録していない。
実行後に該当テストの結果と突き合わせて、登録要否と原因分類を確定する。

---

## 1. 検索結果が並べ替え設定を無視する

| | |
|---|---|
| 検出 | グループC（F-07 / F-09） |
| 根拠 | 機能仕様書 §8.9「選択した順序で一覧が並ぶ」 |
| 実装 | `SnippetMapper.SEARCH` が `ORDER BY createdAt ASC` 固定 |
| 現象 | 検索語が空のときは設定順（作成日時の降順）、検索語を入れると作成日時の昇順。**同じ画面で入力した瞬間に並びが逆転する** |
| 関連 | `P-F09-026` / TC-2322 |
| 分類案 | `SPEC_IMPLEMENTATION_MISMATCH` |

期待値は §8.9 に合わせてあるため、実行するとFAILする。

## 2. サブスクリプション管理のキーボード案内にフルアクセス注記が無い（対応済み・クローズ）

| | |
|---|---|
| 検出 | グループD2（F-22） |
| 根拠 | 機能仕様書 §8.22「iOSではフルアクセスの注記を併記する」 |
| 検出時の実装 | `manage.tsx` にモーダルが複製実装されており、`KeyboardGuideModal` にある注記が欠けていた |
| 関連 | TC-4603 |
| 結論 | `manage.tsx` の複製モーダルを削除し、設定画面と同じ `KeyboardGuideModal`（`apps/mobile/src/components/settings/KeyboardGuideModal.tsx`）を使うようにした。注記は `subscription.keyboard_guide_full_access_note` で、iOSのときだけ両画面に出る |

## 3. 一覧行の入れ子ボタンがアクセシビリティツリーから操作できない

| | |
|---|---|
| 検出 | グループA（F-03 / F-04 / F-05） |
| 根拠 | 機能仕様書に記述なし |
| 実装 | カテゴリ管理・プロファイル管理・変数管理の行は親の `TouchableOpacity` が `accessible` なため、入れ子の削除・標準にするボタンが独立要素にならない |
| 実測 | `sim.sh count 'label=削除'` → 0、`label~=削除` → 2（行の複合ラベルに一致するだけ）。行は `label="A社用, 標準にする, 削除"` の1要素 |
| 影響 | 自動テストで13パターンが `UNREACHABLE`。**VoiceOver利用者も個別ボタンを操作できない** |
| 分類案 | 保留 |

仕様書にアクセシビリティの要件が無いため、現時点では不具合と断定できない。
機能仕様書へ反映する候補（§1.1: 実装を正として仕様書を追従）。
行コンテナを `accessible={false}` にするか、行本体と操作ボタンを兄弟要素へ分ければ、
13パターンはそのまま `REACHABLE` へ戻せる。

## 4. `/profile/variable-edit` へ遷移する導線が実装されていない（対応済み・クローズ）

| | |
|---|---|
| 検出 | 画面・ルート解析 |
| 根拠 | 機能仕様書 §9.1 が記載する「変数編集 → プロファイル値編集」の実体は `/variable/profile-value-edit` であり、`/profile/variable-edit` は §9.1 に記載が無かった |
| 実装 | リポジトリ全体に `router.push('/profile/variable-edit')` が1件も無かった |
| 関連 | R-043 / `SC-PROFILE-VARIABLE-EDIT`（いずれも削除済み） |
| 結論 | デッドコードと判断し、`apps/mobile/app/profile/variable-edit.tsx`、`useProfileVariableEditScreen.ts`、`_layout.tsx` のStack登録を削除した |

削除にあわせて `routes.csv` の R-043、`screens.csv` の `SC-PROFILE-VARIABLE-EDIT`、
`pattern-matrix.csv` の P-F05-902 / P-F05-904、`ERROR-MAP.md` の
`変数の値を入力してください` の行、機能仕様書 §10.4 の同エラー行も削除した。
deep link `cliptap://profile/variable-edit` も開かなくなった。

## 5. 未連携時に状態バッジが表示されない

| | |
|---|---|
| 検出 | グループD2（F-16） |
| 根拠 | `settings.account_auth.status_unauthenticated`（未連携）という文言が定義されている |
| 実装 | バッジは連携済みブランチにしか描画されず、未連携時は「連携済」も「未連携」も出ない |
| 関連 | TC-4002 |
| 分類案 | 要判断（未使用の文言か、表示漏れか） |

## 6. アプリバージョンの表示は仕様に無い

| | |
|---|---|
| 検出 | グループD2（F-21） |
| 根拠 | 機能仕様書 §8.21 のアプリ情報はDBスキーマバージョンのみを規定 |
| 実装 | `Version : 7`（`SCHEMA_VERSION`）だけを表示 |
| 分類案 | 不具合ではない |

統括の当初の指示に「アプリバージョン表示」と書いたが、仕様の裏付けが無かった。
指示側の誤りとして記録する。

## 7. 開発者オーバーライドのProはentitlementを持たない

| | |
|---|---|
| 検出 | グループD2（F-17） |
| 実装 | `plan=pro` はプラン判定を上書きするが、RevenueCatのentitlementは無いままなので、管理画面に次回更新日が出ない |
| 影響 | §8.17 の「次回更新日表示」は自動実行では検証できない |
| 分類案 | 不具合ではない（テスト環境の制約） |

仕様側の期待は `UNREACHABLE`、実装側の挙動は `REACHABLE` として両方を残してある。

## 8. 起動のたびに全プロファイル・全カスタム変数の `updatedAt` が書き換わる

| | |
|---|---|
| 検出 | グループD1（F-18） |
| 根拠 | 機能仕様書 §8.18 に通常起動での `updatedAt` 更新の記述が無い（§8.14 のインポート文脈にのみ言及がある） |
| 実装 | `ProfileMapper.RESET_VALID` / `VariableMapper.RESET_VALID` が `valid=0, updatedAt=?` を無条件で全行へ流す。`SubscriptionService.updateValidFlags()` は `useAppInitialization` のDB初期化後の `useEffect`（`isDbInitialized && !subscriptionLoading && !verificationFailed` のとき実行）と `SubscriptionProvider` の初期化から**毎回の起動時に**呼ばれる |
| 影響 | プランが変わっていなくても、起動するだけで全行の更新日時が現在時刻になる。fixtureで固定した日時は起動後に必ず失われる |
| 関連 | TC-3420 / TC-3421（実装挙動を期待値として固定） |
| 分類案 | `SPEC_IMPLEMENTATION_MISMATCH` または仕様書の記載漏れ |

「更新日時順」の並べ替えの意味にも影響する（利用者が編集していなくても順序が変わり得る）。

## 9. UIから到達しない実装が2か所

| | |
|---|---|
| 検出 | グループD1（F-13） |
| 実装1 | `export-import.tsx` のパスワード入力モーダルにある `modalMode === 'export'` 側の分岐（アイコン `cloud-upload` / `export_import.export_title` / `export_import.export_password_hint` の3か所）。`useExportImportScreen` で `setShowPasswordModal(true)` を呼ぶのは `handleImportBackup` だけで、そこでは必ず直前に `setModalMode('import')` している。`handlePasswordSubmit` の `modalMode === 'export'` 側（モーダルを閉じて入力を捨てるだけの分岐）も同じ理由で通らない |
| 実装2 | `useSelectExportDataScreen` の `handleExportPress` にある `totalSelected === 0` のとき `error.no_selection`（「1件以上選択してください」）を出す分岐。`select-export-data.tsx` のエクスポートボタンが `disabled={totalSelected === 0 \|\| isProcessing}` のため `onPress` が発火しない |
| 分類案 | 不具合ではない（デッドコード） |

位置は関数名と条件式で示している（行番号は編集のたびにずれ、記述だけが古くなるため）。

検出時点では第4項の `/profile/variable-edit` と合わせて3か所だったが、
第4項は画面ごと削除してクローズしたため、残る到達しない実装は上記2か所である。

## 10. モバイルにもWebにも「全件エクスポート」の独立導線が無い

| | |
|---|---|
| 検出 | グループD1（F-13） |
| 根拠 | 機能仕様書 §8.13 は「全データまたは選択データをエクスポートできる」と書き、Webについてだけ「独立した『全件』ボタンを持たず4タブを全件選択済みで開く」と明記している |
| 実装 | モバイルも同じ構造。`useExportImportScreen.handleExportBackup` は `/settings/select-export-data` へ `router.push` するだけで、書き出しは `useSelectExportDataScreen.handlePasswordSubmit` の `ExportService.exportSelectedData()` が行う。Webも `useExportScreen.handleExportSelected` / `PageLayout.handleExportSelected` から同じ `exportSelectedData()` を呼ぶ |
| 補足 | 「全件」は `useSelection` の `computeInitialSelection` が候補を全件選択した状態で選択画面を開くことで成り立っており、全件専用のメソッドは両プラットフォームとも持たない |
| 分類案 | 仕様書の記載漏れ（実装は一貫している） |

検出時点では全件専用の `ExportService.exportDatabase()` が残っており、Webからのみ呼ばれていた。
今回の修正でこのメソッドを削除し、モバイル・Webとも `exportSelectedData()` へ統一した。
`ExportService` の公開メソッドは現在 `generateFilename()` と `exportSelectedData()` の2つだけである。

## 11. 無効なプロファイルを標準にするガードへ到達できない

| | |
|---|---|
| 検出 | グループD1（F-18） |
| 実装 | 無効な行には「標準にする」バッジ自体が描画されないため、行内のどこを押しても行の `onPress`（Pro案内ダイアログ）が走る。`ProfileService.setDefault` のガードはUIから到達できない |
| 関連 | `P-F18-065`（UNREACHABLE） |
| 分類案 | 不具合ではない（多重防御） |

## 12. 自動化基盤の問題（アプリの不具合ではない）

テスト設計中に見つかった、テスト基盤側の問題。すべて修正済み。記録として残す。

| 事象 | 影響 | 対応 |
|---|---|---|
| `osascript keystroke` がホストの入力ソースを通り、`abc` が `あbc`、日本語が全滅する | 入力を伴う127テストが誤った文字を入れていた | 文字入力をすべてクリップボード貼り付けへ変更 |
| アイコンボタンのラベルがIoniconsの私用領域グリフで、ダンプ上は空に見える | 3グループが「ラベルが空の要素のN番目」という一致しないロケータを書いた（395箇所） | `\uXXXX` 記法を追加し、対応表 `reference/icons.md` を生成 |
| 一覧行が子ボタンを含む複合要素1つになる | 削除・標準切替の21パターンが到達不能と判定された | 要素の矩形内を相対位置で押す `TAP_IN` を追加して復帰 |
| CSVリーダーが値の前後空白を除去していた | 「空白だけの入力」の4パターンが表現できなかった | 値のtrimを廃止し、ID列の空白は検証で落とすようにした |
| 広告バナーのラベルが `Test Ad` ではなく `Test mode` | 広告表示の判定が落ちるはずだった | 実測に基づき期待値を修正 |
| `sortable` fixtureが4種の並べ替えを区別できていなかった | 「作成日順」と「使用頻度順」を取り違えても通ってしまう | データを組み直し、4種すべてが異なる順序になることをDBで検算 |

## 13. カスタム変数の値が別のカスタム変数トークンを含む場合の扱いが仕様に無い

| | |
|---|---|
| 検出 | グループB（F-06。レビュー指摘7の申し送り） |
| 根拠 | 機能仕様書 §8.6「展開の共通規則」2. は「システム変数を先に、次にカスタム変数を展開する」としか書いていない |
| 実装 | `replaceVariables`（`packages/shared/src/variables/parser.ts:144`）は**展開前の元テキストから1度だけ**トークンを集める（`text.matchAll`）。置換で差し込まれた文字列は再走査しないため、カスタム変数の値に含まれるトークンは、システム変数・カスタム変数のどちらであっても展開されずに残る |
| 現象 | 値が `{{today}}` を含む場合は §8.6 の順序規則から結論を導けるため `P-F06-032` / TC-1015 でテストにした。**値が別のカスタム変数トークン（例 `{{company}}`）を含む場合は、仕様書に「再帰展開するか否か」の記述が無い**ため、期待値を仕様から導けない。パターンは作っていない |
| 分類案 | 仕様書への追記候補（§1.1） |

「展開できないトークンは原則として元の形を残す」（§8.6 の規則5）を根拠に「残る」と読むこともできるが、
規則5は「解決できないトークン」の話であって「解決した値の中に現れたトークン」を対象にしていない。
仕様側で「カスタム変数の値は再展開しない」と1行決めれば、パターンとテストを起こせる。

## 14. 標準プロファイル削除メッセージの文言が仕様書と実装で1文字違う

| | |
|---|---|
| 検出 | ERROR-MAP.md 作成時（F-04 / §10.4） |
| 根拠 | 機能仕様書 §10.4（`docs/機能仕様書.md:1289`）は `標準のプロファイルは削除できません` |
| 実装 | `packages/shared/src/i18n/ja.json:214` の `error.cannot_delete_default_profile` は `標準プロファイルは削除できません`（「の」が無い） |
| 影響 | 該当パターン `P-F04-901` は `UNREACHABLE`（一覧が標準行に削除ボタンを描画しない）のため、現状どのテストも落ちない |
| 分類案 | `SPEC_IMPLEMENTATION_MISMATCH`（軽微。仕様書側の表記ゆれと思われる） |

英語版（`en.json:214` `The default profile cannot be deleted`）には差が無い。

## 15. パスワードモーダルの要素がアクセシビリティツリーで1つに畳み込まれている

| | |
|---|---|
| 検出 | 原因分類G1（F-13） |
| 根拠 | 機能仕様書に記述なし |
| 実装 | `apps/mobile/app/settings/select-export-data.tsx:240` の `TouchableWithoutFeedback` がオーバーレイ全体を1要素にしている |
| 現象 | パスワード入力欄も `OK` ボタンも独立したラベルを持たず、個別に指定できない |
| 影響 | 自動テストは相対座標での操作が必要。**VoiceOver利用者も個別に操作できない** |
| 分類案 | 保留（第3項の一覧行と同じ性質） |

第3項（一覧行の入れ子ボタン）と同じく、仕様書にアクセシビリティ要件が無いため不具合と断定できない。
まとめて機能仕様書へ反映する候補（§1.1: 実装を正として仕様書を追従）。

## 16. 自動化基盤の問題（追加分・アプリの不具合ではない）

| 事象 | 影響 | 対応 |
|---|---|---|
| `state.sh pref get` が読み取りでもアプリを終了させていた | `ASSERT_PREF` を含むテストが以降のステップで全滅（10件以上に波及） | 書き込み時だけ終了するよう変更 |
| 画面識別子に入力欄のプレースホルダを使っていた | 入力すると消えるため、入力後の画面判定が必ず落ちる（検索・プロファイル値編集） | 値の有無に左右されない要素へ変更 |
| 起動完了待ちの関数を編集で巻き添え削除 | 全テストが1ステップ目で落ちた | 復元。同じ箇所で2度起こしている |
| zshの `read` が空文字でも成功する | 候補を順に試す分岐が最初の候補で必ず打ち切られ、被せ表示を閉じられなかった | 終了コードではなく中身で判定 |
