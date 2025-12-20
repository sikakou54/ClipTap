# ClipTap Development Setup Guide

**Version**: 1.2.0
**Last Updated**: 2025-12-17

このガイドは、新規開発者がClipTapプロジェクトをセットアップし、開発を開始するための完全なリファレンスです。

---

## 目次

1. [必要条件](#必要条件)
2. [初回セットアップ](#初回セットアップ)
3. [開発サーバーの起動](#開発サーバーの起動)
4. [コード構造の理解](#コード構造の理解)
5. [開発ワークフロー](#開発ワークフロー)
6. [テストとデバッグ](#テストとデバッグ)
7. [ビルドとデプロイ](#ビルドとデプロイ)
8. [トラブルシューティング](#トラブルシューティング)
9. [開発のベストプラクティス](#開発のベストプラクティス)
10. [参考リソース](#参考リソース)

---

## 必要条件

### 必須ツール

#### Node.js & npm
- **Node.js**: v18.x以上（推奨: v20.x LTS）
- **npm**: v9.x以上
- インストール: [https://nodejs.org/](https://nodejs.org/)

```bash
# バージョン確認
node --version  # v18.0.0以上
npm --version   # v9.0.0以上
```

#### Git
- **Git**: v2.x以上
- インストール: [https://git-scm.com/](https://git-scm.com/)

```bash
# バージョン確認
git --version
```

### iOS開発環境（macOS必須）

#### Xcode
- **Xcode**: v15.0以上
- **macOS**: Ventura (13.0) 以上
- App Storeからインストール

```bash
# Xcodeコマンドラインツールのインストール
xcode-select --install

# バージョン確認
xcodebuild -version
```

#### CocoaPods
- **CocoaPods**: v1.12.0以上

```bash
# インストール
sudo gem install cocoapods

# バージョン確認
pod --version
```

### Android開発環境

#### Android Studio
- **Android Studio**: Hedgehog (2023.1.1) 以上
- ダウンロード: [https://developer.android.com/studio](https://developer.android.com/studio)

#### Java Development Kit (JDK)
- **JDK**: 17以上
- Azul Zulu JDK 17推奨: [https://www.azul.com/downloads/](https://www.azul.com/downloads/)

```bash
# バージョン確認
java -version  # 17以上
```

#### Android SDK
Android Studioをインストール後、以下のコンポーネントをSDK Managerからインストール:

- Android SDK Platform 34
- Android SDK Build-Tools 34.0.0
- Android Emulator
- Android SDK Platform-Tools

#### 環境変数の設定

macOS/Linuxの場合（`~/.zshrc` または `~/.bash_profile`に追加）:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Windowsの場合:

```
ANDROID_HOME=C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk
```

### 推奨エディタ

#### Visual Studio Code
- **VS Code**: 最新版推奨
- ダウンロード: [https://code.visualstudio.com/](https://code.visualstudio.com/)

#### 推奨VS Code拡張機能

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",           // ESLint
    "esbenp.prettier-vscode",           // Prettier
    "ms-vscode.vscode-typescript-next", // TypeScript
    "expo.vscode-expo-tools",           // Expo Tools
    "bradlc.vscode-tailwindcss",        // Tailwind CSS (Web用)
    "ms-vscode.vscode-react-native",    // React Native Tools
    "formulahendry.auto-rename-tag",    // Auto Rename Tag
    "christian-kohler.path-intellisense" // Path Intellisense
  ]
}
```

これらの拡張機能をワークスペースに追加するには、`.vscode/extensions.json`に上記内容を保存してください。

---

## 初回セットアップ

### 1. リポジトリのクローン

```bash
# HTTPSでクローン
git clone https://github.com/YOUR_ORG/clipTap.git
cd clipTap

# または、SSHでクローン
git clone git@github.com:YOUR_ORG/clipTap.git
cd clipTap
```

### 2. npm Workspacesの理解

ClipTapはモノレポ構造を採用しており、複数のパッケージを一つのリポジトリで管理しています。

```
clipTap/
├── apps/
│   ├── mobile/          # @cliptap/mobile (React Native/Expo)
│   └── web/             # @cliptap/web (React/Vite)
├── packages/
│   └── shared/          # @cliptap/shared (共通ロジック)
└── package.json         # ルートのpackage.json（workspaces定義）
```

### 3. 依存関係のインストール

**重要**: ルートディレクトリで`npm install`を一度実行するだけで、すべてのワークスペースの依存関係がインストールされます。

```bash
# ルートディレクトリで実行
npm install
```

これにより、以下がインストールされます:
- `apps/mobile/node_modules`
- `apps/web/node_modules`
- `packages/shared/node_modules`
- ルートの`node_modules`（共通の依存関係）

### 4. iOS固有のセットアップ（macOSのみ）

CocoaPodsの依存関係をインストール:

```bash
# ルートディレクトリから実行
npm run pod-install

# または、直接iOSディレクトリで実行
cd apps/mobile/ios
pod install
cd ../../..
```

### 5. 環境変数の設定

ClipTapは以下の外部サービスと連携しています。開発を開始するには、各サービスの認証情報を設定する必要があります。

#### Firebase設定

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
2. iOSアプリとAndroidアプリを追加
3. 設定ファイルを配置:

**iOS**: `apps/mobile/ios/GoogleService-Info.plist`

```bash
# Firebase Consoleからダウンロードした GoogleService-Info.plist を配置
cp path/to/GoogleService-Info.plist apps/mobile/ios/
```

**Android**: `apps/mobile/android/app/google-services.json`

```bash
# Firebase Consoleからダウンロードした google-services.json を配置
cp path/to/google-services.json apps/mobile/android/app/
```

#### RevenueCat設定（サブスクリプション）

1. [RevenueCat Dashboard](https://app.revenuecat.com/)でプロジェクトを作成
2. APIキーを取得
3. アプリコード内で使用（環境変数は不要、コードに直接埋め込み）

#### Google Sign In設定

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
2. OAuth 2.0クライアントIDを作成（iOS用、Android用、Web用）

**iOS設定**:
- `apps/mobile/ios/ClipTap/Info.plist`に`GIDClientID`を追加
- URL Schemesを設定

**Android設定**:
- `apps/mobile/android/app/src/main/res/values/strings.xml`に設定を追加

#### Apple Sign In設定（iOS）

1. Apple Developer Accountで「Sign in with Apple」を有効化
2. Xcodeで「Sign in with Apple」Capabilityを追加
3. Firebaseと連携（Firebase Console > Authentication > Sign-in method）

### 6. 開発ビルドの準備（推奨）

Expo Development Client（expo-dev-client）を使用すると、ネイティブモジュールを含む開発が可能になります。

```bash
# iOS Development Buildのインストール
npm run ios

# Android Development Buildのインストール
npm run android
```

初回実行時、開発ビルドがデバイス/シミュレーターにインストールされます。

---

## 開発サーバーの起動

### Mobile（Expo）

#### 開発サーバー起動

```bash
# ルートディレクトリから起動
npm run dev:mobile

# または、apps/mobileディレクトリから起動
cd apps/mobile
npm start
```

起動後、ターミナルに以下のオプションが表示されます:

```
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
› Press c │ clear cache and reload
```

#### iOSシミュレーターで起動

```bash
# ルートディレクトリから
npm run ios

# 特定のシミュレーターを指定
npm run ios -- --simulator="iPhone 15 Pro"
```

#### Androidエミュレーターで起動

```bash
# Androidエミュレーターを事前に起動しておく
# Android Studioから、または adb コマンドで起動

# ルートディレクトリから
npm run android
```

#### 実機でテスト

1. 開発ビルドを実機にインストール（`npm run ios`または`npm run android`）
2. Expo Goアプリではなく、開発ビルドアプリを使用
3. 同じWi-Fiネットワークに接続
4. QRコードをスキャン、またはURLを直接入力

#### ホットリロード

- ファイルを保存すると、自動的にアプリがリロードされます
- 手動リロード: シミュレーター/エミュレーターで `r` を押す
- キャッシュクリア: `c` を押す

#### デバッグツール

**React Native Debugger**:

```bash
# インストール
brew install --cask react-native-debugger

# 起動後、Expo開発メニューから "Debug remote JS" を選択
```

**Flipper**:
- Facebookが提供するモバイルアプリデバッグツール
- ダウンロード: [https://fbflipper.com/](https://fbflipper.com/)
- Networkリクエスト、データベース、ログの監視が可能

### Web

#### Vite開発サーバー起動

```bash
# ルートディレクトリから
npm run dev:web

# または、apps/webディレクトリから
cd apps/web
npm run dev
```

起動後、ブラウザで以下にアクセス:

```
http://localhost:5173
```

#### ブラウザでのデバッグ

- Chrome DevToolsを使用
- React Developer Toolsブラウザ拡張機能を推奨
- Network、Console、Sourcesタブを活用

---

## コード構造の理解

### モノレポ構造（npm Workspaces）

ClipTapは3つの主要パッケージで構成されています:

```
clipTap/
├── apps/
│   ├── mobile/              # @cliptap/mobile
│   │   ├── app/            # Expo Routerの画面（ファイルベースルーティング）
│   │   ├── src/            # コアロジック
│   │   │   ├── adapters/   # プラットフォーム固有アダプター
│   │   │   ├── components/ # UIコンポーネント
│   │   │   ├── hooks/      # カスタムフック
│   │   │   ├── services/   # サービス
│   │   │   └── utils/      # ユーティリティ
│   │   ├── assets/         # 画像、フォント等
│   │   ├── locales/        # 翻訳ファイル（ja/en）
│   │   ├── ios/            # iOSネイティブコード
│   │   ├── android/        # Androidネイティブコード
│   │   └── package.json    # モバイルアプリの依存関係
│   │
│   └── web/                 # @cliptap/web
│       ├── src/            # Reactコンポーネント、ページ
│       ├── public/         # 静的ファイル
│       └── package.json    # Webアプリの依存関係
│
├── packages/
│   └── shared/              # @cliptap/shared
│       ├── src/            # 共通の型定義、バリデーション、ユーティリティ
│       └── package.json    # 共通パッケージの依存関係
│
└── package.json             # ルートのpackage.json（workspaces定義）
```

### 各パッケージの役割

#### apps/mobile（モバイルアプリ）

React Native + Expoで構築されたモバイルアプリ。iOS/Android両対応。

**主要技術**:
- Expo SDK 54
- React Native 0.81
- Expo Router（ファイルベースルーティング）
- SQLite（expo-sqlite）
- Firebase Authentication
- RevenueCat（サブスクリプション）

**データフロー**:
```
UI Layer (app/*.tsx, src/components/*.tsx)
    ↓ useSnippets(), useCategories()
Business Logic Layer (packages/shared/src/services/*.ts, src/hooks/*.ts)
    ↓ snippetMapper.getAll()
Data Access Layer (packages/shared/src/mappers/*.ts)
    ↓ SQL queries
Database (SQLite)
```

#### apps/web（Webアプリ）

React + Viteで構築されたWebアプリ。ランディングページとWebツール。

**主要技術**:
- React 19
- Vite 7
- React Router v7
- Tailwind CSS v4
- Firebase Authentication
- IndexedDB（ローカルストレージ）

#### packages/shared（共通パッケージ）

モバイルとWebで共有される型定義、バリデーション、ユーティリティ関数。

**主要技術**:
- TypeScript
- Zod（スキーマバリデーション）

**エクスポート内容**:
- 共通の型定義（Snippet, Category, Profile等）
- バリデーションスキーマ
- 定数定義
- ユーティリティ関数

### データフロー（3層アーキテクチャ）

ClipTapは以下の3層アーキテクチャを採用しています:

```
┌─────────────────────────────────────────────────┐
│  UI Layer (React Components)                    │
│  - app/*.tsx (screens)                          │
│  - src/components/*.tsx                         │
└─────────────────┬───────────────────────────────┘
                  │ useSnippets(), useCategories()
┌─────────────────▼───────────────────────────────┐
│  Business Logic Layer (Services + Hooks)        │
│  - packages/shared/src/services/*.ts            │
│  - src/hooks/*.ts                               │
└─────────────────┬───────────────────────────────┘
                  │ snippetMapper.getAll()
┌─────────────────▼───────────────────────────────┐
│  Data Access Layer (Mappers)                    │
│  - packages/shared/src/mappers/*.ts             │
└─────────────────┬───────────────────────────────┘
                  │ SQL queries
┌─────────────────▼───────────────────────────────┐
│  Database (SQLite)                              │
│  - src/database/database.ts                     │
│  - packages/shared/src/database/schema.ts (V5)  │
└─────────────────────────────────────────────────┘
```

#### 1. UI Layer（UIレイヤー）

- **責務**: ユーザーインターフェースの描画、ユーザー操作の受付
- **実装場所**: `app/*.tsx`、`src/components/*.tsx`
- **原則**: ビジネスロジックを含まない、プレゼンテーション専用

```typescript
// 例: app/index.tsx
export default function HomeScreen() {
  const { snippets, loading, copySnippet } = useSnippets();

  return (
    <SnippetList
      snippets={snippets}
      loading={loading}
      onCopy={copySnippet}
    />
  );
}
```

#### 2. Business Logic Layer（ビジネスロジックレイヤー）

- **責務**: アプリケーションのビジネスルール、状態管理、データ変換
- **実装場所**: `packages/shared/src/services/*.ts`、`src/hooks/*.ts`
- **原則**: UIとデータアクセスを橋渡し、複雑なロジックを集約

```typescript
/* 例: packages/shared/src/services/SnippetService.ts */
export class SnippetService {
  async copySnippet(snippetId: string): Promise<void> {
    const snippet = await snippetMapper.getById(snippetId);
    const expandedContent = variableParser.expand(snippet.content);
    await ClipboardService.setString(expandedContent);
  }
}
```

#### 3. Data Access Layer（データアクセスレイヤー）

- **責務**: データベースとの直接的なやり取り、CRUD操作
- **実装場所**: `packages/shared/src/mappers/*.ts`
- **原則**: SQL直書き禁止、BaseMapperを継承

```typescript
// 例: packages/shared/src/mappers/SnippetMapper.ts
export class SnippetMapper extends BaseMapper<Snippet> {
  async getAll(): Promise<Snippet[]> {
    return this.db.getAllAsync('SELECT * FROM snippets ORDER BY created_at DESC');
  }
}
```

### ファイル配置のルール

#### 新しいコンポーネントを追加する場合

```
src/components/
├── common/           # 基本UIコンポーネント（Button, Input等）
├── layout/           # レイアウトコンポーネント（Container, Header等）
├── snippet/          # スニペット関連コンポーネント
├── category/         # カテゴリ関連コンポーネント
├── profile/          # 環境関連コンポーネント
├── variable/         # 変数関連コンポーネント
├── selection/        # 選択関連コンポーネント
└── settings/         # 設定関連コンポーネント
```

**命名規則**:
- PascalCase（例: `SnippetCard.tsx`）
- 1ファイル1コンポーネント
- Propsは`interface Props`で明示的に定義

#### 新しいサービスを追加する場合

```
packages/shared/src/services/
├── SnippetService.ts      # スニペット管理
├── CategoryService.ts     # カテゴリ管理
├── VariableService.ts     # 変数管理
├── ProfileService.ts      # プロファイル管理
├── SubscriptionService.ts # サブスクリプション管理
└── YourNewService.ts      # 新しいサービス
```

**命名規則**:
- PascalCase + `Service`サフィックス
- クラスベース設計
- 単一責任の原則を遵守

#### 新しいMapperを追加する場合

```
packages/shared/src/mappers/
├── BaseMapper.ts          # 基底クラス
├── SnippetMapper.ts
├── CategoryMapper.ts
├── ProfileMapper.ts
├── VariableMapper.ts
└── YourNewMapper.ts       # 新しいMapper
```

**必須**:
- `BaseMapper<T>`を継承
- 型パラメータを明示
- SQL直書き禁止

---

## 開発ワークフロー

### 新機能の追加（完全フロー）

新しい機能を追加する際は、以下のステップに従ってください。

#### ステップ1: スキーマ定義

データベースに新しいテーブルが必要な場合、マイグレーションファイルを作成します。

```bash
# 新しいマイグレーションファイルを作成
# packages/shared/src/database/migrations.ts に追加
```

**例**: `packages/shared/src/database/migrations.ts`

```typescript
export const V5_MIGRATION = `
  CREATE TABLE IF NOT EXISTS new_table (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`;
```

**重要**:
- 既存のマイグレーションファイルは**絶対に編集しない**
- 新しいバージョンとして追加する
- `packages/shared/src/database/schema.ts`でバージョンをインクリメント

#### ステップ2: Mapper作成

データアクセスレイヤーを作成します。

**例**: `packages/shared/src/mappers/NewTableMapper.ts`

```typescript
import { BaseMapper } from './BaseMapper';
import type { NewTable } from '../types/newTable';

export class NewTableMapper extends BaseMapper<NewTable> {
  protected tableName = 'new_table';

  async getByName(name: string): Promise<NewTable | null> {
    return this.db.getFirstAsync(
      `SELECT * FROM ${this.tableName} WHERE name = ?`,
      [name]
    );
  }

  // その他のカスタムメソッド
}

export const newTableMapper = new NewTableMapper();
```

#### ステップ3: Service作成

ビジネスロジックを実装します。

**例**: `packages/shared/src/services/NewTableService.ts`

```typescript
import { newTableMapper } from '../mappers/NewTableMapper';
import type { NewTable } from '../types/newTable';

export class NewTableService {
  async createItem(name: string): Promise<NewTable> {
    const newItem: NewTable = {
      id: generateId(),
      name,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    await newTableMapper.create(newItem);
    return newItem;
  }

  async getAllItems(): Promise<NewTable[]> {
    return newTableMapper.getAll();
  }

  // その他のビジネスロジック
}

export const newTableService = new NewTableService();
```

#### ステップ4: Hook作成

UI状態管理のためのフックを作成します。

**例**: `packages/shared/src/hooks/useNewTable.ts`

```typescript
import { useState, useEffect } from 'react';
import { newTableService } from '../services/NewTableService';
import type { NewTable } from '../types/newTable';

export function useNewTable() {
  const [items, setItems] = useState<NewTable[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await newTableService.getAllItems();
      setItems(data);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (name: string) => {
    try {
      const newItem = await newTableService.createItem(name);
      setItems(prev => [newItem, ...prev]);
    } catch (error) {
      console.error('Failed to create item:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  return {
    items,
    loading,
    createItem,
    refresh: loadItems,
  };
}
```

#### ステップ5: UI実装

コンポーネントとスクリーンを実装します。

**例**: `apps/mobile/components/newTable/NewTableCard.tsx`

```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { NewTable } from '../../lib/types/newTable';

interface Props {
  item: NewTable;
  onPress: () => void;
}

export function NewTableCard({ item, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress}>
      <View>
        <Text>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );
}
```

**例**: `apps/mobile/app/newTable/index.tsx`

```typescript
import React from 'react';
import { View, FlatList } from 'react-native';
import { useNewTable } from '../../lib/hooks/useNewTable';
import { NewTableCard } from '../../components/newTable/NewTableCard';

export default function NewTableScreen() {
  const { items, loading, createItem } = useNewTable();

  return (
    <View>
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <NewTableCard
            item={item}
            onPress={() => console.log('Pressed:', item.id)}
          />
        )}
        keyExtractor={item => item.id}
      />
    </View>
  );
}
```

### コミット前のチェック

コードをコミットする前に、必ず以下のチェックを実行してください。

#### 1. TypeScript型チェック

```bash
# すべてのワークスペースの型チェック
npm run type-check

# 個別のワークスペース
npm run type-check:mobile
npm run type-check:web
npm run type-check:shared
```

**重要**: 型エラーが1件でもある場合、コミットしないでください。

#### 2. Linter実行

```bash
# ESLint実行
npm run lint
```

自動修正可能なエラーがある場合:

```bash
npm run lint -- --fix
```

#### 3. フォーマッター実行（将来追加予定）

```bash
# Prettier（将来追加予定）
npm run format
```

#### 4. 動作確認

- iOS/Androidシミュレーター/エミュレーターで動作確認
- 追加した機能が正しく動作することを確認
- 既存の機能が壊れていないことを確認

### Gitコミットの規約

ClipTapでは以下のコミットメッセージ規約を推奨します:

```
<type>: <subject>

<body>

<footer>
```

**type（必須）**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: コードフォーマット（機能変更なし）
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド、設定変更

**例**:

```bash
git commit -m "feat: add dark mode support"
git commit -m "fix: resolve crash on iOS when copying empty snippet"
git commit -m "docs: update DEVELOPMENT.md with new setup steps"
```

---

## テストとデバッグ

### 型チェックの実行方法

TypeScript型チェックは、コードの品質を保つために最も重要なステップです。

```bash
# すべてのワークスペースの型チェック
npm run type-check

# エラー例
apps/mobile/app/index.tsx:23:5 - error TS2322: Type 'string' is not assignable to type 'number'.
```

**型エラーの解決方法**:

1. エラーメッセージを読む
2. ファイルと行番号を確認
3. 型定義を確認（`lib/types/*.ts`）
4. `any`型の使用は最小限に

### ユニットテストの実行（将来的に）

現在、ClipTapにはユニットテストが未実装ですが、将来的に以下のツールを使用する予定です:

- **Vitest**: 高速なユニットテストフレームワーク
- **React Testing Library**: コンポーネントテスト
- **Jest**: スナップショットテスト

### デバッグのベストプラクティス

#### Console Logging

```typescript
// 基本的なログ
console.log('Debug info:', data);

// エラーログ
console.error('Error occurred:', error);

// 警告ログ
console.warn('Warning:', message);
```

#### React Native Debugger

1. React Native Debuggerを起動
2. Expo開発メニューから「Debug remote JS」を選択
3. ブレークポイントを設定してステップ実行

#### Flipperの使用

1. Flipperを起動
2. デバイス/シミュレーターを選択
3. プラグインを有効化:
   - **Logs**: アプリログの確認
   - **Network**: ネットワークリクエストの監視
   - **Databases**: SQLiteデータベースの確認

#### SQLiteデバッグ

```typescript
// データベースクエリをログに出力
const result = await db.getAllAsync('SELECT * FROM snippets');
console.log('Query result:', result);
```

Flipperの「Databases」プラグインを使用すると、SQLiteの内容をGUIで確認できます。

### よくあるエラーとその解決方法

#### エラー1: `Metro bundler has encountered an internal error`

**原因**: Metroのキャッシュが破損している

**解決方法**:

```bash
# Metroキャッシュをクリア
npm run dev:mobile -- --clear

# または
expo start --clear
```

#### エラー2: `Unable to resolve module`

**原因**: モジュールが見つからない、またはインポートパスが間違っている

**解決方法**:

```bash
# node_modulesを再インストール
rm -rf node_modules package-lock.json
npm install
```

#### エラー3: `CocoaPods could not find compatible versions for pod`

**原因**: CocoaPodsの依存関係の競合

**解決方法**:

```bash
cd apps/mobile/ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ../../..
```

#### エラー4: `JAVA_HOME is not set`

**原因**: Java Development Kitがインストールされていない、または環境変数が設定されていない

**解決方法**:

```bash
# JDKのインストール確認
java -version

# 環境変数の設定（~/.zshrcまたは~/.bash_profileに追加）
export JAVA_HOME=$(/usr/libexec/java_home)
```

#### エラー5: `Gradle build failed`

**原因**: Androidビルドの依存関係の問題

**解決方法**:

```bash
cd apps/mobile/android
./gradlew clean
cd ../../..
npm run android
```

#### エラー6: 型エラー `Property 'xxx' does not exist on type 'yyy'`

**原因**: 型定義が正しくない、または型の不一致

**解決方法**:

1. 型定義を確認（`packages/shared/src/types/*.ts`）
2. インポートパスを確認
3. 必要に応じて型アサーションを使用（最終手段）

```typescript
// 型アサーション（最終手段）
const data = result as MyType;
```

---

## ビルドとデプロイ

### Mobile

ClipTapのモバイルアプリは、EAS Build（Expo Application Services）を使用してビルドします。

#### Development Build

開発用ビルド。ネイティブモジュールのテストが可能。

```bash
# iOSシミュレーターにインストール
npm run ios

# Androidエミュレーターにインストール
npm run android
```

#### Preview Build

内部テスター向けビルド。TestFlightまたはInternal Testingで配布。

```bash
# プレビュービルド（iOS/Android）
npm run preview:mobile

# EAS Buildの進捗はWebで確認
# https://expo.dev/accounts/YOUR_ACCOUNT/projects/cliptap/builds
```

#### Production Build

本番ビルド。App Store/Google Playに提出。

```bash
# 本番ビルド（iOS/Android）
npm run build:mobile
```

**ビルド前の準備**:

1. アプリバージョンをインクリメント（`apps/mobile/package.json`）
2. 法的文書を同期（利用規約、プライバシーポリシー）

```bash
npm run sync-legal --workspace=@cliptap/mobile
```

3. 変更履歴を記録
4. Git tagを作成

```bash
git tag -a v1.0.8 -m "Release v1.0.8"
git push origin v1.0.8
```

#### App Store提出（iOS）

1. EAS Buildが完了したら、`.ipa`ファイルをダウンロード
2. App Store Connectにアップロード（EASが自動的に行う）
3. App Store Connectでアプリ情報を入力
4. スクリーンショット、説明文、キーワードを更新
5. 審査に提出

#### Google Play提出（Android）

1. EAS Buildが完了したら、`.aab`ファイルをダウンロード
2. Google Play Consoleにアップロード（EASが自動的に行う）
3. Google Play Consoleでアプリ情報を入力
4. スクリーンショット、説明文を更新
5. 審査に提出

### Web

Webアプリは、Viteを使用してビルドします。

#### ビルド

```bash
# Webアプリのビルド
npm run build:web

# ビルド結果は apps/web/dist に出力される
```

#### プレビュー

```bash
# ビルドしたアプリをローカルでプレビュー
cd apps/web
npm run preview
```

#### デプロイ

デプロイ先（例: Vercel, Netlify, Firebase Hosting）に応じて、デプロイ方法が異なります。

**Vercel（推奨）**:

```bash
# Vercel CLIのインストール
npm install -g vercel

# デプロイ
cd apps/web
vercel
```

**Firebase Hosting**:

```bash
# Firebase CLIのインストール
npm install -g firebase-tools

# ログイン
firebase login

# デプロイ
cd apps/web
firebase deploy --only hosting
```

---

## トラブルシューティング

### Metro bundlerのキャッシュクリア

Metroのキャッシュが原因で問題が発生する場合があります。

```bash
# Expoキャッシュをクリア
expo start --clear

# または、npm経由
npm run dev:mobile -- --clear
```

### node_modulesの再インストール

依存関係が壊れている場合、再インストールが必要です。

```bash
# ルートディレクトリで実行
rm -rf node_modules package-lock.json
rm -rf apps/mobile/node_modules
rm -rf apps/web/node_modules
rm -rf packages/shared/node_modules

# 再インストール
npm install
```

### CocoaPodsの問題（iOS）

CocoaPodsの依存関係が壊れている場合の対処法:

```bash
# CocoaPodsキャッシュをクリア
cd apps/mobile/ios
rm -rf Pods Podfile.lock
pod cache clean --all
pod install --repo-update
cd ../../..
```

**エラー**: `[!] CocoaPods could not find compatible versions for pod "XXX"`

**解決方法**:

```bash
cd apps/mobile/ios
pod repo update
pod install
cd ../../..
```

### Gradleの問題（Android）

Gradleのビルドが失敗する場合の対処法:

```bash
# Gradleキャッシュをクリア
cd apps/mobile/android
./gradlew clean
./gradlew cleanBuildCache

# 依存関係を再ダウンロード
./gradlew build --refresh-dependencies

cd ../../..
```

**エラー**: `Execution failed for task ':app:mergeDebugResources'`

**解決方法**:

```bash
cd apps/mobile/android
./gradlew clean
cd ../../..
rm -rf apps/mobile/android/app/build
npm run android
```

### よくある型エラーの解決

#### エラー1: `Cannot find module '@cliptap/shared' or its corresponding type declarations`

**原因**: shared パッケージのビルドが必要

**解決方法**:

```bash
# sharedパッケージをビルド
npm run build --workspace=@cliptap/shared

# または、型チェック
npm run type-check:shared
```

#### エラー2: `Type 'XXX' is not assignable to type 'YYY'`

**原因**: 型の不一致

**解決方法**:

1. 型定義を確認（`packages/shared/src/types/*.ts`）
2. インポートパスを確認
3. 型を明示的にキャスト（最終手段）

```typescript
const data: CorrectType = result as CorrectType;
```

#### エラー3: `Property 'XXX' does not exist on type 'never'`

**原因**: 型推論が失敗している

**解決方法**:

型を明示的に指定する:

```typescript
// Before
const [data, setData] = useState([]);

// After
const [data, setData] = useState<MyType[]>([]);
```

### Expoの問題

#### エラー: `Unable to resolve "expo-router"`

**原因**: Expo Routerがインストールされていない、またはMetroの設定が間違っている

**解決方法**:

```bash
# 再インストール
npm install expo-router --workspace=@cliptap/mobile

# キャッシュクリア
expo start --clear
```

#### エラー: `Invariant Violation: "main" has not been registered`

**原因**: アプリのエントリーポイントが登録されていない

**解決方法**:

`apps/mobile/package.json`の`main`フィールドを確認:

```json
{
  "main": "expo-router/entry"
}
```

### Firebase認証の問題

#### エラー: `FirebaseError: Firebase: Error (auth/invalid-api-key)`

**原因**: Firebase APIキーが正しくない、または設定ファイルが配置されていない

**解決方法**:

1. `GoogleService-Info.plist`（iOS）を確認
2. `google-services.json`（Android）を確認
3. Firebase Consoleで設定を再確認

---

## 開発のベストプラクティス

### コーディング規約

ClipTapでは、以下のコーディング規約を推奨します。詳細は`CLAUDE.md`を参照してください。

#### コンポーネント設計

**1. 1コンポーネント1責務**

```typescript
// Good: 1つの責務に集中
export function SnippetCard({ snippet, onCopy }: Props) {
  return (
    <TouchableOpacity onPress={() => onCopy(snippet.id)}>
      <Text>{snippet.title}</Text>
    </TouchableOpacity>
  );
}

// Bad: 複数の責務を持つ
export function SnippetCardWithFormAndList() {
  // カード、フォーム、リストの処理が混在
}
```

**2. Propsは明示的な型定義**

```typescript
// Good: インターフェースで型定義
interface Props {
  snippet: Snippet;
  onCopy: (id: string) => void;
  disabled?: boolean;
}

export function SnippetCard({ snippet, onCopy, disabled = false }: Props) {
  // ...
}

// Bad: 型定義なし
export function SnippetCard(props: any) {
  // ...
}
```

**3. useEffect依存配列を正確に指定**

```typescript
// Good: 依存配列を正確に指定
useEffect(() => {
  loadSnippets();
}, [categoryId, profileId]); // 依存する値を明示

// Bad: 依存配列を省略（無限ループの危険）
useEffect(() => {
  loadSnippets();
}); // 依存配列がない
```

#### 命名規則

| 対象 | 命名規則 | 例 |
|------|---------|-----|
| ファイル名（コンポーネント） | PascalCase | `SnippetCard.tsx` |
| ファイル名（ユーティリティ） | camelCase | `dateHelpers.ts` |
| コンポーネント名 | PascalCase | `SnippetCard` |
| 関数名 | camelCase（動詞から始める） | `copySnippet()`, `loadData()` |
| 定数名 | UPPER_SNAKE_CASE | `MAX_SNIPPET_LENGTH` |
| 型名 | PascalCase | `Snippet`, `Category` |

#### パフォーマンス最適化

**1. リスト表示にはFlashListを使用**

```typescript
// Good: FlashListを使用
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={snippets}
  renderItem={({ item }) => <SnippetCard snippet={item} />}
  estimatedItemSize={100}
/>

// Bad: FlatListを使用（ClipTapでは非推奨）
import { FlatList } from 'react-native';

<FlatList
  data={snippets}
  renderItem={({ item }) => <SnippetCard snippet={item} />}
/>
```

**2. useMemo/useCallbackの適切な使用**

```typescript
// Good: 高コストな計算をメモ化
const filteredSnippets = useMemo(() => {
  return snippets.filter(s => s.categoryId === selectedCategoryId);
}, [snippets, selectedCategoryId]);

// Good: コールバックをメモ化
const handleCopy = useCallback((id: string) => {
  copySnippet(id);
}, [copySnippet]);
```

**3. 検索にはデバウンス処理**

```typescript
import { useDebounce } from '../hooks/useDebounce';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300); // 300ms固定

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery]);

  return <TextInput value={query} onChangeText={setQuery} />;
}
```

### ドキュメンテーション

**コメントの書き方**:

```typescript
/**
 * スニペットをクリップボードにコピーし、変数を展開します。
 *
 * @param snippetId - コピーするスニペットのID
 * @param profileId - 使用する環境のID（省略時はアクティブな環境）
 * @returns Promise<void>
 * @throws エラーが発生した場合、Error をスロー
 */
async function copySnippet(snippetId: string, profileId?: string): Promise<void> {
  // 実装
}
```

**複雑なロジックには説明を追加**:

```typescript
// 変数展開の処理フロー:
// 1. スニペットのテキストをパース
// 2. システム変数（{{今日}}等）を展開
// 3. カスタム変数（{{名前}}等）をプロファイルから取得
// 4. 展開されたテキストをクリップボードにコピー
const expandedContent = variableParser.expand(snippet.content, profile);
```

### セキュリティ考慮事項

**1. ユーザー入力のバリデーション**

```typescript
import { z } from 'zod';

const snippetSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().max(10000),
  categoryId: z.string().uuid(),
});

// バリデーション
const validated = snippetSchema.parse(userInput);
```

**2. SQLインジェクション対策**

```typescript
// Good: プレースホルダーを使用
await db.getAllAsync(
  'SELECT * FROM snippets WHERE category_id = ?',
  [categoryId]
);

// Bad: 文字列結合（SQLインジェクションのリスク）
await db.getAllAsync(
  `SELECT * FROM snippets WHERE category_id = '${categoryId}'`
);
```

**3. センシティブ情報の保護**

- APIキー、認証情報はコードに直接埋め込まない
- 環境変数、またはネイティブモジュールで管理
- `.gitignore`に追加して、リポジトリにコミットしない

```bash
# .gitignore
apps/mobile/ios/GoogleService-Info.plist
apps/mobile/android/app/google-services.json
.env
.env.local
```

---

## 参考リソース

### プロジェクト内ドキュメント

- **CLAUDE.md**: プロジェクト概要、アーキテクチャ、コーディング規約
- **docs/API.md**: API仕様書
- **docs/DEVELOPMENT.md**: 開発セットアップガイド（このファイル）

### 外部ドキュメント

#### React Native / Expo

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Documentation](https://react.dev/)

#### データベース

- [expo-sqlite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

#### 認証

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Google Sign-In for React Native](https://github.com/react-native-google-signin/google-signin)
- [expo-apple-authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)

#### サブスクリプション

- [RevenueCat Documentation](https://www.revenuecat.com/docs)
- [react-native-purchases](https://github.com/RevenueCat/react-native-purchases)

#### UI/スタイリング

- [Tailwind CSS Documentation](https://tailwindcss.com/docs) (Web)
- [React Native StyleSheet](https://reactnative.dev/docs/stylesheet)

#### 多言語対応

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)

### 便利なツールとライブラリ

#### 開発ツール

- **React Native Debugger**: [https://github.com/jhen0409/react-native-debugger](https://github.com/jhen0409/react-native-debugger)
- **Flipper**: [https://fbflipper.com/](https://fbflipper.com/)
- **Expo Go**: [https://expo.dev/client](https://expo.dev/client)

#### ライブラリ

- **FlashList**: [https://shopify.github.io/flash-list/](https://shopify.github.io/flash-list/)
- **React Query**: [https://tanstack.com/query/latest](https://tanstack.com/query/latest)
- **Zod**: [https://zod.dev/](https://zod.dev/)
- **Zustand**: [https://zustand-demo.pmnd.rs/](https://zustand-demo.pmnd.rs/)

#### CI/CD

- **EAS Build**: [https://docs.expo.dev/build/introduction/](https://docs.expo.dev/build/introduction/)
- **EAS Submit**: [https://docs.expo.dev/submit/introduction/](https://docs.expo.dev/submit/introduction/)
- **EAS Update**: [https://docs.expo.dev/eas-update/introduction/](https://docs.expo.dev/eas-update/introduction/)

### コミュニティとサポート

- **Expo Discord**: [https://chat.expo.dev/](https://chat.expo.dev/)
- **React Native Community**: [https://reactnative.dev/community/overview](https://reactnative.dev/community/overview)
- **Stack Overflow**: [https://stackoverflow.com/questions/tagged/expo](https://stackoverflow.com/questions/tagged/expo)

---

## まとめ

このガイドでは、ClipTapプロジェクトの開発環境セットアップから、日常的な開発ワークフロー、トラブルシューティングまでを網羅しました。

**開発を始める前の最終チェックリスト**:

- [ ] Node.js、npm、Git がインストール済み
- [ ] iOS開発環境（Xcode、CocoaPods）がセットアップ済み（macOSのみ）
- [ ] Android開発環境（Android Studio、JDK、Android SDK）がセットアップ済み
- [ ] リポジトリをクローン済み
- [ ] 依存関係をインストール済み（`npm install`）
- [ ] Firebase設定ファイルを配置済み
- [ ] 開発サーバーが起動できる（`npm run dev:mobile`）
- [ ] 型チェックが通る（`npm run type-check`）

**困ったときは**:

1. このガイドの「トラブルシューティング」セクションを確認
2. `CLAUDE.md`の「Claude Codeへの重要な指示」を確認
3. 既存のコードを参考にする（実装パターンを踏襲）
4. チームメンバーに質問する

**Happy coding!**
