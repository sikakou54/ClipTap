# Expo App Template

量産型アプリ開発のための Expo + React Native テンプレート

## ✨ 主な機能

- 🎨 **統合テーマシステム** - ライト/ダークモード自動切替
- 🧩 **共通コンポーネント** - ボタン、入力、ピッカー等
- 🗄️ **Repository Pattern** - 型安全なデータベース（SQLite）
- 🌐 **多言語対応** - i18next（日本語・英語）
- 🎣 **カスタムフック** - useToggle、useDebounce、useRefSync等

## 🚀 クイックスタート

```bash
# テンプレートをコピー
cp -r expo-app-template my-new-app
cd my-new-app

# セットアップ
npm install
npm start

# プラットフォーム選択
# i → iOS Simulator
# a → Android Emulator
# w → Webブラウザ
```

デモ画面（`/demo`）で全コンポーネントを確認できます。

## 📚 ドキュメント

詳細なドキュメントは [CLAUDE.md](CLAUDE.md) を参照してください。

- プロジェクト概要
- 開発コマンド
- アーキテクチャ
- コンポーネント使用方法
- よくある開発タスク
- トラブルシューティング

## 📦 技術スタック

- Expo SDK 53 + React Native 0.79
- TypeScript 5.8
- Expo Router 5
- expo-sqlite
- i18next

## 📝 ライセンス

MIT
