# ClipTap ドキュメントインデックス

**Version**: 1.2.0
**Last Updated**: 2025-12-18

**ClipTap**プロジェクトへようこそ！

このドキュメントは、新規参画メンバーがスムーズにプロジェクトを理解し、開発を開始できるよう設計されています。

---

## 📚 ドキュメント一覧

### 1. はじめに読むべきドキュメント

新規参画者は、以下の順序でドキュメントを読むことをお勧めします：

#### ① [README.md](../README.md) - プロジェクト概要
- プロジェクトの目的と主要機能
- 技術スタック概要
- クイックスタート手順

**所要時間**: 5分

---

#### ② [DEVELOPMENT.md](./DEVELOPMENT.md) - 開発環境セットアップ
- 開発環境の構築手順（Node.js, Xcode, Android Studio）
- 初回起動方法
- トラブルシューティング

**所要時間**: 30分〜1時間（環境構築含む）

**こんな人におすすめ**:
- 初めてプロジェクトをクローンした人
- 開発環境でエラーが出て困っている人

---

#### ③ [ARCHITECTURE.md](./ARCHITECTURE.md) - アーキテクチャ全体像
- プロジェクト構造（モノレポ構成）
- 3層アーキテクチャ + Adapter Patternの詳細
- データフロー
- Mobile/Web共有パッケージ設計
- セキュリティ設計

**所要時間**: 30分

**こんな人におすすめ**:
- プロジェクトの全体像を把握したい人
- なぜこの設計になっているのか理解したい人
- 新機能を追加する前に設計を確認したい人

---

#### ④ [CLAUDE.md](../CLAUDE.md) - 開発ガイドライン
- コーディング規約
- 絶対に守るべきルール
- 開発時の注意事項
- リリース前チェックリスト

**所要時間**: 20分

**こんな人におすすめ**:
- コードを書き始める前の人
- コードレビューの基準を知りたい人
- Claude Codeを使って開発する人

---

### 2. コードを理解するためのドキュメント

#### ⑤ [CODE_READING_GUIDE.md](./CODE_READING_GUIDE.md) - コードリーディングガイド
- コードベースの歩き方
- 主要ファイルの説明
- よくある実装パターン（Screen Hook、createContextWithHook、usePicker等）
- プラットフォーム別ガイド（Mobile/Web）
- コードから学ぶベストプラクティス

**所要時間**: 40分

**こんな人におすすめ**:
- コードベースを初めて読む人
- どのファイルから読めばいいかわからない人
- 実装パターンを学びたい人

---

#### ⑥ [API.md](./API.md) - API仕様書
- 共有パッケージ（packages/shared）のAPI仕様
- Service層の全メソッド仕様
- Mapper層の全メソッド仕様
- Hooks API仕様
- Adapterインターフェース仕様
- プラットフォーム固有アダプター一覧

**所要時間**: 必要に応じて参照

**こんな人におすすめ**:
- 特定APIの使い方を知りたい人
- 新しいサービスを追加する人
- Mobile/Web共通ロジックを理解したい人
- リファレンスとして参照したい人

---

#### ⑦ [COMPONENTS.md](./COMPONENTS.md) - コンポーネント仕様書
- Mobile/Webの全コンポーネント一覧
- Props インターフェース
- 使用例とベストプラクティス

**所要時間**: 必要に応じて参照

**こんな人におすすめ**:
- UIコンポーネントの使い方を知りたい人
- 新しいコンポーネントを追加する人
- 既存コンポーネントの再利用を検討している人

---

#### ⑧ [DATABASE.md](./DATABASE.md) - データベース仕様書
- テーブル定義とカラム仕様
- ER図とリレーション
- インデックス設計
- マイグレーション手順

**所要時間**: 20分

**こんな人におすすめ**:
- データベース構造を理解したい人
- 新しいテーブルを追加する人
- データの流れを把握したい人

---

### 3. 貢献するためのドキュメント

#### ⑨ [CONTRIBUTING.md](./CONTRIBUTING.md) - 貢献ガイドライン
- Issue報告方法
- Pull Request作成手順
- コードレビュープロセス
- Git運用ルール

**所要時間**: 15分

**こんな人におすすめ**:
- 初めてPRを出す人
- Issueを作成したい人
- Gitワークフローを確認したい人

---

### 4. テスト・品質管理ドキュメント

テストケースやデータパターンは`test/`フォルダにまとめています：

| ドキュメント | 内容 |
|-------------|------|
| [test/use-cases.md](./test/use-cases.md) | 全ユースケース一覧（85件、16カテゴリ） |
| [test/use-cases-sequences.md](./test/use-cases-sequences.md) | ユースケースのシーケンス図（Mermaid） |
| [test/use-case-patterns.md](./test/use-case-patterns.md) | ユースケースパターン分析 |
| [test/data-patterns.md](./test/data-patterns.md) | テストデータパターン |
| [test/data-sync-patterns.md](./test/data-sync-patterns.md) | データ同期パターン |
| [test/test-specification.md](./test/test-specification.md) | テスト仕様書 |

**こんな人におすすめ**:
- テストを書く人
- 機能の仕様を確認したい人
- エッジケースを理解したい人

---

## 🎯 ユースケース別おすすめドキュメント

### ケース1: 「今日からこのプロジェクトに参画します」

**読む順序**:
1. [README.md](../README.md) - 5分
2. [DEVELOPMENT.md](./DEVELOPMENT.md) - 環境構築 1時間
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - 全体像把握 30分
4. [CLAUDE.md](../CLAUDE.md) - 開発ルール確認 20分
5. [CODE_READING_GUIDE.md](./CODE_READING_GUIDE.md) - コード理解 40分

**合計所要時間**: 約2.5時間

---

### ケース2: 「バグを修正したい」

**読む順序**:
1. [CODE_READING_GUIDE.md](./CODE_READING_GUIDE.md) - 該当コードの場所を特定
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - データフロー確認
3. [API.md](./API.md) - 使用しているAPIの仕様確認
4. [CLAUDE.md](../CLAUDE.md) - コーディング規約確認

---

### ケース3: 「新機能を追加したい」

**読む順序**:
1. [ARCHITECTURE.md](./ARCHITECTURE.md) - 設計パターン確認
2. [CLAUDE.md](../CLAUDE.md) - 開発の優先順位・注意事項確認
3. [API.md](./API.md) - 既存APIの実装パターン学習
4. [CODE_READING_GUIDE.md](./CODE_READING_GUIDE.md) - 似た機能の実装を参照
5. [CONTRIBUTING.md](./CONTRIBUTING.md) - PR作成手順確認

---

### ケース4: 「エラーが出て困っている」

**読む順序**:
1. [DEVELOPMENT.md](./DEVELOPMENT.md) - トラブルシューティング
2. [CLAUDE.md](../CLAUDE.md) - 開発時の注意事項
3. [CODE_READING_GUIDE.md](./CODE_READING_GUIDE.md) - よくあるエラーパターン

---

## 🗂️ ドキュメント構造

```
clipTap/
├── CLAUDE.md                       # Claude Code指示書（開発ガイドライン）
├── README.md                       # プロジェクト概要
└── docs/
    ├── INDEX.md                    # このファイル（ドキュメントインデックス）
    ├── ARCHITECTURE.md             # アーキテクチャ全体像
    ├── CODE_READING_GUIDE.md       # コードリーディングガイド
    ├── API.md                      # API仕様書（共有パッケージ中心）
    ├── COMPONENTS.md               # コンポーネント仕様書
    ├── DATABASE.md                 # データベース仕様書
    ├── DEVELOPMENT.md              # 開発環境セットアップ
    ├── CONTRIBUTING.md             # 貢献ガイドライン
    └── test/                       # テスト・品質管理
        ├── use-cases.md            # ユースケース一覧
        ├── use-cases-sequences.md  # シーケンス図
        ├── use-case-patterns.md    # パターン分析
        ├── data-patterns.md        # データパターン
        ├── data-sync-patterns.md   # 同期パターン
        └── test-specification.md   # テスト仕様書
```

---

## 📖 ドキュメントの更新ルール

### ドキュメント更新が必要なとき

以下の場合、関連ドキュメントの更新が必要です：

1. **新しいServiceやMapperを追加したとき**
   - [API.md](./API.md) に追加
   - [ARCHITECTURE.md](./ARCHITECTURE.md) のレイヤー構造セクションを更新

2. **新しいコンポーネントを追加したとき**
   - [COMPONENTS.md](./COMPONENTS.md) に追加

3. **アーキテクチャに変更があったとき**
   - [ARCHITECTURE.md](./ARCHITECTURE.md) を更新
   - [CODE_READING_GUIDE.md](./CODE_READING_GUIDE.md) の関連セクションを更新

4. **データベーススキーマに変更があったとき**
   - [DATABASE.md](./DATABASE.md) を更新
   - マイグレーション手順を記載

5. **開発環境の構築手順が変わったとき**
   - [DEVELOPMENT.md](./DEVELOPMENT.md) を更新

6. **コーディング規約が変わったとき**
   - [CLAUDE.md](../CLAUDE.md) を更新
   - [CONTRIBUTING.md](./CONTRIBUTING.md) の関連セクションを更新

7. **新しいAdapterを追加したとき**
   - [API.md](./API.md) のAdapter層セクションを更新
   - [ARCHITECTURE.md](./ARCHITECTURE.md) のAdapter一覧を更新

### ドキュメント更新のベストプラクティス

- コードの変更とドキュメントの更新は**同じPR**に含める
- ドキュメントの更新忘れを防ぐため、PRテンプレートにチェックリストを含める
- 大きな機能追加の場合、ドキュメントレビューも実施する

---

## 🆘 困ったときの相談先

### よくある質問（FAQ）

#### Q1: どのドキュメントから読めばいい？
**A**: まずは [README.md](../README.md) → [DEVELOPMENT.md](./DEVELOPMENT.md) → [ARCHITECTURE.md](./ARCHITECTURE.md) の順で読んでください。

#### Q2: コードの書き方がわからない
**A**: [CODE_READING_GUIDE.md](./CODE_READING_GUIDE.md) で似た実装を探し、[CLAUDE.md](../CLAUDE.md) でコーディング規約を確認してください。

#### Q3: 環境構築でエラーが出る
**A**: [DEVELOPMENT.md](./DEVELOPMENT.md) のトラブルシューティングセクションを確認してください。

#### Q4: 新機能を追加したいけど、どこに書けばいい？
**A**: [ARCHITECTURE.md](./ARCHITECTURE.md) で3層アーキテクチャ+Adapter Patternを理解し、[CODE_READING_GUIDE.md](./CODE_READING_GUIDE.md) で似た機能の実装を参照してください。

#### Q5: PRを出す前に何を確認すればいい？
**A**: [CLAUDE.md](../CLAUDE.md) のリリース前チェックリストと [CONTRIBUTING.md](./CONTRIBUTING.md) のPR作成手順を確認してください。

#### Q6: Mobile/Webで共通のロジックを追加したい
**A**: `packages/shared/src/` に追加し、[API.md](./API.md) のService層またはHooks層に仕様を追加してください。

---

## 🚀 まとめ

ClipTapプロジェクトへの参画、ありがとうございます！

このドキュメントインデックスを起点に、必要なドキュメントを読み進めてください。
質問や不明点があれば、チームメンバーに気軽に相談してください。

**Happy Coding!**
