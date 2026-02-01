# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 📚 最初に読むべきドキュメント

**作業開始前に必ず [docs/INDEX.md](docs/INDEX.md) を確認してください。**

### ドキュメント構造

| ドキュメント | 内容 | いつ読むか |
|-------------|------|-----------|
| [docs/INDEX.md](docs/INDEX.md) | ドキュメントインデックス | 最初に必ず |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 3層アーキテクチャ・データフロー | 設計理解・新機能追加前 |
| [docs/CODE_READING_GUIDE.md](docs/CODE_READING_GUIDE.md) | コードの読み方・実装パターン | コーディング前 |
| [docs/API.md](docs/API.md) | Service/Mapper API仕様 | 実装時の参照用 |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | 環境構築・トラブルシューティング | セットアップ時・エラー時 |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Git運用・PR作成手順 | コミット・PR作成前 |

### このファイル（CLAUDE.md）の役割

このファイルには **日々の開発で絶対に守るべきルール** のみを記載しています。
詳細な技術仕様・実装パターン・アーキテクチャは `docs/` を参照してください。

---

## プロジェクト概要

**ClipTap** - 定型文・コードスニペットをワンタップでコピーできる超シンプルなモバイル・Webアプリ。

### コアコンセプト
- **ワンタップコピー**: 登録したテキストを即座にクリップボードへコピー
- **ローカルファースト**: オフラインで完全動作、プライバシー重視
- **超軽量UI**: 最小の操作で最大の生産性を実現
- **クロスプラットフォーム**: iOS、Android、Webで統一されたUX
- **Proプラン**: 広告なし・環境管理無制限・カスタム変数無制限（月額¥250/年間¥3,000）

### 技術スタック

**モノレポ構成**: npm workspaces

**Mobile App (apps/mobile)**:
- **フレームワーク**: Expo SDK 54 + React Native 0.81.5
- **React**: 19.1.0
- **TypeScript**: 5.9.2
- **スタイリング**: 統合テーマシステム（`src/themeSystem.tsx`）+ StyleSheet
- **データベース**: SQLite (expo-sqlite 16.0.10) + Repository Pattern
- **ナビゲーション**: Expo Router 6.0.19
- **多言語**: i18next 25.5.2
- **状態管理**: React Context + Custom Hooks
- **広告**: react-native-google-mobile-ads 15.8.3 (AdMob)
- **課金**: react-native-purchases 9.6.1 (RevenueCat)
- **認証**: Firebase Authentication

**Web App (apps/web)**:
- **フレームワーク**: React 19 + Vite 7.2.4
- **TypeScript**: 5.9.3
- **データベース**: sql.js (WASM)
- **スタイリング**: Tailwind CSS 4.1.17

**Shared Package (packages/shared)**:
- **TypeScript**: 5.3.3
- **バリデーション**: Zod 4.1.13
- **テスト**: Vitest 4.0.14

### 現在のバージョン情報
- **アプリバージョン**: 1.2.0
- **データベーススキーマ**: V5
- **対応OS**: iOS 15.1以上、Android 8.0 (API 24) 以上
- **新アーキテクチャ**: 対応済み（React Native）
- **JSエンジン**: Hermes

---

## 開発コマンド（クイックリファレンス）

```bash
npm run type-check             # 型チェック（コミット前に必須）
```

**詳細**: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) を参照

---

## アーキテクチャ概要

### 3層アーキテクチャ

```
UI Layer (app/, src/components/)
    ↓ useSnippets(), useCategories()
Service Layer (packages/shared/src/services/, src/hooks/)
    ↓ snippetMapper.getAll()
Data Access Layer (packages/shared/src/mappers/)
    ↓ SQL queries
Database (SQLite)
```

**詳細**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) を参照

---

## 主要なディレクトリ

```
clipTap/
├── apps/
│   ├── mobile/          # React Native (Expo) モバイルアプリ
│   │   ├── app/        # 画面（Expo Router）
│   │   └── src/        # コアロジック
│   │       ├── components/ # 再利用可能なコンポーネント
│   │       ├── adapters/   # プラットフォーム固有アダプター
│   │       ├── database/   # SQLite管理
│   │       ├── hooks/      # カスタムフック
│   │       └── types/      # TypeScript型定義
│   └── web/            # React + Vite Webアプリ
└── packages/
    └── shared/         # mobile/webで共有するロジック・型定義
        └── src/
            ├── mappers/    # データアクセス層
            ├── services/   # ビジネスロジック層
            ├── providers/  # 共有Context Provider
            ├── hooks/      # 共有カスタムフック
            ├── adapters/   # プラットフォーム抽象化インターフェース
            ├── database/   # スキーマ定義
            ├── utils/      # 共通ユーティリティ
            └── types/      # 型定義・Zodスキーマ
```

**詳細**: [docs/CODE_READING_GUIDE.md](docs/CODE_READING_GUIDE.md) を参照

---

## Claude Codeへの重要な指示

### 🚨 絶対に守るべきルール

#### 1. **データベースアクセス**
- **Mapper経由必須**: 直接SQLを書くことは絶対に禁止
- 既存のMapper（SnippetMapper, CategoryMapper等）を必ず使用
- 新しいテーブルを追加する場合は、既存のMapperパターンに従って新しいMapperを作成（静的メソッドで実装）

#### 2. **型安全性**
- すべてのコードはTypeScript型チェックに合格すること
- `npx tsc --noEmit`でエラー0件を保証
- `any`型の使用は最小限に（やむを得ない場合のみ）

#### 3. **オフライン動作**
- ネットワーク接続を前提としないこと
- すべての機能はオフラインで完全動作必須
- サブスクリプション確認以外は外部通信禁止

#### 4. **UIレスポンス速度**
- タップ操作は即座に反応（100ms以内）
- コピー操作は遅延なし
- 検索デバウンスは300ms固定

#### 5. **多言語対応**
- すべてのユーザー向けテキストは i18next 経由
- ハードコードされた日本語・英語文字列は禁止
- 新しいテキストを追加する際は、ja/translation.json と en/translation.json 両方に追加

#### 6. **テーマシステム**
- すべてのカラーは `src/themeSystem.tsx` から取得
- ハードコードされた色コードは禁止
- ダークモード対応を常に意識

---

### 📋 コーディング規約

#### コンポーネント設計
- **1コンポーネント1責務**: 機能ごとに分割
- **Propsは明示的な型定義**: `interface Props` を必ず定義
- **useEffect依存配列**: 必ず正確に指定（ESLintの警告を無視しない）
- **コメント**: JSXコメントを必ず付与

#### 命名規則
- **ファイル名**: PascalCase（コンポーネント）、camelCase（ユーティリティ）
- **コンポーネント名**: PascalCase
- **関数名**: camelCase（動詞から始める）
- **定数名**: UPPER_SNAKE_CASE
- **型名**: PascalCase

#### パフォーマンス
- **リスト表示**: FlashList を使用（FlatListは使用禁止）
- **メモ化**: useMemo/useCallback を適切に使用
- **検索**: デバウンス処理必須（300ms）
- **画像**: 最適化されたサイズで配信

#### ESLint
- **eslint-disable禁止**: `eslint-disable`、`eslint-disable-next-line`、`eslint-disable-line` のコメントは使用禁止
- ESLintエラーは根本的に解決すること（例: 循環参照はアーキテクチャで回避）
- どうしても必要な場合は、事前にユーザーに確認し承認を得ること

#### その他注意事項
- 後方互換性の処理は実装禁止
- コメントはJSDocスタイル(ただし@exampleは禁止)
- コメントは必ずブロックコメント(/**/)で実装すること
- 文言のハードコーディングは禁止(packages/shared/src/i18n/*jsonで管理すること)

---

### 🎨 UI/UX ガイドライン

#### インタラクション
- **最小タップ数**: すべての操作を3タップ以内で完結
- **タップ可能領域**: 最小44x44dp（iOS HIG準拠）
- **長押し時間**: 500ms固定
- **振動フィードバック**: コピー時は必ず Haptics.Light

#### アニメーション
- **アニメーション速度**: 100ms以内（軽快さ重視）
- **useNativeDriver**: 必ず true に設定
- **過度なアニメーションは禁止**: シンプル維持

#### フィードバック
- **トースト表示**: 1.5秒固定
- **エラーメッセージ**: 具体的で分かりやすく
- **ローディング**: 500ms以上かかる処理のみ表示

#### 広告配置（無料プランのみ）
- **位置**: 画面下部に固定表示
- **種類**: バナー広告のみ（インタースティシャル・リワード広告は禁止）
- **Proプラン**: 広告完全非表示

---

### 🔒 セキュリティとプライバシー

#### データ保護
- すべてのデータは端末内ローカル保存
- クラウド同期なし（ユーザーのプライバシー重視）
- エクスポートデータはパスワード保護 + チェックサム検証

#### サブスクリプション管理
- App Store/Google Play の領収書検証必須
- 不正な課金回避を検知
- テスト環境と本番環境を明確に分離

#### エクスポート・インポート
- パスワード + バージョンのSHA-256ハッシュ化
- 全フィールドのチェックサム検証（改竄検知）
- アプリバージョンが異なる場合はエラー

---

---

### 🛠️ 開発時の注意事項

#### データベースマイグレーション
- 新しいテーブル・カラムを追加する際は必ず新しいマイグレーションファイルを作成
- 既存のマイグレーションファイルは**絶対に編集しない**
- マイグレーションは順次実行される前提で設計

#### iOS ネイティブファイルの追加
- **ClipTap（メインアプリ）またはClipTapKeyboard（拡張キーボード）にSwift/Objective-Cファイルを追加する際は、必ず`project.pbxproj`を更新すること**
- 更新が必要なセクション:
  1. `PBXFileReference` - ファイル参照を追加
  2. `PBXGroup` - 対象グループ（ClipTapまたはClipTapKeyboard）のchildrenに追加
  3. `PBXBuildFile` - ビルドファイルエントリを追加
  4. `PBXSourcesBuildPhase` - 対象ターゲットのソースビルドフェーズに追加
- 既存の類似ファイル（例: SubscriptionBridge.swift/m）のパターンを参考にすること
- UUIDは24文字の16進数で一意に生成すること

#### テストとデバッグ
- 型チェック: `npx tsc --noEmit`
- iOS実行: `npm run ios`
- Android実行: `npm run android`
- キャッシュクリア: `expo start --clear`

#### サブスクリプションテスト
- **Android**: テスト環境では期間が短縮される（1ヶ月→5分、1年→30分）
- **iOS**: Sandbox環境では期間が短縮される（1ヶ月→5分、1年→1時間）
- これは正常な動作（Google/Appleの仕様）

---

### 🚀 リリース前チェックリスト

#### 必須確認事項
- [ ] TypeScript型エラー0件（`npx tsc --noEmit`）
- [ ] すべての文字列が i18next 経由
- [ ] オフライン動作確認
- [ ] iOS/Android両方で動作確認
- [ ] ダークモード対応確認
- [ ] 広告表示確認（無料プランのみ）
- [ ] サブスクリプション動作確認（Pro機能制限）
- [ ] エクスポート・インポート動作確認

#### App Store/Google Play 提出前
- プライバシーポリシー最新版（クリップボード使用、AdMob広告、サブスクリプション）
- スクリーンショット最新版（iOS: 6.7"と5.5"、Android: 複数サイズ）
- アプリ説明文のキーワード最適化

---

### 📝 コード変更時のお約束

#### 新機能追加時
1. 既存の機能を壊さないことを最優先
2. 既存のアーキテクチャ（Mapper/Service/Hooks）に従う
3. 必ずテストして動作確認
4. 翻訳ファイル（ja/en）を忘れずに更新

#### バグ修正時
1. 根本原因を理解してから修正
2. 同じバグが他の場所にないか確認
3. 修正後は必ず動作確認

#### リファクタリング時
1. 小さな変更に分割
2. 1つずつテストしながら進める
3. 過度な最適化は避ける（シンプルさを優先）

---

### 🎯 開発の優先順位

### 🛠️ 開発時の注意事項

#### コミット前の必須チェック
```bash
npm run type-check    # 型エラー0件を確認
```

#### データベースマイグレーション
- 既存のマイグレーションファイルは**絶対に編集しない**
- 新しいテーブル・カラム追加時は新しいマイグレーションファイルを作成

**詳細**: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) を参照

---

### ❌ 絶対にやってはいけないこと

1. **直接SQL実行** - Mapper経由必須
2. **ハードコードされたテキスト** - i18next経由必須
3. **ハードコードされた色** - themeSystem経由必須
4. **FlatListの使用** - FlashList使用必須
5. **既存マイグレーションの編集** - 新しいマイグレーションを追加
6. **eslint-disableコメント** - ESLintエラーは根本的に解決すること

---

### 💡 困ったときは

- **実装パターン**: [docs/CODE_READING_GUIDE.md](docs/CODE_READING_GUIDE.md) で似た実装を探す
- **API仕様**: [docs/API.md](docs/API.md) でメソッド仕様を確認
- **エラー解決**: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) のトラブルシューティング

---

## 開発の基本方針

### 優先順位

1. **ユーザー体験** - 速度、シンプルさ、直感性
2. **データ安全性** - ローカルストレージの信頼性
3. **型安全性** - TypeScriptの恩恵を最大限に
4. **保守性** - 読みやすく、理解しやすいコード
5. **パフォーマンス** - 必要な場合のみ最適化

### コード変更時の原則

**新機能追加時**:
1. 既存の機能を壊さない
2. 既存のアーキテクチャ（Mapper/Service/Hooks）に従う
3. 翻訳ファイル（ja/en）を忘れずに更新

**バグ修正時**:
1. 根本原因を理解してから修正
2. 同じバグが他の場所にないか確認

**リファクタリング時**:
1. 小さな変更に分割
2. 過度な最適化は避ける（シンプルさを優先）

---

## 最後に

このプロジェクトは**シンプルさ**を最優先に設計されています。

**ユーザーが求めているのは、高速で、シンプルで、確実に動作するアプリです。**

詳細な技術仕様・実装パターン・開発手順は [docs/INDEX.md](docs/INDEX.md) から始めてください。
