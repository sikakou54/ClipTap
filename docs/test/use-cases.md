# ClipTap ユースケース一覧表

**Version**: 1.2.0
**作成日**: 2025-12-15
**スキーマバージョン**: V5

---

## 概要

ClipTapは定型文・コードスニペットをワンタップでコピーできるモバイル・Webアプリです。本ドキュメントでは、アプリの全ユースケースを一覧化しています。

### 統計

| 項目 | 数値 |
|-----|------|
| 総ユースケース数 | 87件 |
| 機能カテゴリ | 16カテゴリ |
| 対応プラットフォーム | iOS / Android / Web |

---

## 目次

1. [定型文（Snippet）管理](#1-定型文snippet管理)
2. [カテゴリ（Category）管理](#2-カテゴリcategory管理)
3. [プロファイル（Profile/環境）管理](#3-プロファイルprofile環境管理)
4. [変数（Variable）管理](#4-変数variable管理)
5. [検索](#5-検索)
6. [エクスポート・インポート](#6-エクスポートインポート)
7. [サブスクリプション](#7-サブスクリプション)
8. [認証（アカウント連携）](#8-認証アカウント連携)
9. [設定・その他](#9-設定その他)
10. [広告](#10-広告)
11. [ATT（App Tracking Transparency）](#11-attapp-tracking-transparency)
12. [テーマ・表示設定](#12-テーマ表示設定)
13. [言語設定](#13-言語設定)
14. [Web固有機能](#14-web固有機能)
15. [フィードバック・UX](#15-フィードバックux)
16. [エラーハンドリング](#16-エラーハンドリング)
17. [補足情報](#補足情報)

---

## 1. 定型文（Snippet）管理

定型文の作成・編集・削除・コピーに関するユースケース。

| UC-ID | ユースケース名 | アクター | 説明 | 関連画面 |
|-------|---------------|---------|------|---------|
| UC-SNP-001 | 定型文を新規作成する | ユーザー | タイトル、内容、カテゴリ、プロファイルを指定して定型文を作成する。SnippetService.create()でEmptyContentErrorの場合はエラー表示 | `/snippet/create` |
| UC-SNP-002 | 定型文を編集する | ユーザー | 既存の定型文のタイトル、内容、カテゴリ、プロファイルを変更する。SnippetService.update()で存在確認後に更新 | `/snippet/edit` |
| UC-SNP-003 | 定型文を削除する | ユーザー | 不要な定型文を削除する（確認ダイアログあり）。SnippetService.delete()でsnippet_profilesも連動削除 | ホーム画面（スワイプ） |
| UC-SNP-004 | 定型文をコピーする | ユーザー | ワンタップで定型文をクリップボードにコピーする。SnippetService.prepareForClipboard()で変数展開後、ClipboardAdapter経由でコピー、Hapticsフィードバック | ホーム画面 |
| UC-SNP-005 | タイトル付きでコピーする | ユーザー | snippet.copyWithTitle=trueの場合「タイトル+改行+内容」の形式でクリップボードにコピーする | ホーム画面 |
| UC-SNP-006 | 定型文一覧を閲覧する | ユーザー | 登録済み定型文の一覧を表示する。SnippetService.getAll(filterByProfileId)でプロファイルフィルタリング対応、FlashListによる高速レンダリング | ホーム画面 |
| UC-SNP-007 | 定型文一覧を更新する | ユーザー | Pull-to-Refreshでrefresh()を呼び出しSnippetService.getAll()で一覧を再読み込みする | ホーム画面 |
| UC-SNP-008 | 変数を挿入する | ユーザー | 定型文作成・編集時にシステム変数/カスタム変数を挿入する。VariableService.getAll()で一覧取得 | `/snippet/create`, `/snippet/edit` |
| UC-SNP-009 | プレビューを確認する | ユーザー | VariableService.expandTextSync()で変数展開後の内容をリアルタイムでプレビュー表示する | `/snippet/create`, `/snippet/edit` |
| UC-SNP-010 | プロファイルを割り当てる | ユーザー | 定型文を特定のプロファイル（複数可）に紐づける。SnippetService.setProfileIds()でsnippet_profilesテーブルを更新 | `/snippet/profile-select` |
| UC-SNP-011 | カテゴリを割り当てる | ユーザー | 定型文にカテゴリを設定する。SnippetService.update({categoryId})で更新 | `/category/select` |

---

## 2. カテゴリ（Category）管理

カテゴリの作成・編集・削除・フィルタリングに関するユースケース。

| UC-ID | ユースケース名 | アクター | 説明 | 関連画面 |
|-------|---------------|---------|------|---------|
| UC-CAT-001 | カテゴリを新規作成する | ユーザー | 名前と色を指定してカテゴリを作成する。CategoryService.create()で重複名チェック（DuplicateNameError） | `/settings/categories` |
| UC-CAT-002 | カテゴリを編集する | ユーザー | カテゴリ名や色を変更する。CategoryService.update()で存在確認後に更新 | `/category/edit` |
| UC-CAT-003 | カテゴリを削除する | ユーザー | 不要なカテゴリを削除する。CategoryService.delete()で紐づいた定型文のcategoryIdをnullに更新後、カテゴリを削除 | `/category/edit` |
| UC-CAT-004 | カテゴリ一覧を閲覧する | ユーザー | CategoryService.getAll()でorder順に並べた一覧を表示する | `/settings/categories` |
| UC-CAT-005 | カテゴリでフィルターする | ユーザー | SnippetService.getByCategory(categoryId, filterByProfileId)で特定カテゴリの定型文のみ表示する | ホーム画面（フィルター） |
| UC-CAT-006 | 全カテゴリ表示に戻す | ユーザー | フィルターを解除してSnippetService.getAll()で全定型文を表示する | ホーム画面 |
| UC-CAT-007 | 未分類でフィルターする | ユーザー | SnippetService.getByCategory(null)でカテゴリなしの定型文のみ表示する | ホーム画面 |
| UC-CAT-008 | カテゴリを並び替える | ユーザー | CategoryService.reorder(orderedIds)でカテゴリの表示順を変更する | `/settings/categories` |

---

## 3. プロファイル（Profile/環境）管理

プロファイル（環境）の作成・編集・削除・切り替えに関するユースケース。

| UC-ID | ユースケース名 | アクター | 説明 | 関連画面 |
|-------|---------------|---------|------|---------|
| UC-PRF-001 | プロファイルを新規作成する | ユーザー | 名前を指定してプロファイルを作成する。ProfileService.create()で重複名チェック、SubscriptionService.canAddProfile()でFree版は最大3個制限 | `/settings/profiles` |
| UC-PRF-002 | プロファイルを編集する | ユーザー | プロファイル名を変更する。ProfileService.update(id, data)で存在確認後に更新 | `/profile/edit` |
| UC-PRF-003 | プロファイルを削除する | ユーザー | ProfileService.deleteWithAutoSwitch()でプロファイルを削除（デフォルトは削除不可）。関連するprofile_variables, snippet_profilesも連動削除 | `/profile/edit` |
| UC-PRF-004 | プロファイル一覧を閲覧する | ユーザー | ProfileService.getAllIncludingInvalid()で無効なものも含めsortOrder順に一覧表示する | `/settings/profiles` |
| UC-PRF-005 | プロファイルを切り替える | ユーザー | ProfileService.setActive()でアクティブなプロファイルを変更し、dataUpdateEmitter.emit('profileVariablesUpdated')で通知 | ホーム画面（セレクター） |
| UC-PRF-006 | プロファイル別変数値を設定する | ユーザー | ProfileService.setProfileVariable()でプロファイル固有の変数値を編集し、dataUpdateEmitter.emit('profileVariablesUpdated')で通知 | `/profile/variable-edit` |
| UC-PRF-007 | 無効化されたプロファイルを表示する | システム | Free版で制限超過時にvalid=falseのプロファイルを淡く表示し、タップ時にPaywallへ誘導 | `/settings/profiles` |
| UC-PRF-008 | アクティブプロファイルを自動切替する | システム | 削除されたプロファイルがアクティブの場合、ProfileService.deleteWithAutoSwitch()でデフォルトに自動切替する | - |
| UC-PRF-009 | プロファイルをデフォルト設定する | ユーザー | ProfileService.setDefault()でデフォルトプロファイルを変更する | `/profile/edit` |
| UC-PRF-010 | プロファイル変数マップを取得する | システム | ProfileService.getProfileVariablesMap(profileId)でプロファイル別変数値のマップを取得する | - |

---

## 4. 変数（Variable）管理

変数（システム変数・カスタム変数）の管理に関するユースケース。

| UC-ID | ユースケース名 | アクター | 説明 | 関連画面 |
|-------|---------------|---------|------|---------|
| UC-VAR-001 | カスタム変数を新規作成する | ユーザー | 名前、ラベル、アイコンを指定して変数を作成する。VariableService.create()で重複名・予約語チェック、SubscriptionService.canAddVariable()でFree版は最大5個制限 | `/settings/variables` |
| UC-VAR-002 | カスタム変数を編集する | ユーザー | 変数名、ラベル、アイコンを変更する。VariableService.update(id, data)で更新 | `/variable/edit` |
| UC-VAR-003 | カスタム変数を削除する | ユーザー | VariableService.delete()で変数を削除。関連するprofile_variablesも連動削除 | `/variable/edit` |
| UC-VAR-004 | 変数一覧を閲覧する | ユーザー | VariableService.getAllIncludingInvalid()で無効なものも含めsortOrder順に一覧表示する | `/settings/variables` |
| UC-VAR-005 | プロファイル別値を設定する | ユーザー | VariableService.upsertValueForProfile()でプロファイルごとに異なる変数値を設定する | `/variable/profile-value-edit` |
| UC-VAR-006 | システム変数を使用する | ユーザー | VariableService.expandTextSync()で`{{today}}`, `{{now}}`, `{{time}}`等のシステム変数を展開する。日本語エイリアス（`{{今日}}`等）も使用可能、大文字小文字の区別なし | `/snippet/create`, `/snippet/edit` |
| UC-VAR-007 | 無効化された変数を表示する | システム | Free版で制限超過時にvalid=falseの変数を淡く表示し、タップ時にPaywallへ誘導 | `/settings/variables` |
| UC-VAR-008 | 変数名のバリデーションを行う | システム | 変数名が命名規則（`^[a-zA-Z_][a-zA-Z0-9_]*$`）に従っているか検証、予約語チェック、最大50文字 | `/variable/edit` |
| UC-VAR-009 | 変数リゾルバーを作成する | システム | VariableService.createCustomVariableResolver()でコンテキストに応じた変数解決関数を生成する | - |
| UC-VAR-010 | プロファイル別変数値を一括設定する | ユーザー | VariableService.upsertValuesForProfiles()で複数プロファイルの変数値を一括設定する | `/variable/profile-value-edit` |

---

## 5. 検索

定型文の検索に関するユースケース。

| UC-ID | ユースケース名 | アクター | 説明 | 関連画面 |
|-------|---------------|---------|------|---------|
| UC-SRC-001 | キーワードで検索する | ユーザー | SnippetService.search(query, categoryId)でタイトル・内容をLIKE検索する（300msデバウンス） | `/search` |
| UC-SRC-002 | 検索結果をコピーする | ユーザー | 検索結果からSnippetService.prepareForClipboard()で変数展開後コピーする | `/search` |
| UC-SRC-003 | 検索結果から編集する | ユーザー | 検索結果から`/snippet/edit`画面に遷移する | `/search` |
| UC-SRC-004 | 検索をクリアする | ユーザー | 検索キーワードをクリアして空状態に戻す | `/search` |
| UC-SRC-005 | 検索画面を閉じる | ユーザー | 検索画面を閉じてホームに戻る | `/search` |
| UC-SRC-006 | プロファイルでフィルターする | ユーザー | SnippetService.getAll(filterByProfileId)でプロファイルチップによるフィルタリング（複数プロファイル時のみ表示） | `/search` |

---

## 6. エクスポート・インポート

データのバックアップと復元に関するユースケース。

| UC-ID | ユースケース名 | アクター | 説明 | 関連画面 |
|-------|---------------|---------|------|---------|
| UC-EXP-001 | 全データをエクスポートする | ユーザー | ExportService.exportDatabase(password)でDBをBase64エンコード、SHA-256ハッシュ・チェックサム付きで`.cliptap`ファイルに出力する | `/settings/export-import` |
| UC-EXP-002 | 選択データをエクスポートする | ユーザー | ExportService.exportSelectedData(password, selection)で選択したデータのみをエクスポートする。ExportMapper.deleteUnselectedData()で未選択データを削除後エクスポート | `/settings/select-export-data` |
| UC-IMP-001 | ファイルを選択する | ユーザー | FilePickerAdapterで`.cliptap`ファイルを選択し、パスワード入力画面に遷移する | `/settings/export-import` |
| UC-IMP-002 | フルリストアを実行する | ユーザー | ImportService.importDatabaseFromTempDb()で既存データを完全に置き換える。外部キー制約を考慮した順序で削除後、全データをインポート | `/settings/export-import` |
| UC-IMP-003 | インポート候補を確認する | ユーザー | ImportService.getImportCandidates(tempDbPath)でImportMapper.getAllCandidates()から一時DBのカテゴリ/変数/プロファイル/スニペットの候補一覧を取得する | `/settings/select-import-data` |
| UC-IMP-004 | 部分インポートを実行する | ユーザー | ImportService.importPartial()で選択したデータのみマージして取り込む。カテゴリ→変数→プロファイル→変数値→スニペットの順で処理、重複名は既存を優先しIDを再マッピング | `/settings/select-import-data` |
| UC-IMP-005 | デフォルト/アクティブプロファイルを補正する | システム | ImportService.ensureDefaultAndActiveProfile()でインポート後にデフォルト・アクティブが欠落していれば自動設定する | - |
| UC-IMP-006 | インポート完了を通知する | システム | dataUpdateEmitter.emit('dataImported')で各Providerにデータ更新を通知する | - |
| UC-IMP-007 | インポート時にsortOrderを復元する | システム | ImportMapperからsortOrder含む全フィールドを取得し、カテゴリ・プロファイル・変数の並び順を復元する | - |
| UC-IMP-008 | インポート時にIDマッピングを解決する | システム | categoryIdMap, profileIdMap, variableIdMapで旧ID→新IDのマッピングを追跡し、関連テーブルのIDを正しく設定する | - |
| UC-IMP-009 | インポートファイルを検証する | システム | ImportParserService.parseAndValidate()でJSON形式・スキーマバージョン・パスワードハッシュ・チェックサムを検証する | - |
| UC-IMP-010 | 一時データベースをクリーンアップする | システム | ImportService.cleanupTempDatabase(tempDbPath)でインポート完了後に一時DBファイルを削除する | - |

---

## 7. サブスクリプション

Proプランの購入・管理に関するユースケース。

| UC-ID | ユースケース名 | アクター | 説明 | 関連画面 |
|-------|---------------|---------|------|---------|
| UC-SUB-001 | Proプランを購入する | ユーザー | SubscriptionService.purchase(planId)で月額(¥250)/年額(¥3,000)プランを購入してアップグレードする | `/subscription/paywall` |
| UC-SUB-002 | 購入を復元する | ユーザー | SubscriptionService.restore()でRevenueCatから別端末での購入を復元する | `/subscription/paywall` |
| UC-SUB-003 | サブスクリプション状態を確認する | ユーザー | SubscriptionService.getStatus()で現在のプラン状態を確認する | `/subscription/manage` |
| UC-SUB-004 | Paywallを表示する | システム | SubscriptionService.canAddProfile()/canAddVariable()でFree版制限到達時にPaywallを表示する | `/subscription/paywall` |
| UC-SUB-005 | Webでサブスク状態を検証する | システム | WebSubscriptionAdapterでPurchases-js SDKを使用しエンタイトルメントを確認しPro可否を反映する | `/subscription/manage` |
| UC-SUB-006 | モバイルでログイン後に自動復元する | システム | AuthService.signInWithGoogle()/signInWithApple()でFirebaseログイン後にSubscriptionService.linkAccount(userId)でRevenueCatへリンクする | `/subscription/paywall` |
| UC-SUB-007 | DEVモードでサブスク状態を上書きする | 開発者 | 開発環境でSubscriptionService経由でサブスク状態を手動指定しテストする | `devtools` |
| UC-SUB-008 | サブスク変更を全体へ伝播する | システム | SubscriptionService.updateValidFlags()でvalidフラグを更新し、dataUpdateEmitter.emit('subscriptionChanged')で依存Providerへ通知する | - |
| UC-SUB-009 | サブスクリプション状態を購読する | システム | SubscriptionService.subscribe(listener)で状態変更を監視する | - |
| UC-SUB-010 | 顧客情報を最新化する | システム | SubscriptionService.refreshCustomerInfo()でRevenueCatから最新の顧客情報を取得する | - |

---

## 8. 認証（アカウント連携）

Firebase Authenticationを使用したアカウント連携に関するユースケース。

| UC-ID | ユースケース名 | アクター | 説明 | 関連画面 |
|-------|---------------|---------|------|---------|
| UC-AUTH-001 | Googleでサインインする | ユーザー | AuthService.signInWithGoogle()でGoogleアカウントでログインする（iOS/Android）。成功後、AuthService.linkToRevenueCat()でSubscriptionService.linkAccount(user.uid)を呼び出しRevenueCat連携 | `/settings` |
| UC-AUTH-002 | Appleでサインインする | ユーザー | AuthService.signInWithApple()でAppleアカウントでログインする（iOS専用）。成功後、AuthService.linkToRevenueCat()でSubscriptionService.linkAccount(user.uid)を呼び出しRevenueCat連携 | `/settings` |
| UC-AUTH-003 | ログアウトする | ユーザー | AuthService.signOut()でFirebase Authからサインアウトする | `/settings` |
| UC-AUTH-004 | 連携状態を確認する | ユーザー | AuthService.getCurrentUser()で現在のログイン状態（SharedUser \| null）を確認する | `/settings` |
| UC-AUTH-005 | 認証状態変更を監視する | システム | AuthService.onAuthStateChanged(listener)で認証状態の変更を監視し、AuthProviderがuser状態を更新する | - |
| UC-AUTH-006 | 認証エラーを処理する | システム | AuthProvider内でtry-catchによりサインイン/サインアウトエラーをキャッチし、error状態を設定してUIに表示する | `/settings` |
| UC-AUTH-007 | RevenueCatとアカウントを紐付ける | システム | AuthService.linkToRevenueCat()でFirebase UIDをSubscriptionService.linkAccount()経由でRevenueCatに紐付け、デバイス間で購入履歴を同期する | - |
| UC-AUTH-008 | RevenueCatからログアウトする | システム | SubscriptionService.logout()でRevenueCatの匿名ユーザーに戻す | - |

---

## 9. 設定・その他

設定画面・法的文書に関するユースケース。

| UC-ID | ユースケース名 | アクター | 説明 | 関連画面 |
|-------|---------------|---------|------|---------|
| UC-SET-001 | 設定画面を表示する | ユーザー | 設定画面に遷移する | `/settings` |
| UC-SET-002 | 利用規約を閲覧する | ユーザー | 利用規約をWebViewで表示する | `/webview` |
| UC-SET-003 | プライバシーポリシーを閲覧する | ユーザー | プライバシーポリシーをWebViewで表示する | `/webview` |
| UC-SET-004 | Webで初期化・キャッシュ復元する | システム | WebDbCacheManagerでIndexedDBからデータを復元し、無ければファイルアップロード画面に遷移する | `/` |
| UC-SET-005 | Webでサブスク変化後に制限を再計算する | システム | WebSubscriptionAdapterの状態変更後、SubscriptionService.updateValidFlags()でvalidフラグを再計算する | - |

---

## 10. 広告

広告表示に関するユースケース。

| UC-ID | ユースケース名 | アクター | 説明 | 関連画面 |
|-------|---------------|---------|------|---------|
| UC-AD-001 | バナー広告を表示する | システム | SubscriptionService.isSubscribed()がfalseの場合、AdMob SDKでバナー広告を表示する（Free版のみ） | ホーム画面（下部） |
| UC-AD-002 | 広告を非表示にする | システム | SubscriptionService.isSubscribed()がtrueの場合、広告を非表示にする（Pro版） | - |

---

## 11. ATT（App Tracking Transparency）

iOSのトラッキング許可に関するユースケース。

| UC-ID | ユースケース名 | アクター | 説明 | 関連画面 |
|-------|---------------|---------|------|---------|
| UC-ATT-001 | トラッキング許可をリクエストする | システム | 初回起動時にATTダイアログを表示する（iOS 14.5以上） | アプリ起動時 |

---

## 12. テーマ・表示設定

ダークモード・ライトモードに関するユースケース。

| UC-ID | ユースケース名 | アクター | 説明 | 関連画面 |
|-------|---------------|---------|------|---------|
| UC-DISP-001 | システムテーマに従う | システム | useColorScheme()で端末のテーマ設定を検知しLIGHT_THEME_COLORS/DARK_THEME_COLORSを自動適用する | すべて |
| UC-DISP-002 | テーマカラーを全コンポーネントに適用する | システム | themeSystem.tsxで統一されたカラーパレット（colors）を提供する | すべて |
| UC-DISP-003 | タブレットデバイスを検知する | システム | isTablet()でDimensions.get('window').width >= 768を判定しデバイスタイプを取得する | すべて |
| UC-DISP-004 | レスポンシブレイアウトを適用する | システム | getResponsiveSpacing(isTablet)でデバイスタイプに応じたpadding/margin/fontSizeを動的に設定する | すべて |

---

## 13. 言語設定

多言語対応に関するユースケース。

| UC-ID | ユースケース名 | アクター | 説明 | 関連画面 |
|-------|---------------|---------|------|---------|
| UC-LANG-001 | デバイス言語を自動検知する | システム | Expo Localization（getLocales()[0]）でロケール設定を読み込む | アプリ起動時 |
| UC-LANG-002 | 日本語/英語を切り替える | システム | i18next.changeLanguage()で言語リソースを切り替え、AsyncStorageに保存する | - |
| UC-LANG-003 | システム変数をロケールに応じてフォーマットする | システム | resolveSystemVariableValue()を使用して日付・曜日をロケールに応じた形式で展開する | - |

---

## 14. Web固有機能

Web版専用の機能に関するユースケース。

| UC-ID | ユースケース名 | アクター | 説明 | 関連画面 |
|-------|---------------|---------|------|---------|
| UC-WEB-001 | IndexedDBからデータを復元する | システム | WebDbCacheManager.loadFromCache()でIndexedDB('cliptap-db')キャッシュを自動読み込みする | `/` |
| UC-WEB-002 | ファイルをドラッグ&ドロップで読み込む | ユーザー | react-dropzoneでonDrop()を処理し.cliptapファイルをインポートする | `/` |
| UC-WEB-003 | データをIndexedDBにキャッシュする | システム | DB更新時にonDbChange()でWebDbCacheManagerへ自動保存する（300msデバウンス） | - |
| UC-WEB-004 | キャッシュがない場合ファイルアップロードを促す | システム | IndexedDBが空の場合、FileUploadAreaを表示してファイル選択を促す | `/` |

---

## 15. フィードバック・UX

ユーザーフィードバックに関するユースケース。

| UC-ID | ユースケース名 | アクター | 説明 | 関連画面 |
|-------|---------------|---------|------|---------|
| UC-UX-001 | コピー時に振動フィードバックを提供する | システム | Haptics.impactAsync(ImpactFeedbackStyle.Light)でコピー成功を通知する（Mobile） | ホーム画面 |
| UC-UX-002 | コピー完了を視覚的に表示する | システム | SnippetCardでコピーアイコンがチェックマークに変化し、一定時間後に戻る | ホーム画面 |
| UC-UX-003 | トースト通知を表示する | システム | ToastComponent.show({message, type})で操作完了時にトーストを表示する | すべて |
| UC-UX-004 | 確認ダイアログを表示する | システム | Alert.alert(title, message, buttons)で削除などの破壊的操作前に確認を求める | すべて |

---

## 16. エラーハンドリング

エラー処理に関するユースケース。

| UC-ID | ユースケース名 | アクター | 説明 | 関連画面 |
|-------|---------------|---------|------|---------|
| UC-ERR-001 | 空の定型文作成を拒否する | システム | SnippetService.create()でEmptyContentErrorをキャッチしアラート表示する | `/snippet/create` |
| UC-ERR-002 | 重複した名前を拒否する | システム | CategoryService/ProfileService/VariableServiceでDuplicateNameErrorをキャッチしアラート表示する | カテゴリ/プロファイル/変数作成画面 |
| UC-ERR-003 | 存在しないリソースへのアクセスを処理する | システム | Service層でgetById()がnullの場合NotFoundErrorをスローし適切なメッセージを表示する | - |
| UC-ERR-004 | データベースエラーを処理する | システム | DbAdapterでDatabaseErrorをキャッチしユーザーへ通知する | - |

---

## 補足情報

### プラン別機能制限

| 機能 | Free版 | Pro版 |
|------|-------|-------|
| 定型文数 | 無制限 | 無制限 |
| カテゴリ数 | 無制限 | 無制限 |
| プロファイル数 | 最大3個 | 無制限 |
| カスタム変数数 | 最大5個 | 無制限 |
| 広告表示 | あり | なし |

### システム変数一覧

| 変数名 | 日本語エイリアス | 説明 | 出力形式例 |
|--------|-----------------|------|-----------|
| `{{today}}` | `{{今日}}` | 今日の日付 | `2025/12/15` |
| `{{now}}` | `{{現在}}` | 現在の日時 | `2025/12/15 14:30:45` |
| `{{time}}` | `{{時刻}}` | 現在の時刻 | `14:30` |
| `{{year}}` | `{{年}}` | 4桁年 | `2025` |
| `{{month}}` | `{{月}}` | 月（ゼロパディング） | `12` |
| `{{day}}` | `{{日}}` | 日（ゼロパディング） | `15` |
| `{{weekday}}` | `{{曜日}}` | 曜日 | `日曜日` |

> **注意**: 変数名は大文字小文字を区別しません。`{{TODAY}}`、`{{Today}}`、`{{today}}`はすべて同じ結果になります。

### データベーステーブル構成

| テーブル名 | 説明 |
|-----------|------|
| `snippets` | 定型文（テンプレート） |
| `categories` | カテゴリ |
| `profiles` | プロファイル（環境） |
| `variables` | 変数（システム/カスタム） |
| `profile_variables` | プロファイル別変数値 |
| `snippet_profiles` | スニペット-プロファイル関連 |

### dataUpdateEmitterイベント

| イベント名 | 発火タイミング | 影響範囲 |
|------------|---------------|---------|
| `dataImported` | インポート完了時 | 全Provider再読み込み |
| `profileVariablesUpdated` | プロファイル切替・変数更新時 | スニペット表示再計算 |
| `subscriptionChanged` | サブスクリプション状態変更時 | validフラグ更新 |

---

## 関連ドキュメント

- [シーケンス図集](./use-cases-sequences.md) - 全ユースケースのシーケンス図
- [アーキテクチャ概要](../ARCHITECTURE.md) - 3層アーキテクチャとデータフロー
- [API仕様書](../API.md) - Service/Mapper API仕様

---

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2025-12-15 | アカウント連携（認証）のユースケースを追加（UC-AUTH-006〜008）。AuthProvider、linkToRevenueCat、logout等の詳細を反映。総ユースケース数を87件に修正 |
| 2025-12-15 | 現行コードに基づいて全ユースケースを最新化。メソッドシグネチャ（ProfileService.update(id, data)、VariableService.update(id, data)等）を修正。ImportService/AuthServiceの詳細を更新 |
| 2025-12-15 | システム変数一覧を最新化（日本語エイリアス追加、出力形式の修正）、UC-VAR-006に日本語エイリアス・大文字小文字の区別なしを追記 |
