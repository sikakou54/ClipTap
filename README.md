# ClipTap

定型文・コードスニペットをワンタップでコピーできる超シンプルなモバイル・Webアプリ

[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6.svg)](https://www.typescriptlang.org/)

---

## 🎯 プロジェクト概要

**ClipTap**は、定型文やコードスニペットを効率的に管理し、ワンタップでクリップボードにコピーできるアプリケーションです。

### コアコンセプト

- **ワンタップコピー** - 登録したテキストを即座にクリップボードへコピー
- **ローカルファースト** - オフラインで完全動作、プライバシー重視
- **超軽量UI** - 最小の操作で最大の生産性を実現
- **クロスプラットフォーム** - iOS, Android, Webで統一されたUX
- **Proプラン** - 広告なし・環境管理無制限・カスタム変数無制限（月額¥250 / 年間¥3,000）

### 主要機能

- 🚀 **変数システム** - `{{今日}}`、`{{名前}}`などの動的変数をサポート
- 📁 **カテゴリ管理** - スニペットをカテゴリ別に整理
- 🌍 **環境管理** - 開発・本番環境など、複数の環境を切り替え可能
- 💾 **エクスポート/インポート** - パスワード保護された安全なデータバックアップ
- 🌐 **多言語対応** - 日本語・英語をサポート
- 🌙 **ダークモード** - ライト/ダークテーマの自動切り替え

---

## 📚 ドキュメント

**新規参画メンバーは [docs/INDEX.md](docs/INDEX.md) から開始してください！**

### クイックリンク

| ドキュメント | 説明 | 対象者 |
|-------------|------|--------|
| **[docs/INDEX.md](docs/INDEX.md)** | 📖 **ドキュメントインデックス（ここから開始！）** | 全員 |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | 🔧 開発環境セットアップガイド | 新規開発者 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 🏗️ アーキテクチャ全体像・設計思想 | 全開発者 |
| [docs/CODE_READING_GUIDE.md](docs/CODE_READING_GUIDE.md) | 📖 コードリーディングガイド | 新規開発者 |
| [CLAUDE.md](CLAUDE.md) | 📋 開発ガイドライン・コーディング規約 | 全開発者 |
| [docs/API.md](docs/API.md) | 📚 Service/Mapper API仕様書 | 実装時参照 |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | 🤝 貢献ガイドライン・PR作成手順 | コントリビューター |

---

## 🚀 クイックスタート

### 必要条件

- Node.js 18以上
- npm
- iOS開発: Xcode 15.0以上（macOSのみ）
- Android開発: Android Studio

### セットアップ（3ステップ）

```bash
# 1. リポジトリをクローン
git clone [repository-url]
cd clipTap

# 2. 依存関係をインストール（npm workspacesで一括）
npm install

# 3. 開発サーバー起動
cd apps/mobile
npm start
```

詳細なセットアップ手順は [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) を参照してください。

---

## 🏗️ プロジェクト構造

ClipTapは**npm workspaces**によるモノレポ構成です。

```
clipTap/
├── apps/
│   ├── mobile/      # React Native (Expo) モバイルアプリ - メイン開発対象
│   └── web/         # React + Vite Webアプリ - 将来的に
├── packages/
│   └── shared/      # mobile/webで共有するロジック・型定義
└── docs/            # プロジェクトドキュメント
```

詳細なディレクトリ構造は [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) を参照してください。

---

## 🛠️ 技術スタック

### Mobile App (apps/mobile)

- **React Native**: 0.81.5
- **Expo SDK**: 54
- **React**: 19.1.0
- **TypeScript**: 5.9.2
- **SQLite**: expo-sqlite 16.0.9
- **ナビゲーション**: Expo Router 6.0.14
- **多言語**: i18next 25.5.2
- **課金**: react-native-purchases 9.6.1 (RevenueCat)
- **認証**: Firebase Authentication

### Web App (apps/web)

- **React**: 19
- **Vite**: 7.2.4
- **TypeScript**: 5.9.3
- **SQLite**: sql.js (WASM)
- **スタイリング**: Tailwind CSS 4.1.17

### Shared Package (packages/shared)

- **TypeScript**: 5.3.3
- **バリデーション**: Zod 4.1.13
- **テスト**: Vitest 4.0.14

---

## 💎 プラン比較

| 機能 | 無料版 | Pro版 |
|------|--------|-------|
| 環境（プロファイル） | 3つまで | **無制限** |
| カスタム変数 | 5個まで | **無制限** |
| 広告表示 | あり | **なし** |
| 価格 | 無料 | 月額¥250 / 年間¥3,000 |

---

## 📊 プロジェクトステータス

- **バージョン**: 1.2.0
- **データベーススキーマ**: V5
- **対応プラットフォーム**: iOS 15.1+、Android 8.0+ (API 24+)
- **新アーキテクチャ**: 対応済み（React Native）
- **JSエンジン**: Hermes

---

## 🤝 貢献について

ClipTapへの貢献を歓迎します！

### 貢献の流れ

1. [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) を読む
2. Issueを作成（バグ報告・機能提案）
3. ブランチを作成（`feature/機能名` または `fix/バグ名`）
4. コードを書く（[CLAUDE.md](CLAUDE.md) の規約に従う）
5. テストを実行（`npx tsc --noEmit`）
6. Pull Requestを作成

詳細は [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) を参照してください。

---

## 📝 ライセンス

プロプライエタリ

---

## 🙋 サポート

### よくある質問

- **Q: どのドキュメントから読めばいい？**
  - A: [docs/INDEX.md](docs/INDEX.md) から開始してください

- **Q: 環境構築でエラーが出る**
  - A: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) のトラブルシューティングを確認

- **Q: コードの書き方がわからない**
  - A: [docs/CODE_READING_GUIDE.md](docs/CODE_READING_GUIDE.md) で似た実装を参照

### 連絡先

質問や不明点があれば、チームメンバーに気軽に相談してください。

---

**開発者向けクイックスタート:**

```bash
# セットアップ
git clone [repository-url] && cd clipTap
npm install

# 開発開始
cd apps/mobile
npm start

# 型チェック
npx tsc --noEmit
```

詳細は [docs/INDEX.md](docs/INDEX.md) を参照してください。

---

<p align="center">
  <strong>Happy Coding! 🎉</strong>
</p>
