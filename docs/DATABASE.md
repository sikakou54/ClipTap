# ClipTap データベース仕様書

**Version**: 1.2.0
**Schema Version**: V5
**Last Updated**: 2025-12-18

---

## 目次

- [概要](#概要)
- [テーブル一覧](#テーブル一覧)
- [テーブル詳細](#テーブル詳細)
  - [snippets](#snippets)
  - [categories](#categories)
  - [profiles](#profiles)
  - [variables](#variables)
  - [profile_variables](#profile_variables)
  - [snippet_profiles](#snippet_profiles)
- [インデックス](#インデックス)
- [ER図](#er図)
- [プラットフォーム別実装](#プラットフォーム別実装)
- [マイグレーション](#マイグレーション)
- [シードデータ](#シードデータ)

---

## 概要

ClipTapは**ローカルファースト**のアプリケーションです。すべてのデータは端末内のSQLiteデータベースに保存され、クラウド同期は行いません。

### 設計原則

1. **オフライン完全動作**: ネットワーク接続なしで全機能が動作
2. **プライバシー重視**: すべてのデータは端末内に保存
3. **高速アクセス**: インデックス最適化によるクエリ高速化
4. **参照整合性**: 外部キー制約による一貫性保証

### 技術スタック

| プラットフォーム | ライブラリ | 特徴 |
|-----------------|----------|------|
| Mobile (iOS/Android) | expo-sqlite | ネイティブSQLite |
| Web | sql.js (WASM) | ブラウザ内SQLite |

---

## テーブル一覧

| テーブル名 | 説明 | レコード数目安 |
|-----------|------|---------------|
| `snippets` | 定型文（テンプレート） | 数十〜数百 |
| `categories` | カテゴリ | 数個〜十数個 |
| `profiles` | 環境（プロファイル） | 1〜10個 |
| `variables` | 変数（システム/カスタム） | 数十個 |
| `profile_variables` | プロファイル別変数値 | プロファイル数 × カスタム変数数 |
| `snippet_profiles` | スニペット-プロファイル関連 | スニペット数 × 平均プロファイル数 |

---

## テーブル詳細

### snippets

定型文（テンプレート）を格納するメインテーブル。

```sql
CREATE TABLE IF NOT EXISTS snippets (
  id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL,
  categoryId TEXT,
  copyWithTitle INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
);
```

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | TEXT | NO | - | UUID形式の一意識別子 |
| title | TEXT | YES | - | タイトル（nullの場合はcontentから自動生成表示） |
| content | TEXT | NO | - | 本文（変数は `{{variable_name}}` 形式） |
| categoryId | TEXT | YES | - | 所属カテゴリID（削除時NULL設定） |
| copyWithTitle | INTEGER | NO | 0 | コピー時にタイトルを含める（0/1） |
| createdAt | TEXT | NO | - | 作成日時（ISO 8601形式） |
| updatedAt | TEXT | NO | - | 更新日時（ISO 8601形式） |

**外部キー制約**:
- `categoryId` → `categories(id)` ON DELETE SET NULL

---

### categories

カテゴリを格納するテーブル。

```sql
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL
);
```

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | TEXT | NO | - | UUID形式の一意識別子 |
| name | TEXT | NO | - | カテゴリ名（一意） |
| color | TEXT | YES | - | カテゴリ色（HEX形式: #RRGGBB） |
| sortOrder | INTEGER | NO | 0 | 並び順（0始まり） |
| createdAt | TEXT | NO | - | 作成日時（ISO 8601形式） |

**制約**:
- `name` は UNIQUE

---

### profiles

環境（プロファイル）を格納するテーブル。変数の値セットを切り替えるために使用。

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  isActive INTEGER DEFAULT 0,
  isDefault INTEGER DEFAULT 0,
  valid INTEGER DEFAULT 1,
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | TEXT | NO | - | UUID形式の一意識別子 |
| name | TEXT | NO | - | プロファイル名（一意） |
| isActive | INTEGER | NO | 0 | アクティブフラグ（同時に1つのみ1） |
| isDefault | INTEGER | NO | 0 | デフォルトプロファイルフラグ（削除不可） |
| valid | INTEGER | NO | 1 | 有効フラグ（Freeプランは3つまで有効） |
| sortOrder | INTEGER | NO | 0 | 並び順（0始まり） |
| createdAt | TEXT | NO | - | 作成日時（ISO 8601形式） |
| updatedAt | TEXT | NO | - | 更新日時（ISO 8601形式） |

**制約**:
- `name` は UNIQUE
- `isActive = 1` は常に1レコードのみ
- `isDefault = 1` のプロファイルは削除不可

**プラン制限**:
- Freeプラン: 最大3プロファイル（`valid = 1`）
- Proプラン: 無制限

---

### variables

変数のメタデータを格納するテーブル。

```sql
CREATE TABLE IF NOT EXISTS variables (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  label TEXT,
  icon TEXT,
  valid INTEGER DEFAULT 1,
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | TEXT | NO | - | UUID形式の一意識別子 |
| name | TEXT | NO | - | 変数名（一意、`{{name}}`の"name"部分） |
| type | TEXT | NO | - | 種類（'system' / 'custom'） |
| label | TEXT | YES | - | 表示用ラベル |
| icon | TEXT | YES | - | アイコン名 |
| valid | INTEGER | NO | 1 | 有効フラグ（Freeプランはカスタム5個まで） |
| sortOrder | INTEGER | NO | 0 | 並び順（0始まり） |
| createdAt | TEXT | NO | - | 作成日時（ISO 8601形式） |
| updatedAt | TEXT | NO | - | 更新日時（ISO 8601形式） |

**制約**:
- `name` は UNIQUE
- `name` はシステム変数名と重複不可

**変数タイプ**:
| type | 説明 | 例 |
|------|------|-----|
| system | システム変数（削除不可） | `{{today}}`, `{{time}}`, `{{year}}` |
| custom | カスタム変数（ユーザー作成） | `{{name}}`, `{{email}}`, `{{company}}` |

**プラン制限**:
- Freeプラン: カスタム変数最大5個（`valid = 1`）
- Proプラン: 無制限

---

### profile_variables

プロファイル別の変数値を格納する中間テーブル。

```sql
CREATE TABLE IF NOT EXISTS profile_variables (
  id TEXT PRIMARY KEY,
  profileId TEXT NOT NULL,
  variableId TEXT NOT NULL,
  value TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (profileId) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (variableId) REFERENCES variables(id) ON DELETE CASCADE,
  UNIQUE(profileId, variableId)
);
```

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | TEXT | NO | - | UUID形式の一意識別子 |
| profileId | TEXT | NO | - | プロファイルID |
| variableId | TEXT | NO | - | 変数ID |
| value | TEXT | NO | - | 変数の値 |
| createdAt | TEXT | NO | - | 作成日時（ISO 8601形式） |
| updatedAt | TEXT | NO | - | 更新日時（ISO 8601形式） |

**外部キー制約**:
- `profileId` → `profiles(id)` ON DELETE CASCADE
- `variableId` → `variables(id)` ON DELETE CASCADE

**複合ユニーク制約**:
- `(profileId, variableId)` の組み合わせは一意

**使用例**:
```
profiles: [開発環境, 本番環境]
variables: [name, email]

profile_variables:
- 開発環境 + name = "テスト太郎"
- 開発環境 + email = "test@example.com"
- 本番環境 + name = "佐々木"
- 本番環境 + email = "sasaki@company.com"
```

---

### snippet_profiles

スニペットが利用可能なプロファイルを管理する中間テーブル。

```sql
CREATE TABLE IF NOT EXISTS snippet_profiles (
  snippetId TEXT NOT NULL,
  profileId TEXT NOT NULL,
  PRIMARY KEY (snippetId, profileId),
  FOREIGN KEY (snippetId) REFERENCES snippets(id) ON DELETE CASCADE,
  FOREIGN KEY (profileId) REFERENCES profiles(id) ON DELETE CASCADE
);
```

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| snippetId | TEXT | NO | - | スニペットID |
| profileId | TEXT | NO | - | プロファイルID |

**主キー**: `(snippetId, profileId)`

**外部キー制約**:
- `snippetId` → `snippets(id)` ON DELETE CASCADE
- `profileId` → `profiles(id)` ON DELETE CASCADE

**動作仕様**:
- このテーブルにレコードがない場合 → すべてのプロファイルで利用可能
- レコードがある場合 → 指定されたプロファイルでのみ利用可能

---

## インデックス

クエリ高速化のためのインデックス定義。

```sql
-- スニペットのカテゴリ検索用
CREATE INDEX IF NOT EXISTS idx_snippets_category
ON snippets(categoryId);

-- スニペットの更新日時ソート用
CREATE INDEX IF NOT EXISTS idx_snippets_updated
ON snippets(updatedAt DESC);

-- アクティブプロファイル検索用
CREATE INDEX IF NOT EXISTS idx_profiles_active
ON profiles(isActive DESC);

-- プロファイル変数のプロファイル検索用
CREATE INDEX IF NOT EXISTS idx_profile_variables_profile
ON profile_variables(profileId);

-- プロファイル変数の変数検索用
CREATE INDEX IF NOT EXISTS idx_profile_variables_variable
ON profile_variables(variableId);

-- スニペットプロファイルのスニペット検索用
CREATE INDEX IF NOT EXISTS idx_snippet_profiles_snippet
ON snippet_profiles(snippetId);

-- スニペットプロファイルのプロファイル検索用
CREATE INDEX IF NOT EXISTS idx_snippet_profiles_profile
ON snippet_profiles(profileId);
```

---

## ER図

```
┌─────────────────┐       ┌─────────────────┐
│   categories    │       │    profiles     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ name (UNIQUE)   │       │ name (UNIQUE)   │
│ color           │       │ isActive        │
│ sortOrder       │       │ isDefault       │
│ createdAt       │       │ valid           │
└────────┬────────┘       │ sortOrder       │
         │                │ createdAt       │
         │                │ updatedAt       │
         │                └────────┬────────┘
         │ 1:N                     │
         ▼                         │
┌─────────────────┐                │
│    snippets     │                │
├─────────────────┤                │
│ id (PK)         │◄───────────────┤ M:N
│ title           │                │ (snippet_profiles)
│ content         │                │
│ categoryId (FK) │                │
│ copyWithTitle   │                │
│ createdAt       │                │
│ updatedAt       │                │
└─────────────────┘                │
                                   │
┌─────────────────┐                │
│   variables     │                │
├─────────────────┤                │
│ id (PK)         │◄───────────────┤ M:N
│ name (UNIQUE)   │                │ (profile_variables)
│ type            │                │
│ label           │                │
│ icon            │                │
│ valid           │                │
│ sortOrder       │                │
│ createdAt       │                │
│ updatedAt       │                │
└─────────────────┘                │
                                   │
┌──────────────────────────────────┘
│
│  中間テーブル
│
▼
┌─────────────────────────┐    ┌─────────────────────────┐
│   profile_variables     │    │   snippet_profiles      │
├─────────────────────────┤    ├─────────────────────────┤
│ id (PK)                 │    │ snippetId (PK, FK)      │
│ profileId (FK, UNIQUE)  │    │ profileId (PK, FK)      │
│ variableId (FK, UNIQUE) │    └─────────────────────────┘
│ value                   │
│ createdAt               │
│ updatedAt               │
└─────────────────────────┘
```

---

## プラットフォーム別実装

### Mobile (expo-sqlite)

**パス**: `apps/mobile/src/database/`

```typescript
// データベース初期化
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('cliptap.db');
```

**特徴**:
- ネイティブSQLite（高速）
- ファイルシステムに永続化
- WAL (Write-Ahead Logging) モード対応

### Web (sql.js)

**パス**: `apps/web/src/adapters/WebDatabaseAdapter.ts`

```typescript
// データベース初期化
import initSqlJs from 'sql.js';

const SQL = await initSqlJs({
  locateFile: file => `https://sql.js.org/dist/${file}`
});
const db = new SQL.Database();
```

**特徴**:
- WebAssemblyベース（sql.js）
- メモリ内で動作
- IndexedDBに自動永続化（debounce処理）

#### IndexedDBキャッシュ層

**パス**: `apps/web/src/adapters/WebDbCacheManager.ts`

Web版では、sql.jsのインメモリデータベースをIndexedDBにキャッシュして永続化します。

```typescript
// WebDbCacheManager の主要機能
class WebDbCacheManager {
  // debounce付きでキャッシュ保存をスケジュール（300ms）
  scheduleSave(): void;

  // バッチ処理時にキャッシュ保存を無効化
  disable(): void;

  // バッチ処理後にキャッシュ保存を再度有効化
  enable(): void;

  // 即座にキャッシュを保存（pending分を含む）
  flush(): Promise<void>;
}
```

**キャッシュ保存の流れ**:
1. データベース書き込み操作（INSERT/UPDATE/DELETE）
2. `WebDbCacheManager.scheduleSave()` が呼ばれる
3. 300ms debounce後にIndexedDBへ保存
4. `CacheService.save()` でmainDB + systemDBを保存

**特徴**:
- **debounce処理**: 連続した書き込みでは最後の1回だけ保存（300ms）
- **バッチ処理対応**: `disable()/enable()` で一括処理時の頻繁な保存を防止
- **ゲストモード対応**: 未ログイン時もcustomerId: nullで保存

---

## マイグレーション

### バージョン履歴

| Version | 変更内容 |
|---------|---------|
| V1 | 初期スキーマ（snippets, categories） |
| V2 | profiles, variablesテーブル追加 |
| V3 | profile_variablesテーブル追加、変数値をプロファイル別に分離 |
| V4 | snippet_profilesテーブル追加、スニペットのプロファイル制限機能 |
| V5 | profilesテーブルにsortOrderカラム追加、variablesテーブルにsortOrderカラム追加 |

### マイグレーション手順

新しいテーブルやカラムを追加する場合：

1. **スキーマバージョンをインクリメント**
   - `packages/shared/src/database/schema.ts` の `SCHEMA_VERSION` を更新

2. **CREATE文を追加**
   - `CREATE_TABLES` オブジェクトにテーブル定義を追加

3. **インデックスを追加**（必要に応じて）
   - `CREATE_INDEXES` オブジェクトにインデックス定義を追加

4. **Mapperを作成**
   - `packages/shared/src/mappers/` に新しいMapperを作成

**注意**: 既存のマイグレーションファイルは**絶対に編集しない**こと。

---

## シードデータ

### デフォルトプロファイル

アプリ初回起動時に自動作成されるプロファイル：

```typescript
{
  name: "Main",
  isActive: true,
  isDefault: true,
  valid: true
}
```

### 開発用テストデータ

`__DEV__` モードのみ、以下のテストデータが自動生成されます：

| データ | 件数 | 内容 |
|--------|------|------|
| カテゴリ | 4件 | メール、営業、サポート、プライベート |
| スニペット | 11件 | ビジネステンプレート |
| プロファイル | 4件 | 取引先別環境 |
| カスタム変数 | 10件 | 名前、メール、会社名など |

**データソース**: `apps/mobile/dummy.json`

---

## 関連ドキュメント

- [アーキテクチャ概要](./ARCHITECTURE.md) - 3層アーキテクチャとデータフロー
- [API仕様書](./API.md) - Mapper/Service API詳細
- [コードリーディングガイド](./CODE_READING_GUIDE.md) - 実装パターン

---

## 型定義

データベーススキーマに対応するTypeScript型は `packages/shared/src/types/` ディレクトリで定義されています。

```typescript
// 型のインポート例
import type {
  Snippet,
  Category,
  Profile,
  Variable,
  ProfileVariable,
  SnippetProfile
} from '@cliptap/shared';
```

**型定義ファイル**:
| ファイル | 定義している型 |
|---------|--------------|
| [snippet.ts](../packages/shared/src/types/snippet.ts) | Snippet, SnippetProfile, CreateSnippetInput, UpdateSnippetInput |
| [category.ts](../packages/shared/src/types/category.ts) | Category, CreateCategoryInput, UpdateCategoryInput |
| [profile.ts](../packages/shared/src/types/profile.ts) | Profile, ProfileVariable, CreateProfileInput, UpdateProfileInput |
| [variableSchema.ts](../packages/shared/src/types/variableSchema.ts) | Variable, CreateVariableInput, UpdateVariableInput |

詳細は [packages/shared/src/schema.ts](../packages/shared/src/schema.ts)（型のエクスポート元）を参照してください。
