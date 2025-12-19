# ClipTap API 仕様書

**Version**: 1.2.0
**Last Updated**: 2025-12-18

> このドキュメントは共有パッケージ（packages/shared）とプラットフォーム固有APIの仕様書です。

---

## 目次

- [概要](#概要)
- [アーキテクチャ](#アーキテクチャ)
- [Provider API](#provider-api)
- [Service層 API](#service層-api)
- [Mapper層 API](#mapper層-api)
- [Hooks API](#hooks-api)
- [Adapter層 API](#adapter層-api)
- [型定義](#型定義)
- [エラー型](#エラー型)
- [定数](#定数)

---

## 概要

ClipTapのAPIは、**3層アーキテクチャ + Provider Pattern + Adapter Pattern**で設計されています。
ビジネスロジック（Service/Mapper/Hooks）は`packages/shared`に配置され、Mobile/Webで共有されます。

### APIの階層構造

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Layer                                 │
│              app/*.tsx, components/*.tsx                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ useSnippets(), useCategories()
┌─────────────────────────────────────────────────────────────┐
│              Provider Layer (packages/shared)                │
│         packages/shared/src/providers/*.tsx                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ SnippetService.create()
┌─────────────────────────────────────────────────────────────┐
│              Service Layer (packages/shared)                 │
│         packages/shared/src/services/*.ts                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ SnippetMapper.create()
┌─────────────────────────────────────────────────────────────┐
│              Mapper Layer (packages/shared)                  │
│         packages/shared/src/mappers/*.ts                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ DbAdapter.run()
┌─────────────────────────────────────────────────────────────┐
│              Adapter Layer (プラットフォーム固有)             │
│         apps/mobile/src/adapters/*.ts                        │
│         apps/web/src/adapters/*.ts                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database                                │
│         SQLite (Mobile) / sql.js + IndexedDB (Web)          │
└─────────────────────────────────────────────────────────────┘
```

### 依存関係のルール

1. **UI層はProvider層のみを参照**（Service/Mapperに直接アクセス禁止）
2. **Provider層はService層を参照**
3. **Service層はMapper層のみを参照**（直接SQLを書くのは禁止）
4. **Mapper層はAdapter層のみを参照**
5. **Adapter層はプラットフォーム固有実装を提供**

---

## Provider API

Provider層は、UIコンポーネントからデータにアクセスするためのReact Contextを提供します。

### SnippetProvider / useSnippets()

スニペットのグローバル状態を管理するProvider。

**ファイル**: `packages/shared/src/providers/SnippetProvider.tsx`

```typescript
interface SnippetContextValue {
  /** 全スニペット一覧（フィルタリングなし） */
  allSnippets: Snippet[];
  /** スニペット-プロファイル関連 */
  snippetProfiles: SnippetProfile[];
  /** データ読み込み中フラグ */
  loading: boolean;
  /** エラー情報 */
  error: Error | null;
  /** データ再読み込み関数 */
  refresh: () => void;
  /** スニペット作成 */
  createSnippet: (input: CreateSnippetInput) => Snippet;
  /** スニペット更新 */
  updateSnippet: (input: UpdateSnippetInput) => Snippet;
  /** スニペット削除 */
  deleteSnippet: (id: string) => void;
  /** クリップボードにコピー（変数展開込み） */
  copySnippet: (id: string, profileId?: string) => Promise<void>;
  /** テキストプレビュー生成（変数展開後） */
  getTextPreview: (content: string) => Promise<string>;
  /** ID指定で取得 */
  getById: (id: string) => Snippet | null;
  /** プロファイルID一覧を取得 */
  getProfileIds: (snippetId: string) => string[];
  /** プレビュー生成（変数展開後） */
  getPreview: (id: string, profileId?: string) => Promise<string>;
  /** クリップボード用テキスト準備 */
  prepareForClipboard: (id: string, profileId?: string) => Promise<string>;
}
```

---

### CategoryProvider / useCategories()

カテゴリのグローバル状態を管理するProvider。

**ファイル**: `packages/shared/src/providers/CategoryProvider.tsx`

```typescript
interface CategoryContextValue {
  /** カテゴリ一覧（sortOrder順） */
  categories: Category[];
  /** データ読み込み中フラグ */
  loading: boolean;
  /** エラー情報 */
  error: Error | null;
  /** データ再読み込み関数 */
  refresh: () => void;
  /** カテゴリ作成 */
  createCategory: (input: CreateCategoryInput) => Category;
  /** カテゴリ更新 */
  updateCategory: (input: UpdateCategoryInput) => Category;
  /** カテゴリ削除（紐づくスニペットのcategoryIdはnullに） */
  deleteCategory: (id: string) => void;
  /** カテゴリ並び替え */
  reorderCategories: (categoryIds: string[]) => void;
  /** IDで取得 */
  getById: (id: string) => Category | null;
  /** 名前で取得 */
  getByName: (name: string) => Category | null;
}
```

---

### ProfileProvider / useProfiles()

プロファイル（環境）のグローバル状態を管理するProvider。

**ファイル**: `packages/shared/src/providers/ProfileProvider.tsx`

```typescript
interface ProfileContextValue {
  /** プロファイル一覧（無効なものも含む） */
  profiles: Profile[];
  /** プロファイル変数一覧 */
  profileVariables: ProfileVariable[];
  /** アクティブなプロファイル */
  activeProfile: Profile | null;
  /** デフォルトプロファイル */
  defaultProfile: Profile | null;
  /** データ読み込み中フラグ */
  loading: boolean;
  /** エラー情報 */
  error: Error | null;
  /** データ再読み込み */
  refresh: () => void;
  /** プロファイル作成 */
  createProfile: (input: CreateProfileInput) => Profile;
  /** プロファイル更新 */
  updateProfile: (id: string, data: UpdateProfileInput) => Profile;
  /** プロファイル削除 */
  deleteProfile: (id: string) => void;
  /** アクティブプロファイルを設定 */
  setActiveProfile: (id: string) => void;
  /** 変数値を一括設定 */
  setVariableValuesForVariable: (
    variableId: string,
    values: { profileId: string; variableId: string; value: string }[]
  ) => void;
}
```

---

### VariableProvider / useVariables()

カスタム変数のグローバル状態を管理するProvider。

**ファイル**: `packages/shared/src/providers/VariableProvider.tsx`

```typescript
interface VariableContextValue {
  /** 変数一覧（無効なものも含む） */
  variables: Variable[];
  /** データ読み込み中フラグ */
  loading: boolean;
  /** エラー情報 */
  error: Error | null;
  /** データ再読み込み */
  refresh: () => void;
  /** 変数作成 */
  createVariable: (input: CreateVariableInput) => Variable;
  /** 変数更新 */
  updateVariable: (id: string, data: UpdateVariableInput) => Variable;
  /** 変数削除 */
  deleteVariable: (id: string) => void;
  /** 変数値設定（全プロファイル分） */
  setVariableValuesForVariable: (
    variableId: string,
    values: { profileId: string; variableId: string; value: string }[]
  ) => void;
}
```

---

### AlertProvider / useAlert()

共通アラートダイアログのグローバル状態を管理するProvider。

**ファイル**: `packages/shared/src/providers/AlertProvider.tsx`

```typescript
interface AlertContextType {
  /** アラートを表示する関数 */
  showAlert: (options: AlertOptions) => void;
  /** アラートを非表示にする関数 */
  hideAlert: () => void;
}

/** アラート表示オプション */
interface AlertOptions {
  /** ダイアログのタイトル */
  title: string;
  /** ダイアログのメッセージ本文 */
  message: string;
  /** 確認ボタン押下時のコールバック */
  onConfirm?: () => void;
  /** キャンセルボタン押下時のコールバック（設定するとキャンセルボタンが表示される） */
  onCancel?: () => void;
  /** 確認ボタンのテキスト（デフォルト: 'OK'） */
  confirmText?: string;
  /** キャンセルボタンのテキスト（デフォルト: 'キャンセル'） */
  cancelText?: string;
  /** アラートの種類: 'default' | 'warning' | 'danger' */
  type?: AlertType;
}
```

**使用例**:

```typescript
const { showAlert } = useAlert();

// シンプルなアラート
showAlert({
  title: '完了',
  message: 'データを保存しました',
});

// 確認ダイアログ
showAlert({
  title: '削除確認',
  message: 'このスニペットを削除しますか？',
  type: 'danger',
  confirmText: '削除',
  cancelText: 'キャンセル',
  onConfirm: () => deleteSnippet(id),
  onCancel: () => console.log('キャンセルされました'),
});
```

---

## Service層 API

Service層は、ビジネスロジックを提供する高レベルAPIです。

**パッケージ**: `packages/shared/src/services/`

---

### SnippetService

スニペット（定型文）のCRUD操作と変数展開を提供。

**ファイル**: `packages/shared/src/services/SnippetService.ts`

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| `getAll` | `static getAll(filterByProfileId?: string \| null): Snippet[]` | 全スニペット取得 |
| `getById` | `static getById(id: string): Snippet \| null` | IDで取得 |
| `getByCategory` | `static getByCategory(categoryId: string \| null, filterByProfileId?: string \| null): Snippet[]` | カテゴリで取得 |
| `create` | `static create(data: CreateSnippetInput): Snippet` | 作成 |
| `update` | `static update(data: UpdateSnippetInput): Snippet` | 更新 |
| `delete` | `static delete(id: string): void` | 削除 |
| `search` | `static search(query: string, categoryId?: string): Snippet[]` | 検索 |
| `getSorted` | `static getSorted(sortBy: SnippetSortBy): Snippet[]` | ソート取得 |
| `count` | `static count(): number` | 総数取得 |
| `countByCategory` | `static countByCategory(categoryId: string \| null): number` | カテゴリ別件数 |
| `getProfileIds` | `static getProfileIds(snippetId: string): string[]` | プロファイルID一覧取得 |
| `setProfileIds` | `static setProfileIds(snippetId: string, profileIds: string[]): void` | プロファイルID設定 |
| `getAllSnippetProfiles` | `static getAllSnippetProfiles(): SnippetProfile[]` | 全関連取得 |
| `getTextPreview` | `static async getTextPreview(text: string, options?): Promise<string>` | テキストプレビュー生成 |
| `getPreview` | `static async getPreview(id: string, options?): Promise<string>` | スニペットプレビュー生成 |
| `prepareForClipboard` | `static async prepareForClipboard(id: string, options?): Promise<string>` | コピー用テキスト準備 |

**エラー:**
- `EmptyContentError` - contentが空の場合
- `NotFoundError` - スニペットが存在しない場合

---

### CategoryService

カテゴリのCRUD操作を提供。

**ファイル**: `packages/shared/src/services/CategoryService.ts`

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| `getAll` | `static getAll(): Category[]` | 全カテゴリ取得（sortOrder順） |
| `getById` | `static getById(id: string): Category \| null` | IDで取得 |
| `getByName` | `static getByName(name: string): Category \| null` | 名前で取得 |
| `create` | `static create(input: CreateCategoryInput): Category` | 作成 |
| `update` | `static update(data: UpdateCategoryInput): Category` | 更新 |
| `delete` | `static delete(id: string): void` | 削除 |
| `reorder` | `static reorder(orderedIds: string[]): void` | 並び順更新 |
| `count` | `static count(): number` | 総数取得 |
| `upsert` | `static upsert(data: CreateCategoryInput & { sortOrder?: number }): Category` | 作成または更新 |

**エラー:**
- `EmptyContentError` - カテゴリ名が空の場合
- `DuplicateNameError` - 同名のカテゴリが存在する場合

---

### ProfileService

プロファイル（環境）のCRUD操作と変数値の設定を提供。

**ファイル**: `packages/shared/src/services/ProfileService.ts`

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| `getAll` | `static getAll(): Profile[]` | 有効なプロファイル取得 |
| `getAllIncludingInvalid` | `static getAllIncludingInvalid(): Profile[]` | 全プロファイル取得 |
| `getById` | `static getById(id: string): Profile \| null` | IDで取得 |
| `getByName` | `static getByName(name: string): Profile \| null` | 名前で取得 |
| `getActive` | `static getActive(): Profile \| null` | アクティブ取得 |
| `getDefault` | `static getDefault(): Profile \| null` | デフォルト取得 |
| `create` | `static create(data: CreateProfileInput): Profile` | 作成 |
| `update` | `static update(id: string, data: UpdateProfileInput): Profile` | 更新 |
| `delete` | `static delete(id: string): void` | 削除 |
| `setActive` | `static setActive(id: string): void` | アクティブ設定 |
| `setDefault` | `static setDefault(id: string): void` | デフォルト設定 |
| `count` | `static count(): number` | 総数取得 |
| `updateValidFlags` | `static updateValidFlags(limit: number): void` | validフラグ更新 |
| `setProfileVariable` | `static setProfileVariable(profileId: string, variableId: string, value: string): ProfileVariable` | 変数値設定 |
| `deleteProfileVariable` | `static deleteProfileVariable(profileId: string, variableId: string): void` | 変数値削除 |
| `getAllProfileVariables` | `static getAllProfileVariables(): ProfileVariable[]` | 全変数値取得 |
| `setVariableValuesForVariable` | `static setVariableValuesForVariable(variableId: string, values: ...[]): void` | 一括設定 |
| `getProfileVariablesMap` | `static getProfileVariablesMap(profileId: string): Record<string, string>` | 変数マップ取得 |
| `getActiveProfileVariablesMap` | `static getActiveProfileVariablesMap(): Record<string, string>` | アクティブ変数マップ |
| `getDefaultProfileVariablesMap` | `static getDefaultProfileVariablesMap(): Record<string, string>` | デフォルト変数マップ |
| `getProfileVariables` | `static getProfileVariables(profileId: string): ProfileVariable[]` | 変数一覧取得 |
| `createWithAutoActivate` | `static createWithAutoActivate(input: CreateProfileInput): Profile` | 自動アクティブ化付き作成 |
| `deleteWithAutoSwitch` | `static deleteWithAutoSwitch(id: string, onAfterDelete?: () => void): boolean` | 自動切り替え付き削除 |
| `upsert` | `static upsert(data: CreateProfileInput): Profile` | 作成または更新 |

**エラー:**
- `EmptyContentError` - プロファイル名が空の場合
- `DuplicateNameError` - 同名のプロファイルが存在する場合
- `NotFoundError` - プロファイルが存在しない場合
- `DefaultProfileDeleteError` - デフォルトプロファイルを削除しようとした場合

---

### VariableService

カスタム変数のCRUD操作とリゾルバー生成を提供。

**ファイル**: `packages/shared/src/services/VariableService.ts`

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| `getAll` | `static getAll(): Variable[]` | 有効な変数取得 |
| `getAllIncludingInvalid` | `static getAllIncludingInvalid(): Variable[]` | 全変数取得 |
| `getCustomVariables` | `static getCustomVariables(): Variable[]` | カスタム変数のみ |
| `getById` | `static getById(id: string): Variable \| null` | IDで取得 |
| `getByName` | `static getByName(name: string): Variable \| null` | 名前で取得 |
| `create` | `static create(data: CreateVariableInput): Variable` | 作成 |
| `update` | `static update(id: string, data: UpdateVariableInput): Variable` | 更新 |
| `delete` | `static delete(id: string): void` | 削除 |
| `count` | `static count(): number` | 総数取得 |
| `getValidCustomVariables` | `static getValidCustomVariables(): Variable[]` | 有効なカスタム変数 |
| `countValid` | `static countValid(): number` | 有効な変数数 |
| `updateValidFlags` | `static updateValidFlags(limit: number): void` | validフラグ更新 |
| `getStandardValue` | `static getStandardValue(variableName: string): string` | 標準値取得 |
| `createCustomVariableResolver` | `static createCustomVariableResolver(context: VariableResolverContext, options?): VariableResolver` | リゾルバー作成 |
| `isNameDuplicate` | `static isNameDuplicate(name: string, excludeId?: string): boolean` | 重複チェック |
| `upsert` | `static upsert(data: CreateVariableInput & { sortOrder?: number }): Variable` | 作成または更新 |
| `upsertValuesForProfiles` | `static upsertValuesForProfiles(variableId: string, profileValues: Record<string, string>): void` | 一括設定 |
| `upsertValueForProfile` | `static upsertValueForProfile(profileId: string, variableId: string, value: string): void` | 単一設定 |
| `deleteValueForProfile` | `static deleteValueForProfile(profileId: string, variableId: string): boolean` | 単一削除 |
| `expandTextSync` | `static expandTextSync(text: string, options): string` | 同期展開 |
| `resolvePreviewText` | `static async resolvePreviewText(title: string, content: string, options?): Promise<{ title: string; content: string }>` | プレビュー解決 |

**エラー:**
- `VariableNameRequiredError` - 変数名が空の場合
- `VariableNameTooLongError` - 変数名が長すぎる場合（50文字超）
- `VariableNameInvalidError` - 変数名の形式が無効な場合
- `VariableNameReservedError` - システム変数名と衝突する場合
- `DuplicateNameError` - 同名の変数が存在する場合
- `NotFoundError` - 変数が存在しない場合
- `SystemVariableDeleteError` - システム変数を削除しようとした場合

---

### SubscriptionService

サブスクリプション状態を管理。

**ファイル**: `packages/shared/src/services/SubscriptionService.ts`

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| `setAdapter` | `static setAdapter(adapter: SubscriptionAdapter, options?): void` | アダプター設定 |
| `setValidFlagsUpdater` | `static setValidFlagsUpdater(updater: ValidFlagsUpdater): void` | コールバック設定 |
| `isSubscribed` | `static isSubscribed(): boolean` | Pro版加入状態 |
| `isLoading` | `static isLoading(): boolean` | 読み込み中状態 |
| `checkSubscription` | `static async checkSubscription(userId?: string \| null): Promise<boolean>` | 状態確認 |
| `subscribe` | `static subscribe(listener: SubscriptionListener): () => void` | 変更購読 |
| `canAddVariable` | `static canAddVariable(currentCount: number): boolean` | 変数追加可否 |
| `canAddProfile` | `static canAddProfile(currentCount: number): boolean` | プロファイル追加可否 |
| `getInvalidVariablesCount` | `static getInvalidVariablesCount(totalCount: number): number` | 無効な変数数 |
| `getInvalidProfilesCount` | `static getInvalidProfilesCount(totalCount: number): number` | 無効なプロファイル数 |
| `getFreeProfilesLimit` | `static getFreeProfilesLimit(): number` | プロファイル上限 |
| `getFreeVariablesLimit` | `static getFreeVariablesLimit(): number` | 変数上限 |
| `updateValidFlags` | `static updateValidFlags(): void` | validフラグ更新 |
| `linkAccount` | `static async linkAccount(userId: string): Promise<void>` | アカウント紐付け |
| `logout` | `static async logout(): Promise<void>` | ログアウト |
| `refreshCustomerInfo` | `static async refreshCustomerInfo(): Promise<void>` | 顧客情報更新 |
| `getStatus` | `static async getStatus(): Promise<SubscriptionStatus \| null>` | ステータス取得 |
| `getPlans` | `static async getPlans(): Promise<SubscriptionPlan[]>` | プラン一覧取得 |
| `purchase` | `static async purchase(planId: string): Promise<PurchaseResult>` | プラン購入 |
| `restore` | `static async restore(): Promise<SubscriptionStatus>` | 購入復元 |

---

### createValidFlagsUpdater

ValidFlagsUpdater共通実装を作成するファクトリ関数。

**ファイル**: `packages/shared/src/services/validFlagsUpdater.ts`

| 関数 | シグネチャ | 説明 |
|-----|-----------|------|
| `createValidFlagsUpdater` | `createValidFlagsUpdater(): ValidFlagsUpdater` | ValidFlagsUpdater実装を作成 |

**ValidFlagsUpdater インターフェース**:

```typescript
interface ValidFlagsUpdater {
  /** プロファイルのvalidフラグを更新 */
  updateProfileValidFlags: (limit: number) => void;
  /** 変数のvalidフラグを更新 */
  updateVariableValidFlags: (limit: number) => void;
  /** アクティブプロファイルを取得 */
  getActiveProfile: () => Profile | null;
  /** ID指定でプロファイルを取得 */
  getProfileById: (id: string) => Profile | null;
  /** デフォルトプロファイルを取得 */
  getDefaultProfile: () => Profile | null;
  /** アクティブプロファイルを設定 */
  setActiveProfile: (id: string) => void;
  /** DBアダプターが設定済みか確認 */
  hasDbAdapter: () => boolean;
}
```

**使用例**:

```typescript
import { SubscriptionService, createValidFlagsUpdater } from '@cliptap/shared';

// SubscriptionProviderの初期化時に設定
const validFlagsUpdater = createValidFlagsUpdater();
SubscriptionService.setValidFlagsUpdater(validFlagsUpdater);
```

---

### AuthService

認証機能を提供。

**ファイル**: `packages/shared/src/services/AuthService.ts`

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| `signInWithGoogle` | `static async signInWithGoogle(): Promise<void>` | Googleサインイン |
| `signInWithApple` | `static async signInWithApple(): Promise<void>` | Appleサインイン |
| `signOut` | `static async signOut(): Promise<void>` | サインアウト |
| `onAuthStateChanged` | `static onAuthStateChanged(listener: AuthStateListener): () => void` | 状態監視 |
| `getCurrentUser` | `static getCurrentUser(): User \| null` | 現在のユーザー取得 |

---

### ExportService

エクスポート機能を提供。

**ファイル**: `packages/shared/src/services/ExportService.ts`

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| `generateFilename` | `static generateFilename(): string` | ファイル名生成 |
| `exportDatabase` | `static async exportDatabase(password: string): Promise<{ filePath: string }>` | 全体エクスポート |
| `exportSelectedData` | `static async exportSelectedData(password: string, selection: ExportSelection): Promise<{ filePath: string }>` | 部分エクスポート |

**エラー:**
- `DatabasePathNotFoundError` - データベースファイルが存在しない場合
- `ExportFailedError` - エクスポートに失敗した場合

---

### ImportService

インポート機能を提供。

**ファイル**: `packages/shared/src/services/ImportService.ts`

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| `prepareImportDatabase` | `static async prepareImportDatabase(password: string, fileUri: string): Promise<string>` | 一時DB作成 |
| `getImportCandidates` | `static async getImportCandidates(tempDbPath: string): Promise<ImportCandidates>` | 候補取得 |
| `importPartial` | `static async importPartial(tempDbPath: string, ...ids: string[]): Promise<void>` | 部分インポート |
| `importDatabase` | `static async importDatabase(password: string, fileUri: string): Promise<void>` | 全体インポート |
| `importDatabaseFromTempDb` | `static async importDatabaseFromTempDb(tempDbPath: string): Promise<void>` | 一時DBからインポート |
| `cleanupTempDatabase` | `static cleanupTempDatabase(tempDbPath: string): void` | 一時DB削除 |

**エラー:**
- `PartialImportError` - インポートに失敗した場合
- `ChecksumMismatchError` - チェックサムが一致しない場合
- `VersionMismatchError` - スキーマバージョンが一致しない場合
- `IncorrectPasswordError` - パスワードが間違っている場合
- `InvalidFileFormatError` - ファイル形式が無効な場合

---

### ImportParserService

インポートファイルの解析・検証を提供。

**ファイル**: `packages/shared/src/services/ImportParserService.ts`

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| `isClipTapFile` | `isClipTapFile(filename: string): boolean` | 拡張子判定 |
| `parseAndValidate` | `async parseAndValidate(jsonText: string, password: string): Promise<ValidationResult>` | 解析・検証 |
| `calculateSHA256` | `async calculateSHA256(input: string): Promise<string>` | ハッシュ計算 |
| `getSchemaVersion` | `getSchemaVersion(): number` | スキーマバージョン取得 |

---

## Mapper層 API

Mapper層は、データベースへの直接アクセスを提供する低レベルAPIです。

**パッケージ**: `packages/shared/src/mappers/`

> **注意**: Mapper層は直接使用せず、Service層経由でアクセスしてください。

---

### SnippetMapper

**ファイル**: `packages/shared/src/mappers/SnippetMapper.ts`

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| `getAll` | `static getAll(filterByProfileId?: string \| null): Snippet[]` | 全件取得 |
| `getById` | `static getById(id: string): Snippet \| null` | IDで取得 |
| `getByCategory` | `static getByCategory(categoryId: string \| null, filterByProfileId?: string \| null): Snippet[]` | カテゴリで取得 |
| `create` | `static create(data: CreateSnippetInput): Snippet` | 作成 |
| `update` | `static update(data: UpdateSnippetInput): Snippet` | 更新 |
| `delete` | `static delete(id: string): void` | 削除 |
| `search` | `static search(query: string, categoryId?: string): Snippet[]` | 検索 |
| `getSorted` | `static getSorted(sortBy: SnippetSortBy): Snippet[]` | ソート取得 |
| `count` | `static count(): number` | 総数取得 |
| `countByCategory` | `static countByCategory(categoryId: string \| null): number` | カテゴリ別件数 |
| `getProfileIds` | `static getProfileIds(snippetId: string): string[]` | プロファイルID取得 |
| `setProfileIds` | `static setProfileIds(snippetId: string, profileIds: string[]): void` | プロファイルID設定 |
| `getAllSnippetProfiles` | `static getAllSnippetProfiles(): SnippetProfile[]` | 全関連取得 |
| `bulkCreate` | `static bulkCreate(snippets: CreateSnippetInput[]): void` | 一括作成 |

---

### CategoryMapper

**ファイル**: `packages/shared/src/mappers/CategoryMapper.ts`

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| `getAll` | `static getAll(): Category[]` | 全件取得 |
| `getById` | `static getById(id: string): Category \| null` | IDで取得 |
| `getByName` | `static getByName(name: string): Category \| null` | 名前で取得 |
| `create` | `static create(data: CreateCategoryInput): Category` | 作成 |
| `update` | `static update(data: UpdateCategoryInput): Category` | 更新 |
| `delete` | `static delete(id: string): void` | 削除 |
| `updateOrder` | `static updateOrder(orderedIds: string[]): void` | 並び順更新 |
| `count` | `static count(): number` | 総数取得 |
| `bulkCreate` | `static bulkCreate(categories: CreateCategoryInput[]): void` | 一括作成 |
| `getNextSortOrder` | `static getNextSortOrder(): number` | 次のsortOrder取得 |

---

### ProfileMapper / ProfileVariableMapper

**ファイル**: `packages/shared/src/mappers/ProfileMapper.ts`

#### ProfileMapper

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| `getAll` | `static getAll(): Profile[]` | 有効なプロファイル取得 |
| `getAllIncludingInvalid` | `static getAllIncludingInvalid(): Profile[]` | 全プロファイル取得 |
| `getById` | `static getById(id: string): Profile \| null` | IDで取得 |
| `getByName` | `static getByName(name: string): Profile \| null` | 名前で取得 |
| `getActive` | `static getActive(): Profile \| null` | アクティブ取得 |
| `getDefault` | `static getDefault(): Profile \| null` | デフォルト取得 |
| `create` | `static create(data: CreateProfileInput, isDefault?: boolean): Profile` | 作成 |
| `update` | `static update(id: string, data: UpdateProfileInput): Profile` | 更新 |
| `delete` | `static delete(id: string): void` | 削除 |
| `setActive` | `static setActive(id: string): void` | アクティブ設定 |
| `setDefault` | `static setDefault(id: string): void` | デフォルト設定 |
| `count` | `static count(): number` | 総数取得 |
| `updateValidFlags` | `static updateValidFlags(limit: number): void` | validフラグ更新 |
| `getNextSortOrder` | `static getNextSortOrder(): number` | 次のsortOrder取得 |
| `bulkCreate` | `static bulkCreate(profiles: CreateProfileInput[]): void` | 一括作成 |

#### ProfileVariableMapper

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| `getByProfileId` | `static getByProfileId(profileId: string): ProfileVariable[]` | プロファイル別取得 |
| `getByVariableId` | `static getByVariableId(variableId: string): ProfileVariable[]` | 変数別取得 |
| `get` | `static get(profileId: string, variableId: string): ProfileVariable \| null` | 単一取得 |
| `upsert` | `static upsert(data: CreateProfileVariableInput): ProfileVariable` | 作成または更新 |
| `update` | `static update(id: string, data: UpdateProfileVariableInput): ProfileVariable` | 更新 |
| `delete` | `static delete(id: string): void` | 削除 |
| `deleteByProfileId` | `static deleteByProfileId(profileId: string): void` | プロファイル別削除 |
| `deleteByVariableId` | `static deleteByVariableId(variableId: string): void` | 変数別削除 |
| `getAll` | `static getAll(): ProfileVariable[]` | 全件取得 |
| `bulkCreate` | `static bulkCreate(profileVariables: CreateProfileVariableInput[]): void` | 一括作成 |
| `getByProfileIdWithVariableNames` | `static getByProfileIdWithVariableNames(profileId: string): Array<{ name: string; value: string }>` | 変数名付き取得 |

---

### VariableMapper

**ファイル**: `packages/shared/src/mappers/VariableMapper.ts`

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| `getAll` | `static getAll(): Variable[]` | 有効な変数取得 |
| `getAllIncludingInvalid` | `static getAllIncludingInvalid(): Variable[]` | 全変数取得 |
| `getCustomVariables` | `static getCustomVariables(): Variable[]` | カスタム変数取得 |
| `getById` | `static getById(id: string): Variable \| null` | IDで取得 |
| `getByName` | `static getByName(name: string): Variable \| null` | 名前で取得 |
| `create` | `static create(data: CreateVariableInput): Variable` | 作成 |
| `update` | `static update(id: string, data: UpdateVariableInput): Variable` | 更新 |
| `delete` | `static delete(id: string): void` | 削除 |
| `count` | `static count(): number` | 総数取得 |
| `bulkCreate` | `static bulkCreate(variables: CreateVariableInput[]): void` | 一括作成 |
| `updateValidFlags` | `static updateValidFlags(limit: number): void` | validフラグ更新 |
| `getByType` | `static getByType(type: string): Variable[]` | タイプ別取得 |
| `getNextSortOrder` | `static getNextSortOrder(): number` | 次のsortOrder取得 |

---

### ExportMapper

**ファイル**: `packages/shared/src/mappers/ExportMapper.ts`

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| `constructor` | `constructor(adapter: DbAdapter)` | コンストラクタ |
| `deleteUnselectedSnippets` | `deleteUnselectedSnippets(selectedIds: string[]): void` | 未選択スニペット削除 |
| `deleteUnselectedProfiles` | `deleteUnselectedProfiles(selectedIds: string[]): void` | 未選択プロファイル削除 |
| `deleteUnselectedVariables` | `deleteUnselectedVariables(selectedIds: string[]): void` | 未選択変数削除 |
| `deleteUnselectedCategories` | `deleteUnselectedCategories(selectedIds: string[]): void` | 未選択カテゴリ削除 |
| `deleteUnselectedData` | `deleteUnselectedData(selection: ExportSelection): void` | 一括削除 |

---

### ImportMapper

**ファイル**: `packages/shared/src/mappers/ImportMapper.ts`

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| `constructor` | `constructor(adapter: DbAdapter)` | コンストラクタ |
| `getAllCandidates` | `getAllCandidates(): ImportCandidates` | 全候補取得 |
| `getCategories` | `getCategories(ids: string[]): ImportCandidateCategory[]` | カテゴリ取得 |
| `getVariables` | `getVariables(ids: string[]): ImportCandidateVariable[]` | 変数取得 |
| `getProfiles` | `getProfiles(ids: string[]): ProfileImportRow[]` | プロファイル取得 |
| `getAllProfiles` | `getAllProfiles(): ProfileImportRow[]` | 全プロファイル取得 |
| `getProfileVariables` | `getProfileVariables(variableIds: string[], profileIds: string[]): ProfileVariableRow[]` | 変数値取得 |
| `getSnippets` | `getSnippets(ids: string[]): SnippetImportRow[]` | スニペット取得 |
| `getSnippetProfiles` | `getSnippetProfiles(snippetIds: string[]): SnippetProfileRow[]` | 関連取得 |

---

## Hooks API

Hooks層は、UIコンポーネントで使用する汎用的なカスタムフックを提供します。

**パッケージ**: `packages/shared/src/hooks/`

---

### useFilteredSnippets

フィルタリング済みスニペット取得フック。

**ファイル**: `packages/shared/src/hooks/useFilteredSnippets.ts`

```typescript
interface UseFilteredSnippetsParams {
  snippets: Snippet[];
  snippetProfiles: SnippetProfile[];
  searchQuery?: string;
  selectedCategory?: string | null;
  activeProfileId?: string | null;
  defaultProfileId?: string | null;
  enableVariableExpansion?: boolean;
  variables?: Variable[];
  profileVariables?: ProfileVariable[];
  locale?: string;
}

interface UseFilteredSnippetsReturn {
  filteredSnippets: SnippetWithDisplay[];
  snippetProfileMap: Map<string, string[]>;
}

function useFilteredSnippets(params: UseFilteredSnippetsParams): UseFilteredSnippetsReturn;
```

---

### useSearch

スニペット検索機能フック。

**ファイル**: `packages/shared/src/hooks/useSearch.ts`

```typescript
interface UseSearchOptions {
  categoryId?: string;
  debounceDelay?: number;
  onError?: (message: string, error: unknown) => void;
}

interface UseSearchResult {
  query: string;
  setQuery: (query: string) => void;
  results: Snippet[];
  searching: boolean;
  clearSearch: () => void;
  hasQuery: boolean;
}

function useSearch(options?: UseSearchOptions): UseSearchResult;
```

---

### useDebounce

デバウンス処理フック。

**ファイル**: `packages/shared/src/hooks/useDebounce.ts`

```typescript
const DEFAULT_DEBOUNCE_DELAY = 300;

function useDebounce<T>(value: T, delay?: number): T;
```

---

### useSelection

汎用選択状態管理フック。

**ファイル**: `packages/shared/src/hooks/useSelection.ts`

```typescript
type SelectionTabType = 'snippets' | 'profiles' | 'variables' | 'categories';

interface UseSelectionProps {
  candidates: SelectionCandidatesBase;
  existingProfileNames?: Set<string>;
  existingVariableNames?: Set<string>;
  existingCategoryNames?: Set<string>;
  isOpen?: boolean;
  enableDuplicateCheck?: boolean;
}

interface UseSelectionResult {
  selectedSnippetIds: Set<string>;
  selectedProfileIds: Set<string>;
  selectedVariableIds: Set<string>;
  selectedCategoryIds: Set<string>;
  setSelectedSnippetIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedProfileIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedVariableIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedCategoryIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  activeTab: SelectionTabType;
  setActiveTab: React.Dispatch<React.SetStateAction<SelectionTabType>>;
  expandedSnippetIds: Set<string>;
  expandedVariableIds: Set<string>;
  isProfileDisabled: (name: string) => boolean;
  isVariableDuplicate: (name: string) => boolean;
  isCategoryDisabled: (name: string) => boolean;
  toggleSelection: (id: string, type: SelectionTabType) => void;
  toggleSelectAll: (tab?: SelectionTabType) => void;
  isAllSelected: (tab?: SelectionTabType) => boolean;
  toggleExpandSnippet: (id: string) => void;
  toggleExpandVariable: (id: string) => void;
  totalSelected: number;
  resetSelection: () => void;
}

function useSelection(props: UseSelectionProps): UseSelectionResult;
```

---

## Adapter層 API

Adapter層は、プラットフォーム固有の機能を抽象化するインターフェースを提供します。

**ファイル**: `packages/shared/src/adapters/`

| インターフェース | 用途 |
|-----------------|------|
| `DbAdapter` | データベースアクセス |
| `ClipboardAdapter` | クリップボード操作 |
| `CryptoAdapter` | 暗号化/ハッシュ |
| `FileIOAdapter` | ファイル入出力 |
| `FilePickerAdapter` | ファイル選択 |
| `FileShareAdapter` | ファイル共有 |
| `LocaleAdapter` | ロケール取得 |
| `I18nAdapter` | 多言語翻訳 |
| `SubscriptionAdapter` | 課金状態管理 |
| `ExportAdapter` | エクスポート処理 |
| `ImportAdapter` | インポート処理 |
| `AuthAdapter` | 認証処理 |

### DbAdapter

```typescript
interface DbAdapter {
  /** データベースを開く */
  open(path: string): Promise<void>;

  /** データベースを閉じる */
  close(): void;

  /** 1行取得（SELECT） */
  get<T = unknown>(sql: string, params?: unknown[]): T | null;

  /** 複数行取得（SELECT） */
  all<T = unknown>(sql: string, params?: unknown[]): T[];

  /** 更新系クエリ実行（INSERT/UPDATE/DELETE） */
  run(sql: string, params?: unknown[]): DbRunResult;

  /** トランザクション実行 */
  transaction<T>(fn: () => T): T;

  /** SQL実行（DDL/複数文対応） */
  exec(sql: string): Promise<void>;

  /** データベースをBase64文字列としてエクスポート（オプション） */
  exportAsBase64?(): Promise<string>;

  /** データベースが開かれているかを確認（オプション） */
  isOpen?(): boolean;

  /** 現在開いているDBのパスを取得（オプション） */
  getCurrentPath?(): string | null;
}

interface DbRunResult {
  /** 最後に挿入された行のID */
  lastInsertRowId: number;
  /** 影響を受けた行数 */
  changes: number;
}
```

### ClipboardAdapter

```typescript
interface ClipboardAdapter {
  copy(text: string): Promise<void>;
}
```

### CryptoAdapter

```typescript
interface CryptoAdapter {
  sha256(input: string): Promise<string>;
}
```

### アダプター登録

```typescript
import { setAllAdapters } from '@cliptap/shared';

setAllAdapters({
  mainDb: mainDbAdapter,
  tempDb: tempDbAdapter,
  clipboard: clipboardAdapter,
  crypto: cryptoAdapter,
  fileIO: fileIOAdapter,
  locale: localeAdapter,
  export: exportAdapter,
  import: importAdapter,
  auth: authAdapter,
});
```

---

## 型定義

**パッケージ**: `packages/shared/src/schema/`

### Snippet

```typescript
interface Snippet {
  id: string;
  title: string | null;
  content: string;
  categoryId: string | null;
  copyWithTitle: boolean;
  createdAt: string;
  updatedAt: string;
  profileIds?: string[];
}
```

### Category

```typescript
interface Category {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
  createdAt: string;
}
```

### Profile

```typescript
interface Profile {
  id: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  valid: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
```

### Variable

```typescript
interface Variable {
  id: string;
  name: string;
  label: string | null;
  icon: string | null;
  type: 'system' | 'custom';
  valid: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
```

### ProfileVariable

```typescript
interface ProfileVariable {
  id: string;
  profileId: string;
  variableId: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}
```

### SnippetProfile

```typescript
interface SnippetProfile {
  snippetId: string;
  profileId: string;
}
```

### Input Types

```typescript
interface CreateSnippetInput {
  title?: string;
  content: string;
  categoryId?: string | null;
  profileIds?: string[];
  copyWithTitle?: boolean;
}

interface UpdateSnippetInput {
  id: string;
  title?: string;
  content?: string;
  categoryId?: string | null;
  profileIds?: string[];
  copyWithTitle?: boolean;
}

interface CreateCategoryInput {
  name: string;
  color?: string | null;
}

interface UpdateCategoryInput {
  id: string;
  name?: string;
  color?: string | null;
  sortOrder?: number;
}

interface CreateProfileInput {
  name: string;
  sortOrder?: number;
}

interface UpdateProfileInput {
  name?: string;
  sortOrder?: number;
}

interface CreateVariableInput {
  name: string;
  type?: 'custom';
  label?: string;
  icon?: string;
  sortOrder?: number;
}

interface UpdateVariableInput {
  name?: string;
  label?: string;
  icon?: string;
  sortOrder?: number;
}
```

### SnippetSortBy

```typescript
type SnippetSortBy = 'recent' | 'title';
```

---

## エラー型

**パッケージ**: `packages/shared/src/errors/`

### ビジネスエラー

| エラー | 説明 |
|--------|------|
| `EmptyContentError` | コンテンツが空の場合 |
| `NotFoundError` | リソースが見つからない場合 |
| `DuplicateNameError` | 名前が重複する場合 |
| `DefaultProfileDeleteError` | デフォルトプロファイル削除時 |
| `SystemVariableDeleteError` | システム変数削除時 |
| `DatabaseError` | データベース操作エラー |

### 変数名エラー

| エラー | 説明 |
|--------|------|
| `VariableNameRequiredError` | 変数名が空の場合 |
| `VariableNameTooLongError` | 変数名が長すぎる場合 |
| `VariableNameInvalidError` | 変数名の形式が無効な場合 |
| `VariableNameReservedError` | システム変数名と衝突する場合 |

### インポート/エクスポートエラー

| エラー | 説明 |
|--------|------|
| `DatabasePathNotFoundError` | DBファイルが存在しない場合 |
| `ExportFailedError` | エクスポート失敗時 |
| `PartialImportError` | インポート失敗時 |
| `ChecksumMismatchError` | チェックサム不一致時 |
| `VersionMismatchError` | バージョン不一致時 |
| `IncorrectPasswordError` | パスワード不正時 |
| `InvalidFileFormatError` | ファイル形式不正時 |

---

## 定数

### 無料プラン制限

```typescript
/** 無料プランで使用可能なプロファイル数 */
const FREE_PROFILES_LIMIT = 3;

/** 無料プランで使用可能な変数数 */
const FREE_VARIABLES_LIMIT = 5;
```

### デバウンス設定

```typescript
/** デフォルトのデバウンス遅延時間（ミリ秒） */
const DEFAULT_DEBOUNCE_DELAY = 300;
```

### 変数名制限

```typescript
/** 変数名の最大長 */
const MAX_VARIABLE_NAME_LENGTH = 50;
```

---

## 関連ドキュメント

- [アーキテクチャ概要](./ARCHITECTURE.md)
- [コードリーディングガイド](./CODE_READING_GUIDE.md)
- [データベーススキーマ](./DATABASE.md)
- [開発ガイド](./DEVELOPMENT.md)
