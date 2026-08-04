# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 📚 最初に読むべきドキュメント

**作業開始前に必ず [docs/機能仕様書.md](docs/機能仕様書.md) を確認してください。**

### ドキュメント構造

| ドキュメント | 内容 | いつ読むか |
|-------------|------|-----------|
| [docs/機能仕様書.md](docs/機能仕様書.md) | 機能、画面、外部IF、DB、非機能、未確定事項の正本 | 最初に必ず。仕様変更前 |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | 環境構築・トラブルシューティング | セットアップ時・エラー時 |
| [docs/MARKETING_STRATEGY.md](docs/MARKETING_STRATEGY.md) | グロース・マーケティング戦略 | マーケティング施策の検討時 |

### このファイル（CLAUDE.md）の役割

このファイルには **日々の開発で絶対に守るべきルール** のみを記載しています。
機能仕様は `docs/機能仕様書.md`、環境構築・実装上の手順は `docs/DEVELOPMENT.md` を参照してください。

### 仕様書の運用ルール

- 利用者向け動作、プラン、画面、入出力、外部IF、DB、最低OSを変更するときは、実装と同じ変更で `docs/機能仕様書.md` を更新する。
- 機能別の重複仕様書を新設しない。詳細が必要な場合も正本から参照できる形にする。
- 実装と公開文書の差を発見したら、黙って既存記述を消さず、第15章「未確定事項」に根拠と影響を記録する。
- 差異の方針が確定したら、実装または仕様書の誤っている側を同じ変更で修正し、未確定事項を解消する。
- アプリ版は `apps/mobile/app.json`、DB版は共通スキーマ定義を正として確認する。

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
- **アプリバージョン**: 1.2.1
- **データベーススキーマ**: V7
- **対応OS**: iOS 15.1以上、Android 7.0 (API 24) 以上
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

**機能・データ設計の詳細**: [docs/機能仕様書.md](docs/機能仕様書.md) を参照

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

**機能上の責務とデータ設計**: [docs/機能仕様書.md](docs/機能仕様書.md) を参照

---

## Claude Codeへの重要な指示

### 🚨 絶対に守るべきルール

#### 1. **データベースアクセス**
- **Mapper経由必須**: 直接SQLを書くことは絶対に禁止
- 既存のMapper（SnippetMapper, CategoryMapper等）を必ず使用
- 新しいテーブルを追加する場合は、既存のMapperパターンに従って新しいMapperを作成（静的メソッドで実装）

#### 2. **型安全性**
- すべてのコードはTypeScript型チェックに合格すること
- `npm run type-check`で全ワークスペースのエラー0件を保証
- `any`型の使用は最小限に（やむを得ない場合のみ）

#### 3. **オフライン動作**
- ネットワーク接続を前提としないこと
- すべての機能はオフラインで完全動作必須
- サブスクリプション確認以外は外部通信禁止
- 定型文、カテゴリ、プロファイル、変数の業務データはネットワーク接続を前提としないこと
- 認証、サブスクリプション、広告、ストア遷移は外部通信を行うため、失敗してもローカル業務機能を壊さないこと
- 業務データをFirebaseやRevenueCatへ同期しないこと

上記の既存オフラインルールはコア業務機能の目標として維持する。現行の外部通信例外と障害時挙動は `docs/機能仕様書.md` を正とする。

#### 4. **UIレスポンス速度**
- タップ操作は即座に反応（100ms以内）
- コピー操作は遅延なし
- 検索デバウンスは300ms固定

#### 5. **多言語対応**
- すべてのユーザー向けテキストは i18next 経由
- ハードコードされた日本語・英語文字列は禁止
- 新しい共有テキストを追加する際は、`packages/shared/src/i18n/ja.json` と `packages/shared/src/i18n/en.json` の両方に追加

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
- エクスポートデータはパスワード一致確認 + チェックサム検証（暗号化・機密性保護ではない）

#### サブスクリプション管理
- App Store/Google Play の領収書検証必須
- 不正な課金回避を検知
- テスト環境と本番環境を明確に分離

#### エクスポート・インポート
- パスワード + バージョンのSHA-256ハッシュ化
- 全フィールドのチェックサム検証（改竄検知）
- アプリバージョンが異なる場合はエラー
- チェックサムが存在するファイルは必ず検証
- `.cliptap` の二重Base64を暗号化と表現しない
- 現行より新しいDBスキーマは拒否し、対応する旧スキーマは移行して読み込む

後半3項目が現行実装の事実であり、前半の既存ルールとの差は機能仕様書の未確定事項として解消する。

---

### 🛠️ 開発時の注意事項

#### データベースマイグレーション
- 新しいテーブル・カラムを追加する際は必ず新しいマイグレーションファイルを作成
- 既存のマイグレーションファイルは**絶対に編集しない**
- 新しいテーブル・カラムを追加する際は、共通マイグレーションに新しい連続した版の処理を追加する
- リリース済みの移行処理は原則変更せず、修正が必要な場合は旧版fixtureの回帰テストを伴わせる
- マイグレーションは順次実行される前提で設計

現行は共通の単一マイグレーションファイルで管理しているため、新規変更は既存のリリース済みステップを書き換えず、同ファイルへ新しい連続ステップとして追加する。

#### Web版ベースファイル（`.cliptap`）の再生成
- Web版のファイル読込画面は、モバイルアプリ未所持でも開始できるよう `apps/web/public/starter_v{SCHEMA_VERSION}_{ja,en}.cliptap` を配布している
- **`SCHEMA_VERSION` を更新したら、必ず再生成してコミットすること**
  ```bash
  npm run generate:starter --workspace=@cliptap/web
  ```
- サンプルデータの定義は `apps/web/scripts/starterData.json`、生成処理は `apps/web/scripts/generateStarterFile.mjs`
- スキーマ定義・エクスポート形式・パスワードは実装から読み込むため、生成スクリプト側に再定義しないこと
- ファイル名に `SCHEMA_VERSION` を含めているため、再生成漏れ時は古いファイルが配信されずダウンロードが404になる（静かに壊れない設計）

#### iOS ネイティブファイルの追加
- **ClipTap（メインアプリ）またはClipTapKeyboard（拡張キーボード）にSwift/Objective-Cファイルを追加する際は、必ず`project.pbxproj`を更新すること**
- 更新が必要なセクション:
  1. `PBXFileReference` - ファイル参照を追加
  2. `PBXGroup` - 対象グループ（ClipTapまたはClipTapKeyboard）のchildrenに追加
  3. `PBXBuildFile` - ビルドファイルエントリを追加
  4. `PBXSourcesBuildPhase` - 対象ターゲットのソースビルドフェーズに追加
- 既存の類似ファイル（例: SubscriptionBridge.swift/m）のパターンを参考にすること
- UUIDは24文字の16進数で一意に生成すること

#### iOS リソースファイルの追加（.strings / .plist / 画像など）
- **ソースファイルと同様に`project.pbxproj`への登録が必須**。登録漏れはビルドエラーにならず、実行時に静かに機能が壊れるため特に注意すること
- 更新が必要なセクション（4番目がソースファイルと異なる）:
  1. `PBXFileReference` - ファイル参照を追加
  2. `PBXGroup` - 対象グループのchildrenに追加
  3. `PBXBuildFile` - ビルドファイルエントリを追加
  4. `PBXResourcesBuildPhase` - 対象ターゲットの**リソース**ビルドフェーズに追加
- ローカライズファイル（`xx.lproj/`配下）を追加する場合は、加えて`knownRegions`に言語コードを登録すること
- **ローカライズが1つも同梱されていないターゲットでは`Locale.current`が開発言語（en）を返す**ため、日付・曜日などの言語判定が壊れる。言語判定には`Locale.preferredLanguages`を使用すること
- 登録後は `plutil -lint ios/ClipTap.xcodeproj/project.pbxproj` で構文を検証すること

#### ⚠️ `expo prebuild --clean` の実行禁止
- `ios/`はBare Workflowのためコミット済み。`--clean`付きprebuildは`ios/`を再生成し、**ClipTapKeyboardターゲットごと手動設定が全て失われる**
- **`apps/mobile`ディレクトリでの`npm run clean`**はこれを実行するため使用しないこと（依存関係のリセットは`rm -rf node_modules && npm install`で行う）
- リポジトリルートの`npm run prebuild`は`--clean`なしのため`ios/`は再生成されないが、不要な実行は避けること
- ビルドは成功してしまい実行時に静かに壊れるため、失われたことに気付きにくい
- EASビルドは`eas.json`の`prebuildCommand`でprebuildをスキップするため影響を受けない

#### テストとデバッグ
- 型チェック: `npm run type-check`
- iOS実行: `npm run ios`
- Android実行: `npm run android`
- キャッシュクリア: `npm run dev:mobile -- -- --clear`（`--`が2つ必要。1つだとnpmの二重run時に`--clear`が転送されず効かない）

#### サブスクリプションテスト
- **Android**: テスト環境では期間が短縮される（1ヶ月→5分、1年→30分）
- **iOS**: Sandbox環境では期間が短縮される（1ヶ月→5分、1年→1時間）
- これは正常な動作（Google/Appleの仕様）

---

### 🚀 リリース前チェックリスト

#### 必須確認事項
- [ ] TypeScript型エラー0件（`npm run type-check`）
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

### 🛠️ コミット・マイグレーション確認

#### コミット前の必須チェック
```bash
npm run type-check    # 型エラー0件を確認
```

#### データベースマイグレーション
- 既存のマイグレーションファイルは**絶対に編集しない**
- 新しいテーブル・カラム追加時は新しいマイグレーションファイルを作成
- 共通マイグレーションへ新しい連続版を追加する
- リリース済み移行の修正には旧版fixtureの回帰テストを追加する

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

- **機能仕様・DB設計**: [docs/機能仕様書.md](docs/機能仕様書.md) を確認
- **実装パターン**: リポジトリ内の同種機能と型定義を検索して確認
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

機能仕様は [docs/機能仕様書.md](docs/機能仕様書.md)、開発手順は [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) から確認してください。
