# ClipTap Web

ブラウザで定型文を管理・編集できるWebアプリケーション。

## 技術スタック

- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- sql.js (SQLite Wasm)
- Zustand (状態管理)
- React Router

## 機能

- .cliptapファイルのインポート/エクスポート
- 定型文のCRUD操作
- カテゴリ管理
- 環境（プロファイル）管理
- カスタム変数管理
- 変数展開（システム変数・カスタム変数）
- IndexedDBキャッシュ
- RevenueCatによるサブスクリプション確認

## 開発

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# プレビュー
npm run preview
```

## 環境変数

`.env.example`を参考に`.env`ファイルを作成してください。

```
# Firebase設定（必須）
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# AdSense設定（オプション）
VITE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXXXX
VITE_ADSENSE_SLOT_ID=XXXXXXXXXX
```

## Vercelへのデプロイ

1. GitHubにリポジトリをプッシュ
2. Vercelでプロジェクトをインポート
3. 環境変数を設定（AdSense IDなど）
4. デプロイ

### Vercel設定

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

## ライセンス

Private
