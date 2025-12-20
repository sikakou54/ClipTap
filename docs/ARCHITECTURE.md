# ClipTap アーキテクチャドキュメント

**Version**: 1.2.0
**Database Schema**: V5
**Last Updated**: 2025-12-18

---

## 目次

- [プロジェクト概要](#プロジェクト概要)
- [プロジェクト構造](#プロジェクト構造)
- [技術スタック](#技術スタック)
- [アーキテクチャ概要](#アーキテクチャ概要)
- [レイヤー構造](#レイヤー構造)
- [データフロー](#データフロー)
- [セキュリティとプライバシー](#セキュリティとプライバシー)
- [プラン制限](#プラン制限)
- [ベストプラクティス](#ベストプラクティス)

---

## プロジェクト概要

**ClipTap** - 定型文・コードスニペットをワンタップでコピーできる超シンプルなモバイル・Webアプリ。

### コアコンセプト
- **ワンタップコピー**: 登録したテキストを即座にクリップボードへコピー
- **ローカルファースト**: オフラインで完全動作、プライバシー重視
- **超軽量UI**: 最小の操作で最大の生産性を実現
- **クロスプラットフォーム**: iOS, Android, Webで統一されたUX
- **Proプラン**: 広告なし・環境管理無制限・カスタム変数無制限（月額250円/年間3,000円）

### 主要機能
1. **ワンタップコピー** - スニペットカードをタップ→即座にクリップボードへ
2. **変数システム** - システム変数（`{{今日}}`等）とカスタム変数（`{{名前}}`等）
3. **環境管理** - 開発/本番など環境ごとに変数値を切り替え
4. **検索・フィルタリング** - 全文検索、カテゴリ・環境フィルター
5. **エクスポート・インポート** - パスワード保護 + チェックサム検証
6. **サブスクリプション** - App Store/Google Play課金（RevenueCat）

---

## プロジェクト構造

ClipTapは**npm workspaces**によるモノレポ構成で、3つの主要パッケージで構成されています：

```
clipTap/
├── apps/
│   ├── mobile/              # React Native (Expo) モバイルアプリ
│   └── web/                 # React + Vite Webアプリ
│
├── packages/
│   └── shared/              # 共有パッケージ（型定義、ビジネスロジック）
│
├── docs/                    # ドキュメント
│   ├── INDEX.md            # ドキュメントインデックス
│   ├── ARCHITECTURE.md     # アーキテクチャ全体像（このファイル）
│   ├── CODE_READING_GUIDE.md # コードリーディングガイド
│   ├── API.md              # Service/Mapper API仕様
│   ├── DATABASE.md         # データベース仕様
│   ├── DEVELOPMENT.md      # 開発セットアップガイド
│   └── CONTRIBUTING.md     # 貢献ガイドライン
│
├── package.json            # モノレポルート設定
└── CLAUDE.md               # Claude Code指示書（ルート）
```

### ディレクトリ詳細

#### apps/mobile/ (React Native Expo)
```
apps/mobile/
├── app/                     # Expo Router画面（ファイルベースルーティング）
│   ├── _layout.tsx         # ルートレイアウト（プロバイダー、テーマ、i18n）
│   ├── index.tsx           # メイン画面（スニペット一覧）
│   ├── search.tsx          # 検索画面
│   ├── webview.tsx         # WebView画面
│   ├── snippet/            # スニペット関連画面
│   │   ├── create.tsx
│   │   ├── edit.tsx
│   │   ├── content-input.tsx
│   │   ├── title-input.tsx
│   │   └── profile-select.tsx
│   ├── category/           # カテゴリ関連画面
│   │   ├── edit.tsx
│   │   └── select.tsx
│   ├── profile/            # 環境（プロファイル）関連画面
│   │   ├── edit.tsx
│   │   └── variable-edit.tsx
│   ├── variable/           # 変数関連画面
│   │   ├── edit.tsx
│   │   └── profile-value-edit.tsx
│   ├── subscription/       # サブスクリプション画面
│   │   ├── paywall.tsx
│   │   └── manage.tsx
│   └── settings/           # 設定画面
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── categories.tsx
│       ├── profiles.tsx
│       ├── variables.tsx
│       ├── export-import.tsx
│       ├── select-export-data.tsx
│       └── select-import-data.tsx
│
├── src/                     # コアライブラリ
│   ├── adapters/           # プラットフォーム固有アダプター（12個）
│   │   ├── MobileAuthAdapter.ts
│   │   ├── MobileClipboardAdapter.ts
│   │   ├── MobileCryptoAdapter.ts
│   │   ├── MobileDatabaseAdapter.ts
│   │   ├── MobileExportAdapter.ts
│   │   ├── MobileFileIOAdapter.ts
│   │   ├── MobileFilePickerAdapter.ts
│   │   ├── MobileFileShareAdapter.ts
│   │   ├── MobileI18nAdapter.ts
│   │   ├── MobileImportAdapter.ts
│   │   ├── MobileLocaleAdapter.ts
│   │   └── MobileSubscriptionAdapter.ts
│   ├── components/         # 再利用可能なコンポーネント
│   │   ├── ads/            # 広告コンポーネント（AdBanner）
│   │   ├── category/       # カテゴリUI（Badge, Filter, Modal, Picker）
│   │   ├── common/         # 共通UI（Header, Button, Input, Drawer, Modal等）
│   │   ├── import/         # インポート関連（プレビュー項目）
│   │   ├── pickers/        # Picker系（Date, Time, Number, Days, Select）
│   │   ├── profile/        # 環境関連UI（ChipSelector, Selector, Switcher）
│   │   ├── selection/      # 選択関連UI（Category, Profile, Snippet, Variable）
│   │   ├── settings/       # 設定関連UI（AccountAuth, DeveloperMenu, SubscriptionCard）
│   │   ├── snippet/        # スニペット関連UI（Card, List, Form, Variable系）
│   │   └── variable/       # 変数関連UI（VariableModal）
│   ├── constants/          # 定数定義
│   │   ├── config.ts       # RevenueCat/Auth/App Group設定
│   │   └── ui.ts           # UI定数
│   ├── database/           # SQLite管理
│   │   ├── database.ts
│   │   ├── DatabaseFileManager.ts
│   │   ├── DatabaseMigrations.ts
│   │   ├── schema.ts
│   │   └── seed.ts
│   ├── hooks/              # カスタムフック
│   │   ├── screens/        # 画面専用フック（24個）
│   │   ├── components/     # コンポーネント専用フック（14個）
│   │   ├── useRestorePurchases.ts
│   │   ├── useTracking.ts
│   │   └── index.ts
│   ├── i18n/               # i18next設定
│   │   └── config.ts
│   ├── providers/          # React Context Provider
│   │   ├── AlertProvider.tsx
│   │   └── SubscriptionProvider.tsx
│   ├── services/           # Service層
│   │   ├── PurchaseService.ts
│   │   ├── KeyboardExtensionService.ts
│   │   └── TrackingService.ts
│   ├── styles/             # スタイル定義
│   │   └── commonStyles.ts
│   ├── types/              # TypeScript型定義
│   │   ├── flashlist.ts
│   │   └── variable.ts
│   ├── utils/              # ユーティリティ関数
│   │   ├── alerts.ts
│   │   ├── clipboard.ts
│   │   ├── responsive.ts
│   │   ├── variableHelpers.ts
│   │   ├── variableLoader.ts
│   │   └── index.ts
│   ├── themeSystem.tsx     # 統合テーマシステム
│   └── logger.ts           # ロガー
│
├── ios/                     # iOS固有ファイル（Xcode）
├── android/                 # Android固有ファイル（Gradle）
└── assets/                  # 画像、フォント、Web資産
```

#### apps/web/ (React + Vite)
```
apps/web/
├── src/
│   ├── adapters/           # プラットフォーム固有アダプター（13個）
│   │   ├── WebDatabaseAdapter.ts
│   │   ├── WebDbCacheManager.ts
│   │   ├── WebClipboardAdapter.ts
│   │   ├── WebCryptoAdapter.ts
│   │   ├── WebFileIOAdapter.ts
│   │   ├── WebFilePickerAdapter.ts
│   │   ├── WebFileShareAdapter.ts
│   │   ├── WebLocaleAdapter.ts
│   │   ├── WebI18nAdapter.ts
│   │   ├── WebSubscriptionAdapter.ts
│   │   ├── WebAuthAdapter.ts
│   │   ├── WebExportAdapter.ts
│   │   ├── WebImportAdapter.ts
│   │   └── index.ts
│   ├── components/         # Reactコンポーネント
│   │   ├── auth/          # 認証（4ファイル）
│   │   ├── common/        # 共通UI（6ファイル）
│   │   ├── dashboard/     # ダッシュボード（5ファイル）
│   │   ├── snippet/       # スニペット関連（16ファイル）
│   │   ├── category/      # カテゴリ関連（5ファイル）
│   │   ├── profile/       # プロファイル関連（6ファイル）
│   │   ├── variable/      # 変数関連（7ファイル）
│   │   ├── home/          # ホーム（7ファイル）
│   │   ├── import/        # インポート関連（3ファイル）
│   │   ├── export/        # エクスポート関連（1ファイル）
│   │   ├── settings/      # 設定関連（4ファイル）
│   │   └── layout/        # レイアウト（2ファイル）
│   ├── constants/          # 定数
│   │   └── subscription.ts
│   ├── database/           # SQLite管理
│   │   ├── database.ts
│   │   └── DatabaseMigrations.ts
│   ├── hooks/              # カスタムフック
│   │   ├── screens/       # 画面専用フック（7ファイル）
│   │   ├── useAdapterInitialization.ts
│   │   ├── useAppInitialization.ts
│   │   ├── useWebImport.ts
│   │   ├── useBodyScrollLock.ts
│   │   ├── useMobileMenu.ts
│   │   └── useUnsavedChangesWarning.ts
│   ├── mappers/            # sql.jsラッパー
│   │   └── sqliteWasm.ts
│   ├── pages/              # ページコンポーネント（5画面）
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   ├── CategoryManage.tsx
│   │   ├── ProfileManage.tsx
│   │   └── VariableManage.tsx
│   ├── providers/          # React Context Provider
│   │   └── WebThemeProvider.tsx
│   ├── services/           # Service層
│   │   ├── CacheService.ts
│   │   ├── FirebaseService.ts
│   │   ├── SubscriptionService.ts
│   │   └── LoggerService.ts
│   ├── types/              # TypeScript型定義
│   ├── utils/              # ユーティリティ
│   ├── App.tsx             # メインアプリ（ルーティング）
│   ├── main.tsx            # エントリーポイント
│   ├── i18n.ts             # i18next設定
│   └── index.css           # グローバルスタイル（Tailwind）
│
├── public/                  # 静的ファイル
└── index.html              # エントリーポイント
```

#### packages/shared/ (共有パッケージ)
```
packages/shared/
├── src/
│   ├── adapters/           # アダプターインターフェース（13個）
│   │   ├── DbAdapter.ts
│   │   ├── ClipboardAdapter.ts
│   │   ├── CryptoAdapter.ts
│   │   ├── FileIOAdapter.ts
│   │   ├── FilePickerAdapter.ts
│   │   ├── FileShareAdapter.ts
│   │   ├── LocaleAdapter.ts
│   │   ├── I18nAdapter.ts
│   │   ├── SubscriptionAdapter.ts
│   │   ├── AuthAdapter.ts
│   │   ├── ExportAdapter.ts
│   │   ├── ImportAdapter.ts
│   │   ├── AdapterRegistry.ts
│   │   └── index.ts
│   ├── constants/          # 定数
│   │   ├── designTokens.ts
│   │   ├── inputLimits.ts
│   │   ├── variables.ts
│   │   └── index.ts
│   ├── database/           # スキーマ定義
│   │   ├── schema.ts
│   │   └── migrations.ts
│   ├── errors/             # カスタムエラークラス（20+種類）
│   │   ├── authErrors.ts
│   │   ├── databaseErrors.ts
│   │   ├── validationErrors.ts
│   │   ├── importExportErrors.ts
│   │   └── index.ts
│   ├── hooks/              # 共有React hooks（12個）
│   │   ├── useAdapterInitialization.ts
│   │   ├── useAppInitialization.ts
│   │   ├── useDebounce.ts
│   │   ├── useExportImportState.ts
│   │   ├── useFilteredSnippets.ts
│   │   ├── useImportSelection.ts
│   │   ├── useSearch.ts
│   │   ├── useSelection.ts
│   │   ├── useSnippetPreview.ts
│   │   ├── useSubscriptionService.ts
│   │   ├── useTranslation.ts
│   │   ├── useVariableExpansion.ts
│   │   └── index.ts
│   ├── i18n/               # 翻訳リソース
│   │   ├── ja.json
│   │   └── en.json
│   ├── mappers/            # データアクセス層（7個）
│   │   ├── SnippetMapper.ts
│   │   ├── CategoryMapper.ts
│   │   ├── ProfileMapper.ts
│   │   ├── ProfileVariableMapper.ts
│   │   ├── VariableMapper.ts
│   │   ├── ExportMapper.ts
│   │   ├── ImportMapper.ts
│   │   └── index.ts
│   ├── providers/          # React Context Provider（10個）
│   │   ├── SnippetProvider.tsx
│   │   ├── CategoryProvider.tsx
│   │   ├── ProfileProvider.tsx
│   │   ├── VariableProvider.tsx
│   │   ├── DatabaseProvider.tsx
│   │   ├── AuthProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── SubscriptionProvider.tsx
│   │   ├── AlertProvider.tsx
│   │   └── index.ts
│   ├── services/           # ビジネスロジック層（10個）
│   │   ├── SnippetService.ts
│   │   ├── CategoryService.ts
│   │   ├── ProfileService.ts
│   │   ├── VariableService.ts
│   │   ├── SubscriptionService.ts
│   │   ├── ExportService.ts
│   │   ├── ImportService.ts
│   │   ├── ImportParserService.ts
│   │   ├── AuthService.ts
│   │   ├── validFlagsUpdater.ts
│   │   └── index.ts
│   ├── types/              # TypeScript型定義（Zod schemas）
│   │   ├── snippet.ts
│   │   ├── category.ts
│   │   ├── profile.ts
│   │   ├── variableSchema.ts
│   │   ├── export.ts
│   │   ├── Auth.ts
│   │   ├── Subscription.ts
│   │   ├── alert.ts
│   │   └── index.ts
│   ├── utils/              # 共通ユーティリティ（9個）
│   │   ├── dateHelpers.ts
│   │   ├── snippetUtils.ts
│   │   ├── categoryUtils.ts
│   │   ├── snippetFilterUtils.ts
│   │   ├── exportImportUtils.ts
│   │   ├── authErrors.ts
│   │   ├── errorUtils.ts
│   │   ├── pathUtils.ts
│   │   ├── logger.ts
│   │   └── index.ts
│   ├── variables/          # 変数システム
│   │   ├── parser.ts
│   │   └── systemVariables.ts
│   ├── index.ts            # エクスポート集約
│   ├── init.ts             # 初期化モジュール
│   └── schema.ts           # Zodスキーマ再エクスポート
│
└── package.json            # 依存関係（zod, vitest）
```

---

## 技術スタック

### Mobile (apps/mobile)
| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| **フレームワーク** | React Native | 0.81.5 |
| | Expo SDK | 54 |
| | React | 19.1.0 |
| **言語** | TypeScript | 5.9.2 |
| **データベース** | expo-sqlite | 16.0.10 |
| **ナビゲーション** | Expo Router | 6.0.19 |
| **スタイリング** | StyleSheet + themeSystem | - |
| **多言語** | i18next | 25.5.2 |
| **状態管理** | React Context + Custom Hooks | - |
| **UI** | @shopify/flash-list | 2.0.2 |
| | @react-native-picker/picker | 2.11.1 |
| **クリップボード** | expo-clipboard | 8.0.7 |
| **課金** | react-native-purchases (RevenueCat) | 9.6.1 |
| **広告** | react-native-google-mobile-ads | 15.8.3 |
| **認証** | @react-native-firebase/auth | 23.5.0 |
| | expo-apple-authentication | 8.0.7 |
| | @react-native-google-signin/google-signin | 16.0.0 |
| **その他** | expo-haptics | 15.0.7 |
| | dayjs | 1.11.19 |

### Web (apps/web)
| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| **フレームワーク** | React | 19.1.0 |
| | Vite | 7.2.4 |
| **言語** | TypeScript | 5.9.3 |
| **データベース** | sql.js (SQLite WASM) | 1.13.0 |
| | idb (IndexedDB) | 8.0.3 |
| **ルーティング** | React Router DOM | 7.9.6 |
| **スタイリング** | Tailwind CSS | 4.1.17 |
| **UI** | @headlessui/react | 2.2.9 |
| **多言語** | i18next | 25.5.2 |
| | i18next-browser-languagedetector | 8.2.0 |
| **課金** | @revenuecat/purchases-js | 1.18.3 |
| **認証** | Firebase | 12.6.0 |
| **その他** | react-dropzone | 14.3.8 |

### Shared (packages/shared)
| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| **言語** | TypeScript | 5.3.3 |
| **バリデーション** | Zod | 4.1.13 |
| **テスト** | Vitest | 4.0.14 |

---

## アーキテクチャ概要

ClipTapは**3層アーキテクチャ + Adapterパターン**を採用し、関心事の分離を徹底しています。

### 全体図

```
┌─────────────────────────────────────────────────────┐
│  UI Layer (React Components)                        │
│  - Mobile: app/*.tsx, src/components/*.tsx          │
│  - Web: src/pages/*.tsx, src/components/*.tsx       │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ useSnippets(), useCategories(), etc.
                  │
┌─────────────────▼───────────────────────────────────┐
│  Business Logic Layer (Services + Hooks)            │
│  - Shared: packages/shared/src/services/*.ts        │
│  - Shared: packages/shared/src/hooks/*.ts           │
│  - Mobile: src/services/*.ts, src/hooks/screens/*.ts│
│  - Web: src/services/*.ts, src/hooks/*.ts           │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ SnippetMapper.getAll(), create(), etc.
                  │
┌─────────────────▼───────────────────────────────────┐
│  Data Access Layer (Mappers)                        │
│  - Shared: packages/shared/src/mappers/*.ts         │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ Adapter interfaces
                  │
┌─────────────────▼───────────────────────────────────┐
│  Platform Adapters                                   │
│  - Mobile: src/adapters/Mobile*.ts                  │
│  - Web: src/adapters/Web*.ts                        │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ Platform-specific APIs
                  │
┌─────────────────▼───────────────────────────────────┐
│  Database                                            │
│  - Mobile: expo-sqlite (ネイティブ)                  │
│  - Web: sql.js (WASM) + IndexedDB (キャッシュ)       │
│  - Schema: V5                                        │
└──────────────────────────────────────────────────────┘
```

### レイヤー間の責務

| レイヤー | 責務 | 禁止事項 |
|---------|------|---------|
| **UI Layer** | ユーザー操作のハンドリング、表示 | 直接DB操作、ビジネスロジック |
| **Service Layer** | ビジネスロジック、バリデーション | 直接SQL実行、UI依存 |
| **Mapper Layer** | CRUD操作、データ変換 | ビジネスロジック |
| **Adapter Layer** | プラットフォーム固有実装 | ビジネスロジック |
| **Database Layer** | データ永続化 | - |

---

## レイヤー構造

### 1. Service Layer（ビジネスロジック層）

Service層はビジネスロジックの集約地点で、以下のコアサービスで構成されます。

#### 1.1 SnippetService (packages/shared)
**責務**: スニペットのCRUD、検索、プレビュー生成、変数展開

**主要メソッド**:
- `getAll(filterByProfileId?)` - スニペット取得
- `getById(id)` - ID指定取得
- `getByCategory(categoryId, filterByProfileId?)` - カテゴリ別取得
- `create(input)` - スニペット作成
- `update(data)` - スニペット更新
- `delete(id)` - スニペット削除
- `search(query, categoryId?)` - 検索
- `getSorted(sortBy)` - ソート済み取得
- `count()` / `countByCategory(categoryId)` - 件数取得
- `getProfileIds(snippetId)` / `setProfileIds(snippetId, profileIds)` - プロファイル関連
- `getTextPreview(text, options)` - テキストプレビュー生成
- `prepareForClipboard(id, options)` - クリップボード用テキスト生成

#### 1.2 CategoryService (packages/shared)
**責務**: カテゴリのCRUD、並び替え

**主要メソッド**:
- `getAll()` - 全カテゴリ取得
- `getById(id)` / `getByName(name)` - 取得
- `create(input)` / `update(data)` / `delete(id)` - CRUD
- `reorder(orderedIds)` - 並び替え
- `count()` - 件数取得
- `upsert(data)` - 作成または更新

#### 1.3 ProfileService (packages/shared)
**責務**: 環境（プロファイル）のCRUD、アクティブ環境管理、変数値管理

**主要メソッド**:
- `getAll()` / `getAllIncludingInvalid()` - プロファイル取得
- `getActive()` / `getDefault()` - 特定プロファイル取得
- `create(input)` / `update(id, input)` / `delete(id)` - CRUD
- `setActive(id)` / `setDefault(id)` - 状態変更
- `setProfileVariable(profileId, variableId, value)` - 変数値設定
- `getProfileVariablesMap(profileId)` - 変数マップ取得
- `updateValidFlags(limit)` - 有効フラグ更新

#### 1.4 VariableService (packages/shared)
**責務**: カスタム変数のCRUD、変数解決

**主要メソッド**:
- `getAll()` / `getAllIncludingInvalid()` / `getCustomVariables()` - 変数取得
- `getById(id)` / `getByName(name)` - 取得
- `create(input)` / `update(id, input)` / `delete(id)` - CRUD
- `createCustomVariableResolver(context, options)` - リゾルバー生成
- `isNameDuplicate(name, excludeId?)` - 名前重複チェック
- `getValidCustomVariables()` - 有効カスタム変数取得
- `expandTextSync(text, options)` - 同期的テキスト展開
- `resolvePreviewText(title, content, options)` - プレビュー用テキスト解決

#### 1.5 SubscriptionService (packages/shared)
**責務**: サブスクリプション状態管理、機能制限チェック

**主要メソッド**:
- `setAdapter(adapter, options)` - アダプター設定
- `setValidFlagsUpdater(updater)` - ValidFlagsUpdater設定
- `isSubscribed()` / `isLoading()` - 状態確認
- `checkSubscription(userId?)` - サブスクリプション確認
- `canAddVariable(currentCount)` / `canAddProfile(currentCount)` - 追加可否
- `updateValidFlags()` - 有効フラグ更新
- `linkAccount(userId)` / `logout()` - アカウント連携

#### 1.6 ExportService / ImportService / ImportParserService (packages/shared)
**責務**: データのエクスポート・インポート処理

#### 1.7 AuthService (packages/shared)
**責務**: 認証状態管理、ログイン/ログアウト

**主要メソッド**:
- `signInWithGoogle()` / `signInWithApple()` - 認証
- `signOut()` - ログアウト
- `getCurrentUser()` - 現在のユーザー取得
- `onAuthStateChanged(listener)` - 認証状態変更監視

#### 1.8 Mobile固有Services
- **PurchaseService**: RevenueCat SDK操作
- **TrackingService**: トラッキング許可
- **KeyboardExtensionService**: キーボード拡張機能

---

### 2. Mapper Layer（データアクセス層）

Mapperは**packages/shared**に実装され、プラットフォーム共通のデータアクセスを提供します。

| Mapper | 責務 |
|--------|------|
| **SnippetMapper** | CRUD、プロファイルフィルタリング、検索、ソート |
| **CategoryMapper** | CRUD、名前検索、並び替え、一括作成 |
| **ProfileMapper** | CRUD、アクティブ状態管理、有効フラグ更新 |
| **ProfileVariableMapper** | 変数値CRUD、プロファイル/変数別取得 |
| **VariableMapper** | CRUD、タイプ別取得、有効フラグ更新 |
| **ExportMapper** | 部分エクスポート用一時DB操作 |
| **ImportMapper** | インポート候補取得（一時DBから） |

---

### 3. Adapter Layer（プラットフォーム抽象化層）

Adapterパターンでプラットフォーム固有実装を抽象化します。

#### インターフェース定義 (packages/shared)
- `DbAdapter` - データベース操作
- `ClipboardAdapter` - クリップボード操作
- `CryptoAdapter` - 暗号化操作
- `FileIOAdapter` - ファイルI/O
- `FilePickerAdapter` - ファイル選択
- `FileShareAdapter` - ファイル共有
- `LocaleAdapter` - ロケール取得
- `I18nAdapter` - 翻訳機能
- `SubscriptionAdapter` - サブスクリプション状態
- `AuthAdapter` - 認証
- `ExportAdapter` / `ImportAdapter` - エクスポート/インポート

#### Mobile実装 (apps/mobile/src/adapters) - 12個
| アダプター | 技術 |
|-----------|------|
| MobileDatabaseAdapter | expo-sqlite |
| MobileClipboardAdapter | expo-clipboard + haptics |
| MobileCryptoAdapter | expo-crypto |
| MobileFileIOAdapter | expo-file-system |
| MobileFilePickerAdapter | expo-document-picker |
| MobileFileShareAdapter | expo-sharing |
| MobileLocaleAdapter | expo-localization |
| MobileI18nAdapter | i18next |
| MobileSubscriptionAdapter | react-native-purchases |
| MobileAuthAdapter | @react-native-firebase/auth |
| MobileExportAdapter | エクスポート処理 |
| MobileImportAdapter | インポート処理 |

#### Web実装 (apps/web/src/adapters) - 13個
| アダプター | 技術 |
|-----------|------|
| WebDatabaseAdapter | sql.js (WASM) |
| WebDbCacheManager | IndexedDB |
| WebClipboardAdapter | navigator.clipboard |
| WebCryptoAdapter | Web Crypto API |
| WebFileIOAdapter | Blob API |
| WebFilePickerAdapter | File API |
| WebFileShareAdapter | Web Share API |
| WebLocaleAdapter | navigator.language |
| WebI18nAdapter | i18next |
| WebSubscriptionAdapter | @revenuecat/purchases-js |
| WebAuthAdapter | Firebase Web |
| WebExportAdapter | エクスポート処理 |
| WebImportAdapter | インポート処理 |

---

### 4. Hooks Layer（状態管理層）

React Context + Custom Hooksパターンで、サービス層とUI層を橋渡し。

#### 共有Hooks (packages/shared) - 12個
- `useAdapterInitialization` - アダプター初期化
- `useAppInitialization` - アプリ初期化
- `useDebounce` - デバウンス処理
- `useExportImportState` - エクスポート/インポート状態
- `useFilteredSnippets` - フィルタリング済みスニペット
- `useImportSelection` - インポート選択状態
- `useSearch` - 検索処理
- `useSelection` - 汎用選択状態管理
- `useSnippetPreview` - 変数展開プレビュー
- `useSubscriptionService` - サブスクリプションサービス
- `useTranslation` - 翻訳機能
- `useVariableExpansion` - 変数展開処理

#### 共有Providers (packages/shared) - 10個
- `SnippetProvider` / `useSnippets()`
- `CategoryProvider` / `useCategories()`
- `ProfileProvider` / `useProfiles()`
- `VariableProvider` / `useVariables()`
- `DatabaseProvider` / `useDatabase()`
- `AuthProvider` / `useAuth()`
- `ThemeProvider` / `useTheme()`
- `SubscriptionProvider` / `useSubscription()`
- `AlertProvider` / `useAlert()`

#### Mobile固有Hooks
- **Screen Hooks** (`src/hooks/screens/`) - 24個:
  - useHomeScreen, useSearchScreen
  - useSnippetFormScreen, useCategoryEditScreen, useVariableEditScreen
  - useProfileEditScreen, useProfileSelectScreen, useProfileValueEditScreen
  - useProfileVariableEditScreen, useTextInputScreen
  - useCategoriesScreen, useProfilesScreen, useVariablesScreen
  - useSettingsScreen, useExportImportScreen
  - useSelectExportDataScreen, useSelectImportDataScreen
  - usePaywallScreen, useManageSubscriptionScreen
  - useCategorySelectScreen, useWebViewScreen
  - useAdapterInitialization, useAppInitialization, useDevMenu

- **Component Hooks** (`src/hooks/components/`) - 14個:
  - useCategoryModal, useCategoryPicker
  - useDatePicker, useTimePicker, useNumberPicker, useSelectPicker
  - useDrawer, useProfileSelector, useProfileSwitcher
  - useSnippetCard, useSortMenu
  - useVariableModal, useVariablePickerModal, useVariableToolbar

#### Web固有Hooks
- `useBodyScrollLock()` - スクロールロック
- `useMobileMenu()` - モバイルメニュー
- `useUnsavedChangesWarning()` - 未保存変更警告
- `useWebImport()` - Webインポート処理
- Screen Hooks (`src/hooks/screens/`) - 7個

---

## データフロー

### 1. スニペット作成フロー

```
┌─────────────────────────────────────────────────────┐
│ 1. UI Layer: app/snippet/create.tsx                 │
│    ユーザーがフォームに入力してボタンタップ           │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ useSnippetFormScreen()
                  ▼
┌─────────────────────────────────────────────────────┐
│ 2. Screen Hook: src/hooks/screens/useSnippetFormScreen.ts │
│    const { createSnippet } = useSnippets();         │
│    await createSnippet(data);                       │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ SnippetService.create(data)
                  ▼
┌─────────────────────────────────────────────────────┐
│ 3. Service Layer: packages/shared/src/services/SnippetService.ts │
│    - バリデーション（文字数制限等）                    │
│    - Mapper呼び出し                                  │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ SnippetMapper.create(data)
                  ▼
┌─────────────────────────────────────────────────────┐
│ 4. Mapper Layer: packages/shared/src/mappers/SnippetMapper.ts │
│    - getDbAdapter().run() でSQL実行                  │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ DbAdapter.run('INSERT INTO snippets...')
                  ▼
┌─────────────────────────────────────────────────────┐
│ 5. Database: expo-sqlite / sql.js                   │
│    - snippetsテーブルにINSERT                         │
└─────────────────────────────────────────────────────┘
```

### 2. 変数展開フロー（コピー時）

```
┌─────────────────────────────────────────────────────┐
│ 1. UI Layer: components/snippet/SnippetCard.tsx     │
│    ユーザーがスニペットカードをタップ                  │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ handleCopy(snippet)
                  ▼
┌─────────────────────────────────────────────────────┐
│ 2. Hooks Layer: useSnippets().copySnippet()         │
│    - SnippetService.prepareForClipboard()           │
│    - ClipboardAdapter.copy()                        │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ VariableService.expandTextSync()
                  ▼
┌─────────────────────────────────────────────────────┐
│ 3. VariableService + parser.ts                      │
│    - テキスト内の {{変数}} を抽出                      │
│    - システム変数を dateHelpers で展開               │
│    - カスタム変数をProfileVariableから取得            │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ expandedText
                  ▼
┌─────────────────────────────────────────────────────┐
│ 4. ClipboardAdapter                                 │
│    - Mobile: expo-clipboard + Haptics.Light         │
│    - Web: navigator.clipboard.writeText()           │
└─────────────────────────────────────────────────────┘
```

---

## セキュリティとプライバシー

### 1. SQLインジェクション対策

**原則**: すべてのSQL文はプレースホルダー（`?`）を使用

```typescript
/* ❌ 危険 */
const result = db.run(`SELECT * FROM snippets WHERE title = '${userInput}'`);

/* ✅ 安全 */
const result = db.run('SELECT * FROM snippets WHERE title = ?', [userInput]);
```

### 2. エクスポートデータのセキュリティ

- **パスワードハッシュ化**: SHA-256（パスワード + スキーマバージョン）
- **チェックサム検証**: データ改竄検知

### 3. ローカルファースト設計

- すべてのデータは端末内ローカル保存
- クラウド同期なし（プライバシー重視）
- **例外**: サブスクリプション領収書検証（RevenueCat経由）

---

## プラン制限

### 無料プラン vs Proプラン

| 機能 | 無料プラン | Proプラン |
|------|-----------|----------|
| **スニペット作成** | 無制限 | 無制限 |
| **カテゴリ作成** | 無制限 | 無制限 |
| **環境（Profile）** | **3つまで** | **無制限** |
| **カスタム変数** | **5個まで** | **無制限** |
| **広告表示** | **あり** | **なし** |
| **システム変数** | 全て利用可能 | 全て利用可能 |
| **エクスポート/インポート** | 利用可能 | 利用可能 |

---

## ベストプラクティス

### 1. 新機能追加のワークフロー

1. **型定義** (packages/shared/src/types/)
2. **Mapper追加** (packages/shared/src/mappers/)
3. **Service追加** (packages/shared/src/services/)
4. **Hook追加** (packages/shared/src/hooks/)
5. **Screen Hook追加** (apps/mobile/src/hooks/screens/)
6. **UI実装** (apps/mobile/app/, src/components/)

### 2. コード共有のガイドライン

#### ✅ Shared Packageに配置すべきもの
- 型定義、Zodスキーマ
- Mapper（データアクセス）
- Service（ビジネスロジック）
- 共通Hooks
- 定数、ユーティリティ

#### ❌ プラットフォーム固有に保つもの
- Adapter実装
- UI関連（StyleSheet, Tailwind）
- Screen Hooks
- プラットフォーム固有機能

### 3. 依存性注入パターン

レイヤー間の結合度を下げるためにコールバック注入パターンを採用。

```typescript
/* インターフェース定義（packages/shared） */
interface ValidFlagsUpdater {
  updateProfileValidFlags: (limit: number) => void;
  updateVariableValidFlags: (limit: number) => void;
  getActiveProfile: () => Profile | null;
  getProfileById: (id: string) => Profile | null;
  getDefaultProfile: () => Profile | null;
  setActiveProfile: (id: string) => void;
  hasDbAdapter: () => boolean;
}

/* 使用例（apps/mobile または apps/web） */
const validFlagsUpdater: ValidFlagsUpdater = {
  updateProfileValidFlags: (limit) => ProfileMapper.updateValidFlags(limit),
  /* ... */
};
SubscriptionService.setValidFlagsUpdater(validFlagsUpdater);
```

---

## まとめ

ClipTapは**3層アーキテクチャ + Adapterパターン + モノレポ構成**で、以下の設計原則に基づいています：

1. **関心事の分離**: UI、ビジネスロジック、データアクセス、プラットフォーム抽象化の明確な分離
2. **型安全性**: TypeScript + Zodによるコンパイル時・ランタイム両方の型チェック
3. **コード共有**: 共通ロジックはShared Packageに集約
4. **ローカルファースト**: オフライン完全動作、プライバシー重視
5. **セキュリティ**: SQLインジェクション対策、データ暗号化
6. **疎結合**: 依存性注入パターンによるレイヤー間の結合度低減

**参考ドキュメント**:
- ドキュメントインデックス: [docs/INDEX.md](./INDEX.md)
- 詳細なAPI仕様: [docs/API.md](./API.md)
- データベース仕様: [docs/DATABASE.md](./DATABASE.md)
- 開発セットアップ: [docs/DEVELOPMENT.md](./DEVELOPMENT.md)
- コードリーディングガイド: [docs/CODE_READING_GUIDE.md](./CODE_READING_GUIDE.md)
