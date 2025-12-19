# ClipTap Web 実装仕様書 v2.0（実情ベース最適化版）

## 目次
1. [概要](#概要)
2. [設計思想](#設計思想)
3. [システムアーキテクチャ](#システムアーキテクチャ)
4. [データフロー](#データフロー)
5. [モバイル側実装](#モバイル側実装)
6. [Web側実装](#web側実装)
7. [セキュリティ設計](#セキュリティ設計)
8. [デプロイ・運用](#デプロイ・運用)

---

## 概要

### プロジェクト概要
ClipTapのデータをPCブラウザで管理・編集できるWeb版アプリケーション。
モバイルアプリからエクスポートした `.cliptap` ファイル（暗号化されたSQLiteデータ）をブラウザ内で読み込み、**ローカル（IndexedDB + SQLite Wasm）で処理** するサーバーレス・アーキテクチャを採用しています。

### 主要機能
- **.cliptapファイルのインポート/エクスポート**: モバイルアプリとの完全なデータ互換性
- **定型文のフル管理**: 作成・編集・削除・複製・検索・フィルタリング
- **高度な設定管理**: カテゴリ、環境（プロファイル）、カスタム変数の管理
- **サブスクリプション連携**: RevenueCatと連携し、Proプランの状態をWeb版にも反映
- **多言語対応**: 日本語・英語の切り替え（全画面対応）
- **ダークモード**: システム設定または手動切り替え対応
- **LP統合**: ランディングページ（index.html）とアプリ（app.html）のマルチページ構成
- **完全オフライン動作**: データはブラウザ内に保存され、外部サーバーへ送信されない（RevenueCat検証を除く）

### 実装状況（2025年11月時点）
- ✅ SQLite WasmによるローカルDB構築
- ✅ RevenueCat Web SDKによるサブスクリプション検証
- ✅ インポート/エクスポート機能（暗号化・パスワード保護・チェックサム）
- ✅ 多言語対応（i18n）
- ✅ 静的サイトとしてのビルド・デプロイ構成（GitHub Pages互換）
- ✅ 利用規約・プライバシーポリシーのWeb/モバイル統合管理

---

## 設計思想

### 1. サーバーレス & ローカルファースト
- バックエンドAPIを持たず、すべてのデータ処理をブラウザ上の `SQLite Wasm` で実行。
- データは `IndexedDB` にキャッシュされ、リロード後も維持される。
- 編集結果は再び `.cliptap` ファイルとしてエクスポートし、モバイル端末に戻す運用。

### 2. セキュリティ & プライバシー
- **データ非送信**: ユーザーの定型文データは一切サーバーに送信されない。
- **パスワード保護**: エクスポートファイルはユーザー設定のパスワードとスキーマバージョンでSHA-256ハッシュ化され保護される。
- **チェックサム検証**: ファイルの改竄を検知。

### 3. モバイル・Webの機能統一
- モバイルアプリの機能をWebでも完全に再現（プレビュー、変数展開など）。
- 利用規約・プライバシーポリシーをWeb版をマスターとして一元管理し、ビルド時にモバイル側へ同期。

---

## システムアーキテクチャ

### 全体構成

```
┌─────────────────────────────┐      ┌─────────────────────────────┐
│ モバイルアプリ (Expo/React Native) │      │ Webアプリ (React/Vite)      │
│                             │      │                             │
│ ・SQLite (Native)           │      │ ・SQLite Wasm (Browser)     │
│ ・RevenueCat SDK            │ <--> │ ・RevenueCat Web SDK        │
│ ・ExportImportService       │ File │ ・cliptapParser/Exporter    │
└──────────────┬──────────────┘ Trans└──────────────┬──────────────┘
               │                                    │
               └────────── .cliptap File ───────────┘
                     (JSON + Base64 SQLite)
```

### 技術スタック (Web)
- **Framework**: React 18, TypeScript
- **Build Tool**: Vite (Multi-Page App configuration)
- **Styling**: Tailwind CSS
- **Database**: sql.js (SQLite Wasm)
- **State Management**: Zustand
- **Routing**: React Router (HashRouter for static deploy)
- **I18n**: i18next, react-i18next
- **Deployment**: GitHub Pages / Manual Upload (Static Hosting)

---

## データフロー

### 1. エクスポート（モバイル → Web）
1.  モバイルアプリで「エクスポート」を実行。
2.  `ExportImportService` がSQLite DBをダンプし、二重Base64エンコード。
3.  パスワードハッシュ、チェックサム、**RevenueCat Customer ID** を含めたJSONを作成。
4.  `.cliptap` ファイルとして保存・共有。

### 2. インポート（Web）
1.  Web版 (`Home.tsx`) でファイルをドロップ＆パスワード入力。
2.  `cliptapParser` がJSONを解析し、パスワードとチェックサムを検証。
3.  Base64データをデコードし、SQLite WasmでDBを復元。
4.  Zustandストアにデータをロード。
5.  `IndexedDB` にキャッシュ保存。

### 3. 初期化とサブスクリプションチェック（Web）
1.  `App.tsx` がマウント時にキャッシュを読み込み。
2.  RevenueCat SDKを初期化し、`customerId` を用いて最新の契約状態を問い合わせ。
3.  結果に基づいて `valid` フラグ（環境・変数の有効無効）をDB上で更新。
4.  最新のデータをストアに反映し、画面を描画。
    *   *これにより、リロードしても常に最新のプラン状態が反映され、画面遷移も維持される。*

---

## モバイル側実装

### 主な変更点
- **ExportImportService**: 無料プラン・Proプランに関わらず、常に `customerId` を取得してエクスポートファイルに含めるように改修（Web側でのユーザー識別・プラン判定のため）。
- **設定画面**: Web版への導線とエクスポート機能へのリンクを追加。
- **法的文書**: ビルド時にWeb版の `terms.html`, `privacy.html` を `assets/web/` にコピーして利用。

---

## Web側実装

### ディレクトリ構造 (`web/`)

```
web/
├── public/
│   ├── sql-wasm.wasm        # SQLite Wasmバイナリ
│   ├── terms.html           # 利用規約（マスター）
│   └── privacy.html         # プライバシーポリシー（マスター）
├── src/
│   ├── components/          # UIコンポーネント
│   │   ├── SideMenu.tsx     # サイドメニュー（言語・テーマ切り替え含む）
│   │   ├── PageLayout.tsx   # 共通レイアウト
│   │   └── ...
│   ├── lib/
│   │   ├── sqliteWasm.ts    # SQLite操作 (sql.jsラッパー)
│   │   ├── cliptapParser.ts # インポート処理
│   │   ├── cliptapExporter.ts # エクスポート処理
│   │   ├── constants.ts     # 定数定義
│   │   └── ...
│   ├── pages/
│   │   ├── Home.tsx         # ファイルロード画面
│   │   ├── Dashboard.tsx    # メイン画面（定型文一覧）
│   │   ├── CategoryManage.tsx # カテゴリ管理
│   │   ├── ProfileManage.tsx  # 環境管理
│   │   ├── VariableManage.tsx # 変数管理
│   │   └── ...
│   ├── store/
│   │   ├── useSubscriptionStore.ts # RevenueCat連携・権限管理
│   │   ├── useDataStore.ts  # データ管理
│   │   └── useThemeStore.ts # テーマ管理
│   ├── App.tsx              # 初期化ロジック・ルーティング
│   └── main.tsx             # エントリーポイント
├── index.html               # ランディングページ (LP)
├── app.html                 # アプリケーションエントリーポイント
└── vite.config.ts           # ビルド設定 (MPA, base path)
```

### 重要なロジック

#### 初期化フロー (`App.tsx`)
リロード時のリダイレクト問題を解決するため、データ読み込みとサブスクリプションチェックを `App.tsx` に集約。
初期化中（`isInitializing`）はローディングを表示し、完了後にルーター（`AppRoutes`）を表示することで、URLに基づいた適切な画面を表示・維持する。

#### 多言語対応
`i18next` を導入し、`src/locales/` 以下のJSONファイルで文言を管理。
サイドメニューのスイッチャーで言語を切り替え、`localStorage` に設定を保存。

#### 環境切り替えと制限
`useSubscriptionStore` と `ProfileService` が連携。
サブスクリプションが無効（無料プラン）の場合、制限数（環境3つ、変数5つ）を超えるデータは `valid=0` となり、UI上で選択・編集不可となる。

---

## セキュリティ設計

### データ保護
- **クライアント完結**: パスワードハッシュ検証、復号、DB操作はすべてブラウザ内で行われる。
- **CORS対策**: `vite.config.ts` で相対パス (`base: './'`) を設定し、多様なホスティング環境に対応。ローカルファイルシステム (`file://`) では動作しないため、プレビューにはHTTPサーバーが必要。

### 法的対応
- 利用規約・プライバシーポリシーへの同意をファイル読み込み時に必須化（チェックボックス）。
- 文書はHTMLとして管理し、Web/モバイルで内容を統一。

---

## デプロイ・運用

### ビルド設定
- **Multi-Page Application (MPA)**: LP (`index.html`) と アプリ (`app.html`) を分割ビルド。
- **相対パス**: サブディレクトリやローカルサーバーでも動作するようにアセットパスを相対化。

### デプロイ手順
1. `npm run build` で `dist/` を生成。
2. `dist/` フォルダの中身を任意の静的ホスティングサービス（GitHub Pages, Netlify, Vercel, レンタルサーバー等）にアップロード。
3. `.env` ファイル（または環境変数）で `VITE_REVENUECAT_API_KEY` を設定すること。

---

**文書バージョン**: 2.0
**最終更新日**: 2025年11月23日
