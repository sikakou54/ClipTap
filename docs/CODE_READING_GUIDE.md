# ClipTap コードリーディングガイド

**Version**: 1.2.0
**Last Updated**: 2025-12-18

このガイドは、ClipTapのコードベースを初めて読む人のために作成されました。
どのファイルから読めばいいか、どのように実装されているかを実例とともに解説します。

---

## 目次

- [コードベースの全体構造](#コードベースの全体構造)
- [アーキテクチャの基本概念](#アーキテクチャの基本概念)
- [最初に読むべきファイル](#最初に読むべきファイル)
- [プラットフォーム別ガイド](#プラットフォーム別ガイド)
- [機能別コードリーディング](#機能別コードリーディング)
- [よくある実装パターン](#よくある実装パターン)
- [ユーティリティ・ヘルパー](#ユーティリティヘルパー)
- [デバッグ時のコード追跡方法](#デバッグ時のコード追跡方法)

---

## コードベースの全体構造

ClipTapは**npm workspaces**によるモノレポ構成です。

```
clipTap/
├── apps/
│   ├── mobile/              # React Native (Expo) モバイルアプリ
│   │   ├── app/             # 画面（Expo Router）
│   │   └── src/             # コアロジック
│   │       ├── adapters/        # プラットフォーム固有アダプター（12個）
│   │       ├── components/      # UIコンポーネント
│   │       ├── database/        # SQLite管理
│   │       ├── hooks/           # Mobile専用フック
│   │       │   ├── screens/     # 画面専用フック（24個）
│   │       │   └── components/  # コンポーネント専用フック（14個）
│   │       ├── services/        # Mobile専用サービス
│   │       └── utils/           # ユーティリティ
│   └── web/                 # React + Vite Webアプリ
│       └── src/
│           ├── adapters/        # Web固有アダプター（13個）
│           ├── components/      # UIコンポーネント
│           ├── hooks/           # Web専用フック
│           │   └── screens/     # 画面専用フック（7個）
│           ├── pages/           # ページコンポーネント
│           └── services/        # Web専用サービス
├── packages/
│   └── shared/              # mobile/webで共有するコード
│       └── src/
│           ├── adapters/        # アダプターインターフェース定義（13個）
│           ├── constants/       # 共有定数
│           ├── database/        # スキーマ定義・マイグレーション
│           ├── errors/          # カスタムエラークラス（20+種類）
│           ├── hooks/           # 共有カスタムフック（12個）
│           ├── i18n/            # 翻訳リソース
│           ├── mappers/         # データアクセス層（7個）
│           ├── providers/       # React Context Provider（10個）
│           ├── services/        # ビジネスロジック層（10個）
│           ├── types/           # 型定義・Zodスキーマ
│           ├── utils/           # 共有ユーティリティ（9個）
│           └── variables/       # 変数システム
└── docs/                    # プロジェクトドキュメント
```

### 開発の優先度

| パッケージ | 用途 | 新規メンバーの学習優先度 |
|-----------|------|------------------------|
| `packages/shared` | 共通ビジネスロジック | **1. 最優先** |
| `apps/mobile` | モバイルアプリ | **2. 高** |
| `apps/web` | Webアプリ | 3. 中 |

---

## アーキテクチャの基本概念

### 3層アーキテクチャ + Adapter Pattern

ClipTapは3層アーキテクチャに**Adapter Pattern**を組み合わせています。

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Layer                                 │
│              app/*.tsx, src/components/*.tsx                 │
│                 (画面表示・ユーザー入力)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ useXxxScreen() - 画面専用フック
┌─────────────────────────────────────────────────────────────┐
│                Screen Hook Layer (Mobile/Web固有)            │
│              src/hooks/screens/*.ts                          │
│               (画面固有のビジネスロジック)                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ useSnippets(), useCategories()
┌─────────────────────────────────────────────────────────────┐
│                 Provider Layer (packages/shared)             │
│          packages/shared/src/providers/*.tsx                 │
│                (状態管理・データ操作)                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ SnippetService.create()
┌─────────────────────────────────────────────────────────────┐
│                Service Layer (packages/shared)               │
│            packages/shared/src/services/*.ts                 │
│             (バリデーション・ビジネスロジック)                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ SnippetMapper.create()
┌─────────────────────────────────────────────────────────────┐
│                Mapper Layer (packages/shared)                │
│            packages/shared/src/mappers/*.ts                  │
│                   (データアクセス抽象化)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ DbAdapter.runAsync()
┌─────────────────────────────────────────────────────────────┐
│                 Adapter Layer (apps/*/adapters)              │
│           Mobile: expo-sqlite / Web: sql.js (WASM)          │
│                 (プラットフォーム固有実装)                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database                                │
│            SQLite (Mobile) / IndexedDB+WASM (Web)           │
└─────────────────────────────────────────────────────────────┘
```

### 各レイヤーの責務

| レイヤー | 場所 | 責務 | 例 |
|---------|------|------|-----|
| **UI Layer** | `app/`, `src/components/` | 描画・ユーザー入力 | `index.tsx`, `SnippetCard.tsx` |
| **Screen Hook** | `src/hooks/screens/` | 画面固有ロジック | `useHomeScreen.ts` |
| **Provider** | `packages/shared/src/providers/` | 状態管理・データ操作 | `SnippetProvider.tsx` |
| **Service** | `packages/shared/src/services/` | バリデーション・ビジネスロジック | `SnippetService.ts` |
| **Mapper** | `packages/shared/src/mappers/` | SQLクエリ抽象化 | `SnippetMapper.ts` |
| **Adapter** | `apps/*/src/adapters/` | プラットフォーム固有実装 | `MobileDatabaseAdapter.ts` |

---

## 最初に読むべきファイル

### 1. 共有パッケージのエントリーポイント

#### `packages/shared/src/index.ts` - 共有コードの全体像

**役割**: 共有パッケージの公開API

```typescript
/* Services（ビジネスロジック） */
export { SnippetService, CategoryService, VariableService } from './services';

/* Providers（状態管理） */
export { SnippetProvider, useSnippets } from './providers';
export { CategoryProvider, useCategories } from './providers';
export { ProfileProvider, useProfiles } from './providers';

/* Mappers（データアクセス） */
export { SnippetMapper, CategoryMapper } from './mappers';

/* Adapters（インターフェース） */
export { setDbAdapter, setClipboardAdapter } from './adapters';

/* Types */
export type { Snippet, Category, Profile, Variable } from './types';
```

### 2. アダプターの初期化

#### Mobile: `apps/mobile/app/_layout.tsx`

```typescript
import { setAllAdapters } from '@cliptap/shared';
import {
  mobileDbAdapter,
  mobileClipboardAdapter,
  mobileCryptoAdapter,
} from '../src/adapters';

/* アプリ起動時にアダプターを登録 */
useEffect(() => {
  setAllAdapters({
    db: mobileDbAdapter,
    clipboard: mobileClipboardAdapter,
    crypto: mobileCryptoAdapter,
    /* ... */
  });
}, []);
```

#### Web: `apps/web/src/App.tsx`

```typescript
import { setAllAdapters } from '@cliptap/shared';
import {
  webDbAdapter,
  webClipboardAdapter,
  webCryptoAdapter,
} from './adapters';

/* 同様にアダプターを登録 */
setAllAdapters({
  db: webDbAdapter,
  clipboard: webClipboardAdapter,
  crypto: webCryptoAdapter,
  /* ... */
});
```

### 3. データフローを理解する

#### 実例: スニペット作成のフロー

**1. UI層**: `apps/mobile/app/snippet/create.tsx`

```typescript
export default function CreateSnippetScreen() {
  /* Screen Hookを使用（画面固有ロジック） */
  const { title, content, handleSave } = useSnippetFormScreen({
    mode: 'create',
  });

  return (
    <SnippetFormScreen
      title={title}
      content={content}
      onSave={handleSave}
    />
  );
}
```

**2. Screen Hook層**: `src/hooks/screens/useSnippetFormScreen.ts`

```typescript
export function useSnippetFormScreen({ mode, snippetId }) {
  /* Provider経由でデータ操作 */
  const { createSnippet, updateSnippet } = useSnippets();
  const [title, setTitle] = useState('');

  const handleSave = useCallback(async () => {
    try {
      await createSnippet({ title, content });
      router.back();
    } catch (error) {
      if (error instanceof ClipTapError) {
        showErrorAlert(t(error.code));
      }
    }
  }, [title, content]);

  return { title, content, handleSave };
}
```

**3. Provider層**: `packages/shared/src/providers/SnippetProvider.tsx`

```typescript
const createSnippet = useCallback(async (input: CreateSnippetInput) => {
  /* Serviceを呼び出し */
  const newSnippet = await SnippetService.create(input);
  setSnippets((prev) => [...prev, newSnippet]);
  return newSnippet;
}, []);
```

**4. Service層**: `packages/shared/src/services/SnippetService.ts`

```typescript
class SnippetServiceClass {
  async create(input: CreateSnippetInput): Promise<Snippet> {
    /* バリデーション */
    if (!input.content?.trim()) {
      throw new EmptyContentError();
    }
    /* Mapperを呼び出し */
    return await SnippetMapper.create(input);
  }
}
```

**5. Mapper層**: `packages/shared/src/mappers/SnippetMapper.ts`

```typescript
class SnippetMapperClass {
  async create(input: CreateSnippetInput): Promise<Snippet> {
    /* Adapterを使用してSQL実行 */
    const db = getDbAdapter();
    const result = await db.runAsync(
      `INSERT INTO snippets (title, content) VALUES (?, ?)`,
      [input.title, input.content]
    );
    return this.getById(result.lastInsertRowId);
  }
}
```

---

## プラットフォーム別ガイド

### Mobile (apps/mobile)

#### ディレクトリ構造

```
apps/mobile/
├── app/                          # Expo Router 画面
│   ├── _layout.tsx              # ルートレイアウト
│   ├── index.tsx                # ホーム画面
│   ├── search.tsx               # 検索画面
│   ├── webview.tsx              # WebView画面
│   ├── snippet/                 # スニペット関連画面（5ファイル）
│   │   ├── create.tsx
│   │   ├── edit.tsx
│   │   ├── preview.tsx
│   │   ├── select-category.tsx
│   │   └── select-profile.tsx
│   ├── category/                # カテゴリ関連画面（2ファイル）
│   ├── variable/                # 変数関連画面（2ファイル）
│   ├── profile/                 # プロファイル関連画面（2ファイル）
│   ├── subscription/            # サブスクリプション画面（2ファイル）
│   └── settings/                # 設定関連画面（8ファイル）
├── src/                         # コアロジック
│   ├── adapters/               # プラットフォーム固有アダプター（12個）
│   │   ├── MobileDatabaseAdapter.ts
│   │   ├── MobileClipboardAdapter.ts
│   │   ├── MobileCryptoAdapter.ts
│   │   ├── MobileFileIOAdapter.ts
│   │   ├── MobileFilePickerAdapter.ts
│   │   ├── MobileFileShareAdapter.ts
│   │   ├── MobileLocaleAdapter.ts
│   │   ├── MobileI18nAdapter.ts
│   │   ├── MobileSubscriptionAdapter.ts
│   │   ├── MobileAuthAdapter.ts
│   │   ├── MobileExportAdapter.ts
│   │   └── MobileImportAdapter.ts
│   ├── components/              # UIコンポーネント
│   │   ├── ads/                # 広告コンポーネント（2ファイル）
│   │   ├── category/           # カテゴリ関連（5ファイル）
│   │   ├── common/             # 汎用コンポーネント（9ファイル）
│   │   ├── import/             # インポート関連（5ファイル）
│   │   ├── pickers/            # Picker系（6ファイル）
│   │   ├── profile/            # プロファイル関連（4ファイル）
│   │   ├── selection/          # 選択関連（5ファイル）
│   │   ├── settings/           # 設定関連（5ファイル）
│   │   ├── snippet/            # スニペット関連（10ファイル）
│   │   └── variable/           # 変数関連（2ファイル）
│   ├── constants/               # 定数（2ファイル）
│   ├── database/                # SQLite管理（5ファイル）
│   ├── hooks/
│   │   ├── screens/            # 画面専用フック（24個）
│   │   ├── components/         # コンポーネント専用フック（14個）
│   │   ├── usePicker.ts        # Picker共通フック
│   │   ├── useKeyboardAwareBottomPadding.ts
│   │   └── useSubscription.tsx
│   ├── i18n/                    # i18next設定（1ファイル）
│   ├── providers/               # Mobile専用Provider（2ファイル）
│   ├── services/                # Mobile専用サービス（3ファイル）
│   ├── styles/                  # スタイル定義（1ファイル）
│   ├── types/                   # 型定義（2ファイル）
│   ├── utils/                   # ユーティリティ（6ファイル）
│   ├── themeSystem.tsx          # テーマシステム
│   └── logger.ts                # ロガー
```

#### Mobile固有アダプター（12個）

| アダプター | 用途 |
|-----------|------|
| `MobileDatabaseAdapter` | expo-sqlite（メインDB、マネージDB、一時DB） |
| `MobileClipboardAdapter` | expo-clipboard + expo-haptics |
| `MobileCryptoAdapter` | expo-crypto |
| `MobileFileIOAdapter` | expo-file-system |
| `MobileFilePickerAdapter` | expo-document-picker |
| `MobileFileShareAdapter` | expo-sharing |
| `MobileLocaleAdapter` | expo-localization |
| `MobileI18nAdapter` | i18next翻訳機能 |
| `MobileSubscriptionAdapter` | react-native-purchases (RevenueCat) |
| `MobileAuthAdapter` | @react-native-firebase/auth |
| `MobileExportAdapter` | エクスポート処理 |
| `MobileImportAdapter` | インポート処理 |

#### Mobile Screen Hooks（24個）

| フック | 用途 |
|--------|------|
| `useHomeScreen` | ホーム画面ロジック |
| `useSearchScreen` | 検索画面ロジック |
| `useSnippetFormScreen` | スニペット作成/編集画面 |
| `useTextInputScreen` | テキスト入力画面 |
| `useCategoriesScreen` | カテゴリ管理画面 |
| `useCategoryEditScreen` | カテゴリ編集画面 |
| `useCategorySelectScreen` | カテゴリ選択画面 |
| `useProfilesScreen` | プロファイル管理画面 |
| `useProfileEditScreen` | プロファイル編集画面 |
| `useProfileSelectScreen` | プロファイル選択画面 |
| `useProfileValueEditScreen` | プロファイル変数値編集画面 |
| `useProfileVariableEditScreen` | プロファイル変数編集画面 |
| `useVariablesScreen` | 変数管理画面 |
| `useVariableEditScreen` | 変数編集画面 |
| `useSettingsScreen` | 設定画面 |
| `useExportImportScreen` | エクスポート/インポート画面 |
| `useSelectExportDataScreen` | エクスポートデータ選択画面 |
| `useSelectImportDataScreen` | インポートデータ選択画面 |
| `usePaywallScreen` | サブスクリプション購入画面 |
| `useManageSubscriptionScreen` | サブスクリプション管理画面 |
| `useWebViewScreen` | WebView画面 |
| `useAdapterInitialization` | アダプター初期化 |
| `useAppInitialization` | アプリ初期化 |
| `useDevMenu` | 開発者メニュー |

### Web (apps/web)

#### ディレクトリ構造

```
apps/web/src/
├── adapters/                    # プラットフォーム固有アダプター（13個）
│   ├── WebDatabaseAdapter.ts        # sql.js (WASM)
│   ├── WebDbCacheManager.ts         # IndexedDB永続化
│   ├── WebClipboardAdapter.ts       # navigator.clipboard
│   ├── WebCryptoAdapter.ts          # Web Crypto API
│   ├── WebFileIOAdapter.ts          # Blob API
│   ├── WebFilePickerAdapter.ts      # File API
│   ├── WebFileShareAdapter.ts       # Web Share API
│   ├── WebLocaleAdapter.ts          # navigator.language
│   ├── WebI18nAdapter.ts            # i18next翻訳機能
│   ├── WebSubscriptionAdapter.ts    # @revenuecat/purchases-js
│   ├── WebAuthAdapter.ts            # Firebase Web
│   ├── WebExportAdapter.ts          # エクスポート処理
│   ├── WebImportAdapter.ts          # インポート処理
│   └── index.ts                     # エクスポート
├── components/                  # Reactコンポーネント
│   ├── auth/                   # 認証関連（4ファイル）
│   ├── common/                 # 共通UI（6ファイル）
│   ├── dashboard/              # ダッシュボード（5ファイル）
│   ├── snippet/                # スニペット関連（16ファイル）
│   ├── category/               # カテゴリ関連（5ファイル）
│   ├── profile/                # プロファイル関連（6ファイル）
│   ├── variable/               # 変数関連（7ファイル）
│   ├── home/                   # ホーム画面（7ファイル）
│   ├── import/                 # インポート関連（3ファイル）
│   ├── export/                 # エクスポート関連（1ファイル）
│   ├── settings/               # 設定関連（4ファイル）
│   └── layout/                 # レイアウト（2ファイル）
├── constants/                   # 定数（1ファイル）
├── database/                    # SQLite管理（3ファイル）
│   ├── database.ts             # DB初期化
│   └── DatabaseMigrations.ts   # マイグレーション
├── hooks/
│   ├── screens/                # 画面専用フック（7個）
│   │   ├── useDashboardScreen.ts
│   │   ├── useCategoryManageScreen.ts
│   │   ├── useProfileManageScreen.ts
│   │   ├── useVariableManageScreen.ts
│   │   ├── useImportScreen.ts
│   │   ├── useExportScreen.ts
│   │   └── useHomeScreen.ts
│   ├── useBodyScrollLock.ts
│   ├── useMobileMenu.ts
│   ├── useUnsavedChangesWarning.ts
│   └── useWebKeyboardShortcuts.ts
├── mappers/                     # sql.jsラッパー（1ファイル）
├── pages/                       # ページコンポーネント（5ファイル）
│   ├── Home.tsx                # 初期設定画面
│   ├── Dashboard.tsx           # メイン画面
│   ├── CategoryManage.tsx
│   ├── ProfileManage.tsx
│   └── VariableManage.tsx
├── providers/                   # Web固有Provider（4ファイル）
├── services/                    # Web専用サービス（4ファイル）
├── types/                       # 型定義（1ファイル）
├── utils/                       # ユーティリティ（1ファイル）
├── App.tsx                      # メインアプリ
├── main.tsx                     # エントリーポイント
├── i18n.ts                      # i18next設定
└── index.css                    # グローバルスタイル（Tailwind CSS）
```

#### Web固有アダプター（13個）

| アダプター | 用途 |
|-----------|------|
| `WebDatabaseAdapter` | sql.js (WASM)（メインDB、一時DB） |
| `WebDbCacheManager` | IndexedDB永続化 |
| `WebClipboardAdapter` | navigator.clipboard |
| `WebCryptoAdapter` | Web Crypto API |
| `WebFileIOAdapter` | Blob API |
| `WebFilePickerAdapter` | File API |
| `WebFileShareAdapter` | Web Share API |
| `WebLocaleAdapter` | navigator.language |
| `WebI18nAdapter` | i18next翻訳機能 |
| `WebSubscriptionAdapter` | @revenuecat/purchases-js |
| `WebAuthAdapter` | Firebase Web |
| `WebExportAdapter` | エクスポート処理 |
| `WebImportAdapter` | インポート処理 |

#### Tailwind CSS v4 カスタムテーマ

```css
/* apps/web/src/index.css */
@theme {
  --color-surface-primary: #1a1a1a;
  --color-surface-secondary: #2a2a2a;
  --color-surface-tertiary: #3a3a3a;
  --color-text-primary: #ffffff;
  --color-text-secondary: #d0d0d0;
  --color-text-muted: #a0a0a0;
  --color-border-default: #2a2a2a;
  --color-accent-primary: #4fd1c5;
}
```

使用例:
```tsx
<div className="bg-surface-primary text-text-primary border-border-default">
```

### Shared Package (packages/shared)

#### ディレクトリ構造

```
packages/shared/src/
├── adapters/                    # アダプターインターフェース（13個）
│   ├── AuthAdapter.ts
│   ├── ClipboardAdapter.ts
│   ├── CryptoAdapter.ts
│   ├── DatabaseAdapter.ts
│   ├── ExportAdapter.ts
│   ├── FileIOAdapter.ts
│   ├── FilePickerAdapter.ts
│   ├── FileShareAdapter.ts
│   ├── I18nAdapter.ts
│   ├── ImportAdapter.ts
│   ├── LocaleAdapter.ts
│   ├── SubscriptionAdapter.ts
│   └── index.ts
├── constants/                   # 共有定数
│   ├── designTokens.ts         # デザイントークン
│   ├── inputLimits.ts          # 入力制限
│   ├── timing.ts               # タイミング定数
│   └── variables.ts            # 変数関連定数
├── database/                    # スキーマ定義
│   ├── schema.ts               # テーブルスキーマ（V5）
│   └── migrations.ts           # マイグレーション履歴
├── errors/                      # カスタムエラークラス（20+種類）
│   ├── index.ts                # エクスポート
│   ├── ValidationError.ts
│   ├── DatabaseError.ts
│   └── ...
├── hooks/                       # 共有カスタムフック（12個）
│   ├── useAdapterInitialization.ts
│   ├── useAppInitialization.ts
│   ├── useDebounce.ts
│   ├── useExportImportState.ts
│   ├── useFilteredSnippets.ts
│   ├── useImportSelection.ts
│   ├── useSearch.ts
│   ├── useSelection.ts
│   ├── useSnippetPreview.ts
│   ├── useSubscriptionService.ts
│   ├── useTranslation.ts
│   └── useVariableExpansion.ts
├── i18n/                        # 翻訳リソース
│   ├── ja.json                 # 日本語
│   └── en.json                 # 英語
├── mappers/                     # データアクセス層（7個）
│   ├── SnippetMapper.ts
│   ├── CategoryMapper.ts
│   ├── ProfileMapper.ts
│   ├── ProfileVariableMapper.ts
│   ├── VariableMapper.ts
│   ├── ExportMapper.ts
│   └── ImportMapper.ts
├── providers/                   # React Context Provider（10個）
│   ├── SnippetProvider.tsx
│   ├── CategoryProvider.tsx
│   ├── ProfileProvider.tsx
│   ├── VariableProvider.tsx
│   ├── DatabaseProvider.tsx
│   ├── AuthProvider.tsx
│   ├── ThemeProvider.tsx
│   ├── SubscriptionProvider.tsx
│   ├── AlertProvider.tsx
│   └── index.ts
├── services/                    # ビジネスロジック層（10個）
│   ├── SnippetService.ts
│   ├── CategoryService.ts
│   ├── ProfileService.ts
│   ├── VariableService.ts
│   ├── SubscriptionService.ts
│   ├── ExportService.ts
│   ├── ImportService.ts
│   ├── ImportParserService.ts
│   ├── AuthService.ts
│   └── validFlagsUpdater.ts
├── types/                       # 型定義
│   ├── index.ts                # メイン型エクスポート
│   ├── snippet.ts
│   ├── category.ts
│   ├── profile.ts
│   ├── variable.ts
│   └── subscription.ts
├── utils/                       # 共有ユーティリティ（9個）
│   ├── checksum.ts             # チェックサム計算
│   ├── dateFormatter.ts        # 日付フォーマット
│   ├── exportImportUtils.ts    # エクスポート/インポート共通処理
│   ├── format.ts               # 汎用フォーマット
│   ├── Logger.ts               # ログ出力
│   ├── orderUtils.ts           # 並び順ユーティリティ
│   ├── sortOrders.ts           # ソート順定義
│   ├── timeZone.ts             # タイムゾーン処理
│   └── uuidGenerator.ts        # UUID生成
├── variables/                   # 変数システム
│   ├── parser.ts               # 変数解析
│   ├── systemVariables.ts      # システム変数定義
│   └── types.ts                # 変数型定義
├── index.ts                     # メインエクスポート
├── init.ts                      # 初期化モジュール
└── schema.ts                    # Zodスキーマ再エクスポート
```

---

## 機能別コードリーディング

### 機能1: ワンタップコピー

**エントリーポイント**: `src/components/snippet/SnippetCard.tsx`

**追跡するファイル**:

1. `packages/shared/src/providers/SnippetProvider.tsx` - `copySnippet(id)`
2. `packages/shared/src/services/SnippetService.ts` - `copyToClipboard(id)`
3. `packages/shared/src/variables/parser.ts` - 変数展開
4. `apps/mobile/src/adapters/MobileClipboardAdapter.ts` - クリップボード操作

### 機能2: 変数システム

**システム変数の例**: `{{今日}}` → `2025-12-17`

**追跡するファイル**:

1. `packages/shared/src/variables/parser.ts` - 変数解析
2. `packages/shared/src/variables/systemVariables.ts` - システム変数定義
3. `packages/shared/src/services/VariableService.ts` - カスタム変数管理
4. `apps/mobile/src/utils/variableLoader.ts` - UI用変数オプション生成

### 機能3: エクスポート/インポート

**追跡するファイル**:

1. `packages/shared/src/services/ExportService.ts` - エクスポートロジック
2. `packages/shared/src/services/ImportParserService.ts` - インポート解析
3. `apps/mobile/src/adapters/MobileExportAdapter.ts`, `MobileImportAdapter.ts` - Mobile実装
4. `apps/web/src/adapters/WebExportAdapter.ts`, `WebImportAdapter.ts` - Web実装

### 機能4: サブスクリプション（Pro機能）

**追跡するファイル**:

1. `packages/shared/src/services/SubscriptionService.ts` - サブスクリプションロジック
2. `packages/shared/src/providers/SubscriptionProvider.tsx` - 状態管理
3. `apps/mobile/src/adapters/MobileSubscriptionAdapter.ts` - RevenueCat (Mobile)
4. `apps/web/src/adapters/WebSubscriptionAdapter.ts` - RevenueCat (Web)

---

## よくある実装パターン

### パターン1: Mapper経由のDB操作（必須）

❌ **やってはいけない**: 直接SQL実行

```typescript
/* NG: Service層で直接SQL実行 */
const db = getDbAdapter();
const result = await db.runAsync('SELECT * FROM snippets');
```

✅ **正しい**: Mapper経由でアクセス

```typescript
/* OK: Mapperを使用 */
import { SnippetMapper } from '@cliptap/shared';
const snippets = await SnippetMapper.getAll();
```

### パターン2: Screen Hook パターン

✅ **推奨**: 画面固有のビジネスロジックはScreen Hookに分離

```typescript
/* src/hooks/screens/useHomeScreen.ts */
export function useHomeScreen(): UseHomeScreenReturn {
  /* ======================================== */
  /* Hooks & コンテキスト                      */
  /* ======================================== */
  const { t } = useTranslation();
  const router = useRouter();

  /* ======================================== */
  /* データ取得（Provider経由）                */
  /* ======================================== */
  const { snippets, copySnippet, deleteSnippet } = useSnippets();
  const { categories } = useCategories();

  /* ======================================== */
  /* 状態管理                                  */
  /* ======================================== */
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  /* ======================================== */
  /* イベントハンドラ                          */
  /* ======================================== */
  const handleCopySnippet = useCallback(async (snippet: Snippet) => {
    try {
      await copySnippet(snippet.id);
    } catch (error) {
      showError(t('error.generic'));
    }
  }, [copySnippet, t]);

  /* ======================================== */
  /* 戻り値                                    */
  /* ======================================== */
  return {
    snippets,
    categories,
    selectedCategoryId,
    handleCopySnippet,
  };
}
```

### パターン3: createContextWithHook パターン

Context + Provider + Hook を一括生成:

```typescript
/* src/utils/createContext.tsx の使用例 */
import { createContextWithHook } from '../utils/createContext';

interface ThemeContextValue {
  isDark: boolean;
  toggle: () => void;
}

const [ThemeProvider, useTheme] = createContextWithHook<ThemeContextValue>(
  'Theme',
  () => {
    const [isDark, setIsDark] = useState(false);
    return {
      isDark,
      toggle: () => setIsDark((prev) => !prev),
    };
  }
);

/* 使用 */
<ThemeProvider>
  <App />
</ThemeProvider>;

const { isDark, toggle } = useTheme();
```

### パターン4: usePicker パターン

Picker系コンポーネント共通の状態管理:

```typescript
/* src/hooks/usePicker.ts の使用例 */
import { usePicker } from '../hooks/usePicker';

function DatePickerComponent({ value, onChange }) {
  const {
    showPicker,
    tempValue,
    openPicker,
    handleConfirm,
    handleCancel,
    setTempValue,
  } = usePicker({ value, onChange });

  return (
    <>
      <TouchableOpacity onPress={openPicker}>
        <Text>{formatDate(value)}</Text>
      </TouchableOpacity>
      <Modal visible={showPicker}>
        <DatePicker value={tempValue} onChange={setTempValue} />
        <Button onPress={handleConfirm}>確定</Button>
        <Button onPress={handleCancel}>キャンセル</Button>
      </Modal>
    </>
  );
}
```

### パターン5: エラーハンドリング（throw + catch）

```typescript
/* Service層: カスタムエラーをthrow */
class SnippetServiceClass {
  async create(input: CreateSnippetInput): Promise<Snippet> {
    if (!input.content?.trim()) {
      throw new EmptyContentError(); /* packages/shared/src/errors/ */
    }
    return await SnippetMapper.create(input);
  }
}

/* Screen Hook層: try/catchでエラーをキャッチ */
const handleSave = useCallback(async () => {
  try {
    await createSnippet(input);
    router.back();
  } catch (error) {
    if (error instanceof ClipTapError) {
      showErrorAlert(t(error.code)); /* i18nキーで翻訳 */
    } else {
      showErrorAlert(t('error.generic'));
    }
  }
}, [input]);
```

### パターン6: i18next経由の多言語対応（必須）

❌ **やってはいけない**: ハードコードされた文字列

```typescript
showToast('スニペットをコピーしました');
```

✅ **正しい**: i18next経由

```typescript
const { t } = useTranslation();
showToast(t('snippet.copied'));
```

### パターン7: テーマシステム経由のカラー指定（必須）

#### Mobile: themeSystem

```typescript
const { theme } = useTheme();
<View style={{ backgroundColor: theme.colors.background }} />;
```

#### Web: Tailwind CSS カスタムテーマ

```tsx
<div className="bg-surface-primary text-text-primary" />
```

### パターン8: FlashList使用（FlatList禁止）

```typescript
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={snippets}
  estimatedItemSize={100} /* 必須 */
  renderItem={({ item }) => <SnippetCard snippet={item} />}
/>;
```

---

## ユーティリティ・ヘルパー

### Mobile専用ユーティリティ (`apps/mobile/src/utils/`)

| ファイル | 用途 |
|---------|------|
| `alerts.ts` | `showErrorAlert()`, `showWarningAlert()` |
| `clipboard.ts` | クリップボード操作 |
| `createContext.tsx` | Context生成ファクトリ |
| `responsive.ts` | レスポンシブ対応 |
| `variableHelpers.ts` | 変数ヘルパー |
| `variableLoader.ts` | 変数オプション生成 |

### 共有ユーティリティ (`packages/shared/src/utils/`)

| ファイル | 用途 |
|---------|------|
| `checksum.ts` | チェックサム計算 |
| `dateFormatter.ts` | 日付フォーマット |
| `exportImportUtils.ts` | エクスポート/インポート共通処理 |
| `format.ts` | 汎用フォーマット |
| `Logger.ts` | ログ出力 |
| `orderUtils.ts` | 並び順ユーティリティ |
| `sortOrders.ts` | ソート順定義 |
| `timeZone.ts` | タイムゾーン処理 |
| `uuidGenerator.ts` | UUID生成 |

---

## デバッグ時のコード追跡方法

### 方法1: Loggerを使った追跡（推奨）

```typescript
import { Logger } from '@cliptap/shared';

Logger.debug('SnippetService.create called', { input });
Logger.info('Snippet created successfully', { id: snippet.id });
Logger.warn('Variable replacement failed', { error });
Logger.error('Failed to create snippet', { error });
```

### 方法2: React DevToolsでの状態確認

1. Expo開発サーバー起動中に `shift + m` でメニュー表示
2. `Open React DevTools` を選択
3. Components タブでコンポーネント階層と状態を確認

### 方法3: SQLiteデータベースの確認

```bash
# iOS シミュレーターの場合
cd ~/Library/Developer/CoreSimulator/Devices/[DEVICE_ID]/data/Containers/Data/Application/[APP_ID]/Documents/SQLite/
sqlite3 cliptap.db

# データベース内容確認
sqlite> .tables
sqlite> SELECT * FROM snippets;
```

---

## 実践演習: 新機能追加の流れ

### 例: 「スニペットにタグ機能を追加する」

**Step 1**: 型定義（`packages/shared/src/types/tag.ts`）

```typescript
export interface Tag {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
}
```

**Step 2**: エラークラス作成（`packages/shared/src/errors/index.ts`）

```typescript
export class TagNameRequiredError extends ValidationError {
  constructor() {
    super('Tag name is required', 'error.tag_name_required', 'warning');
  }
}
```

**Step 3**: Mapper作成（`packages/shared/src/mappers/TagMapper.ts`）

```typescript
class TagMapperClass {
  async getAll(): Promise<Tag[]> {
    const db = getDbAdapter();
    const rows = await db.getAllAsync('SELECT * FROM tags');
    return rows.map(this.toEntity);
  }

  async create(input: CreateTagInput): Promise<Tag> {
    const db = getDbAdapter();
    const id = generateUUID();
    await db.runAsync(
      'INSERT INTO tags (id, name, color) VALUES (?, ?, ?)',
      [id, input.name, input.color]
    );
    return this.getById(id);
  }
}

export const TagMapper = new TagMapperClass();
```

**Step 4**: Service作成（`packages/shared/src/services/TagService.ts`）

```typescript
class TagServiceClass {
  async create(input: CreateTagInput): Promise<Tag> {
    if (!input.name?.trim()) {
      throw new TagNameRequiredError();
    }
    return await TagMapper.create(input);
  }
}

export const TagService = new TagServiceClass();
```

**Step 5**: Provider作成（`packages/shared/src/providers/TagProvider.tsx`）

```typescript
export function TagProvider({ children }: PropsWithChildren) {
  const [tags, setTags] = useState<Tag[]>([]);

  const createTag = useCallback(async (input: CreateTagInput) => {
    const newTag = await TagService.create(input);
    setTags((prev) => [...prev, newTag]);
    return newTag;
  }, []);

  return (
    <TagContext.Provider value={{ tags, createTag }}>
      {children}
    </TagContext.Provider>
  );
}

export const useTags = () => useContext(TagContext);
```

**Step 6**: Screen Hook作成（`apps/mobile/src/hooks/screens/useTagEditScreen.ts`）

```typescript
export function useTagEditScreen(): UseTagEditScreenReturn {
  const { t } = useTranslation();
  const { createTag } = useTags();
  const [tagName, setTagName] = useState('');

  const handleSave = useCallback(async () => {
    try {
      await createTag({ name: tagName.trim() });
      router.back();
    } catch (error) {
      if (error instanceof ClipTapError) {
        showErrorAlert(t(error.code));
      }
    }
  }, [tagName, createTag, t]);

  return { tagName, setTagName, handleSave };
}
```

**Step 7**: UI実装（`apps/mobile/app/settings/tags/edit.tsx`）

```typescript
export default function TagEditScreen() {
  const { tagName, setTagName, handleSave } = useTagEditScreen();

  return (
    <View>
      <TextInput value={tagName} onChangeText={setTagName} />
      <Button title={t('common.save')} onPress={handleSave} />
    </View>
  );
}
```

---

## まとめ

### コードリーディングのコツ

1. **packages/sharedから始める**: 共有ビジネスロジックを最初に理解
2. **トップダウンで読む**: UI → Screen Hook → Provider → Service → Mapper
3. **Adapterパターンを理解する**: プラットフォーム固有実装の分離方法
4. **似た機能を参照する**: 既存の実装パターンを真似る

### 新しいアーキテクチャのポイント

| ポイント | 説明 |
|---------|------|
| **共有パッケージ** | Services, Mappers, Providers, Hooksは `packages/shared` に配置 |
| **Adapter Pattern** | プラットフォーム固有実装は `adapters/` に分離 |
| **Screen Hook** | 画面固有ロジックを `src/hooks/screens/` に分離（Mobile: 24個、Web: 7個） |
| **Component Hook** | コンポーネント固有ロジックを `src/hooks/components/` に分離（Mobile: 14個） |
| **Provider Pattern** | 状態管理を `packages/shared/src/providers/` に集約（10個） |
| **createContextWithHook** | Context + Provider + Hook を一括生成 |
| **usePicker** | Picker系の共通状態管理 |

### 困ったときは

- [ARCHITECTURE.md](./ARCHITECTURE.md) でアーキテクチャ全体像を確認
- [API.md](./API.md) で使用しているAPIの仕様を確認
- [CLAUDE.md](../CLAUDE.md) でコーディング規約を確認

**Happy Code Reading!**
