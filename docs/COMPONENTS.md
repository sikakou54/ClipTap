# ClipTap コンポーネント仕様書

**Version**: 1.2.0
**Last Updated**: 2025-12-18

---

## 目次

- [概要](#概要)
- [Mobile コンポーネント](#mobile-コンポーネント)
  - [Layout](#layout)
  - [Common](#common)
  - [Pickers](#pickers)
  - [Snippet](#snippet)
  - [Category](#category)
  - [Profile](#profile)
  - [Variable](#variable)
  - [Import](#import)
  - [Modal](#modal)
- [Web コンポーネント](#web-コンポーネント)
  - [Layout](#web-layout)
  - [Modal](#web-modal)
  - [Import](#web-import)
- [共通パターン](#共通パターン)

---

## 概要

ClipTapのコンポーネントは、再利用性と一貫性を重視した設計になっています。

### 設計原則

1. **Single Responsibility**: 各コンポーネントは1つの責務のみを持つ
2. **Props型定義**: すべてのPropsはTypeScriptインターフェースで型定義
3. **テーマ連携**: すべてのカラー・スペーシングはテーマシステムから取得
4. **i18n対応**: ユーザー向けテキストはすべて翻訳キー経由
5. **メモ化**: 高頻度更新コンポーネントは`React.memo()`で最適化

### ディレクトリ構造

```
apps/mobile/src/components/
├── layout/          # レイアウトコンポーネント
├── common/          # 汎用コンポーネント
├── pickers/         # ピッカーコンポーネント
├── snippet/         # スニペット関連
├── category/        # カテゴリ関連
├── profile/         # プロファイル関連
├── variable/        # 変数関連
├── import/          # インポート関連
├── selection/       # 選択関連（エクスポート/インポート選択）
├── settings/        # 設定関連（アカウント、サブスク）
├── ads/             # 広告関連
├── UnifiedModal.tsx # 統一モーダル
└── ModalFooter.tsx  # モーダルフッター

apps/web/src/components/
├── auth/            # 認証関連（4ファイル）
├── category/        # カテゴリ関連（5ファイル）
├── common/          # 共通UI（6ファイル）
├── dashboard/       # ダッシュボード関連（5ファイル）
├── export/          # エクスポート関連（1ファイル）
├── home/            # ホーム画面関連（7ファイル）
├── import/          # インポート関連（3ファイル）
├── layout/          # レイアウト関連（2ファイル）
├── profile/         # プロファイル関連（6ファイル）
├── settings/        # 設定関連（4ファイル）
├── snippet/         # スニペット関連（16ファイル）
└── variable/        # 変数関連（7ファイル）
```

---

## Mobile コンポーネント

### Layout

---

#### IconSectionHeader

アイコン付きセクションヘッダー。

**パス**: `components/layout/IconSectionHeader.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| icon | `keyof typeof Ionicons.glyphMap` | ◯ | - | アイコン名 |
| title | `string` | ◯ | - | セクションタイトル |
| variant | `'primary' \| 'success' \| 'warning' \| 'danger'` | - | `'primary'` | バリアント |
| subtitle | `string` | - | - | サブタイトル |

**使用例**:
```tsx
<IconSectionHeader
  icon="settings-outline"
  title="設定"
  variant="primary"
  subtitle="アプリの設定を変更"
/>
```

---

#### ScreenContainer

画面全体のコンテナ。

**パス**: `components/layout/ScreenContainer.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| children | `React.ReactNode` | ◯ | - | 子要素 |
| scrollable | `boolean` | - | `true` | スクロール可能か |
| safeArea | `boolean` | - | `true` | セーフエリア対応 |
| style | `ViewStyle` | - | - | コンテナスタイル |
| contentContainerStyle | `ViewStyle` | - | - | コンテンツコンテナスタイル |
| paddingBottom | `number` | - | - | 下部パディング |

---

### Common

---

#### Header

画面ヘッダー。

**パス**: `components/common/Header.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| title | `string` | ◯ | - | タイトル |
| showBackButton | `boolean` | - | `false` | 戻るボタン表示 |
| backIcon | `keyof typeof Ionicons.glyphMap` | - | `'arrow-back'` | 戻るボタンアイコン |
| onBack | `() => void` | - | `router.back()` | 戻るハンドラ |
| rightAction | `React.ReactNode` | - | - | 右側アクション |
| backgroundColor | `string` | - | テーマ色 | 背景色 |
| isModal | `boolean` | - | `false` | モーダル内表示 |

| 備考 | 内容 |
|------|------|
| レスポンシブ | タブレット/スマホ対応 |
| デフォルト動作 | `router.back()`を呼び出し |

---

#### CommonInput

汎用テキスト入力。

**パス**: `components/common/CommonInput.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| type | `'text' \| 'email' \| 'password' \| 'number' \| 'multiline'` | - | `'text'` | 入力タイプ |
| label | `string` | - | - | ラベル |
| error | `string` | - | - | エラーメッセージ |
| helperText | `string` | - | - | ヘルパーテキスト |
| icon | `keyof typeof Ionicons.glyphMap` | - | - | 左アイコン |
| rightIcon | `keyof typeof Ionicons.glyphMap` | - | - | 右アイコン |
| onRightIconPress | `() => void` | - | - | 右アイコン押下 |
| containerStyle | `ViewStyle` | - | - | コンテナスタイル |
| inputStyle | `TextStyle` | - | - | 入力スタイル |
| required | `boolean` | - | `false` | 必須フラグ |
| validateOnChange | `boolean` | - | `false` | 変更時バリデーション |
| validator | `(value: string) => { isValid: boolean; error?: string }` | - | - | バリデーター |
| onValidationChange | `(isValid: boolean, error?: string) => void` | - | - | バリデーション変更 |

| 備考 | 内容 |
|------|------|
| 継承 | `TextInputProps`を継承（style除く） |

---

#### CommonButton

汎用ボタン。

**パス**: `components/common/CommonButton.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| title | `string` | ◯ | - | ボタンタイトル |
| onPress | `() => void` | ◯ | - | 押下ハンドラ |
| type | `'primary' \| 'secondary' \| 'danger' \| 'success' \| 'warning' \| 'ghost' \| 'outline'` | - | `'primary'` | ボタンタイプ |
| size | `'small' \| 'medium' \| 'large'` | - | `'medium'` | サイズ |
| disabled | `boolean` | - | `false` | 無効状態 |
| loading | `boolean` | - | `false` | ローディング |
| icon | `keyof typeof Ionicons.glyphMap` | - | - | アイコン |
| iconPosition | `'left' \| 'right'` | - | `'left'` | アイコン位置 |
| fullWidth | `boolean` | - | `false` | 幅100% |
| maxWidth | `number` | - | - | 最大幅 |
| style | `ViewStyle` | - | - | スタイル |
| enableHaptics | `boolean` | - | `true` | ハプティクス有効 |

---

#### LoadingSpinner

ローディング表示。

**パス**: `components/common/LoadingSpinner.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| message | `string` | - | - | メッセージ |
| size | `'small' \| 'medium' \| 'large'` | - | `'medium'` | サイズ |
| fullScreen | `boolean` | - | `false` | 全画面表示 |

---

#### EmptyState

空状態の表示。

**パス**: `components/common/EmptyState.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| icon | `keyof typeof Ionicons.glyphMap` | - | - | アイコン |
| message | `string` | ◯ | - | メッセージ |
| description | `string` | - | - | 説明 |
| variant | `'default' \| 'compact' \| 'large'` | - | `'default'` | バリアント |
| actionLabel | `string` | - | - | アクションラベル |
| onActionPress | `() => void` | - | - | アクション押下 |

---

#### Drawer

サイドドロワー。

**パス**: `components/common/Drawer.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| visible | `boolean` | ◯ | - | 表示状態 |
| onClose | `() => void` | ◯ | - | 閉じるハンドラ |

| 備考 | 内容 |
|------|------|
| 機能 | 環境切り替え、設定画面へのリンク |

---

#### SplashScreen

スプラッシュ画面。

**パス**: `components/common/SplashScreen.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| onFinish | `() => void` | ◯ | - | 完了ハンドラ |
| isLoading | `boolean` | - | `false` | ローディング状態 |
| onReady | `() => void` | - | - | 準備完了ハンドラ |

---

### Pickers

---

#### BasePickerProps（共通）

全ピッカーの共通Props。

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| visible | `boolean` | ◯ | - | 表示状態 |
| onClose | `() => void` | ◯ | - | 閉じるハンドラ |
| title | `string` | ◯ | - | タイトル |
| subtitle | `string` | - | - | サブタイトル |
| confirmText | `string` | - | - | 確定テキスト |
| cancelText | `string` | - | - | キャンセルテキスト |
| showCancel | `boolean` | - | `true` | キャンセル表示 |
| maxHeight | `DimensionValue` | - | - | 最大高さ |

---

#### DatePicker

日付選択ピッカー。

**パス**: `components/pickers/DatePicker.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| label | `string` | - | - | ラベル |
| value | `Date` | ◯ | - | 選択値 |
| onChange | `(date: Date) => void` | ◯ | - | 変更ハンドラ |
| minimumDate | `Date` | - | - | 最小日付 |
| maximumDate | `Date` | - | - | 最大日付 |

| 備考 | 内容 |
|------|------|
| iOS | BottomSheetModal使用 |
| Android | ネイティブピッカー使用 |
| ロケール | 日本語対応 |

---

#### TimePicker

時刻選択ピッカー。

**パス**: `components/pickers/TimePicker.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| *BasePickerProps* | - | - | - | 共通Props継承 |
| value | `string` | - | - | HH:MM形式 |
| onValueChange | `(timeString: string) => void` | ◯ | - | 変更ハンドラ |
| format24 | `boolean` | - | `true` | 24時間形式 |

---

#### NumberPicker

数値選択ピッカー。

**パス**: `components/pickers/NumberPicker.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| *BasePickerProps* | - | - | - | 共通Props継承 |
| value | `number` | - | - | 選択値 |
| onValueChange | `(value: number) => void` | ◯ | - | 変更ハンドラ |
| min | `number` | - | `0` | 最小値 |
| max | `number` | - | `100` | 最大値 |
| step | `number` | - | `1` | ステップ |
| unit | `string` | - | - | 単位 |

---

#### SelectPicker

選択肢ピッカー。

**パス**: `components/pickers/SelectPicker.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| *BasePickerProps* | - | - | - | 共通Props継承 |
| options | `PickerOption<T>[]` | ◯ | - | 選択肢 |
| value | `T \| T[]` | - | - | 選択値 |
| onValueChange | `(value: T \| T[]) => void` | ◯ | - | 変更ハンドラ |
| multiSelect | `boolean` | - | `false` | 複数選択 |
| maxSelections | `number` | - | - | 最大選択数 |

---

#### DaysPicker

曜日選択ピッカー。

**パス**: `components/pickers/DaysPicker.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| *BasePickerProps* | - | - | - | 共通Props継承 |
| value | `number[]` | - | - | 選択曜日（0-6: 日-土） |
| onValueChange | `(days: number[]) => void` | ◯ | - | 変更ハンドラ |
| maxSelections | `number` | - | - | 最大選択数 |

---

### Snippet

---

#### SnippetList

スニペット一覧。

**パス**: `components/snippet/SnippetList.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| snippets | `Snippet[]` | ◯ | - | スニペット配列 |
| onPress | `(snippet: Snippet) => void` | ◯ | - | 押下ハンドラ |
| onEdit | `(snippet: Snippet) => void` | ◯ | - | 編集ハンドラ |
| onDelete | `(snippet: Snippet) => void` | ◯ | - | 削除ハンドラ |
| refreshing | `boolean` | - | `false` | リフレッシュ状態 |
| onRefresh | `() => void` | - | - | リフレッシュハンドラ |
| disableCopy | `boolean` | - | `false` | コピー無効 |
| overrideProfileId | `string \| null` | - | - | 上書きプロファイルID |
| categories | `Category[]` | - | - | カテゴリ配列 |

| 備考 | 内容 |
|------|------|
| リスト実装 | FlashList使用 |
| タブレット | 2列表示 |
| 機能 | プルリフレッシュ対応 |

---

#### SnippetCard

スニペットカード。

**パス**: `components/snippet/SnippetCard.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| snippet | `Snippet` | ◯ | - | スニペット |
| onPress | `(snippet: Snippet) => void` | ◯ | - | 押下ハンドラ |
| onEdit | `(snippet: Snippet) => void` | ◯ | - | 編集ハンドラ |
| onDelete | `(snippet: Snippet) => void` | ◯ | - | 削除ハンドラ |
| disableCopy | `boolean` | - | `false` | コピー無効 |
| overrideProfileId | `string \| null` | - | - | 上書きプロファイルID |
| category | `Category \| null` | - | - | カテゴリ |

| 備考 | 内容 |
|------|------|
| 最適化 | `React.memo()`使用 |
| 機能 | 展開/折り畳み、変数プレビュー、コピーフィードバック |

---

#### SnippetFormScreen

スニペット作成・編集フォーム。

**パス**: `components/snippet/SnippetFormScreen.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| mode | `'create' \| 'edit'` | ◯ | - | モード |
| snippetId | `string` | - | - | スニペットID（編集時） |

| 備考 | 内容 |
|------|------|
| 機能 | タイトル・コンテンツ入力、カテゴリ選択、プロファイル選択、変数プレビュー |

---

#### SearchBar

検索バー。

**パス**: `components/snippet/SearchBar.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| value | `string` | ◯ | - | 検索値 |
| onChangeText | `(text: string) => void` | ◯ | - | 変更ハンドラ |
| onClear | `() => void` | - | - | クリアハンドラ |
| placeholder | `string` | - | - | プレースホルダ |
| autoFocus | `boolean` | - | `false` | 自動フォーカス |

---

#### SortMenu

ソートメニュー。

**パス**: `components/snippet/SortMenu.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| currentSort | `SnippetSortBy` | ◯ | - | 現在のソート |
| onSortChange | `(sort: SnippetSortBy) => void` | ◯ | - | ソート変更ハンドラ |

---

#### VariablePreview

変数プレビュー。

**パス**: `components/snippet/VariablePreview.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| title | `string` | ◯ | - | タイトル |
| content | `string` | ◯ | - | コンテンツ |
| selectedProfileIds | `string[]` | - | `[]` | 選択プロファイルID |
| copyWithTitle | `boolean` | - | `false` | タイトル含めてコピー |

| 備考 | 内容 |
|------|------|
| 機能 | 変数置換プレビュー、マルチプロファイル対応、直接コピー |

---

#### VariablePickerModal

変数選択モーダル。

**パス**: `components/snippet/VariablePickerModal.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| visible | `boolean` | ◯ | - | 表示状態 |
| onClose | `() => void` | ◯ | - | 閉じるハンドラ |
| onSelect | `(variableName: string) => void` | ◯ | - | 選択ハンドラ |

---

#### VariableToolbar

変数挿入ツールバー。

**パス**: `components/snippet/VariableToolbar.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| onInsert | `(variableName: string) => void` | ◯ | - | 挿入ハンドラ |
| onShowMore | `() => void` | - | - | もっと表示ハンドラ |

---

#### TextInputScreen

テキスト入力専用画面。

**パス**: `components/snippet/TextInputScreen.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| type | `'title' \| 'content'` | ◯ | - | 入力タイプ |

---

### Category

---

#### CategoryBadge

カテゴリバッジ。

**パス**: `components/category/CategoryBadge.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| category | `Category` | ◯ | - | カテゴリ |
| size | `'small' \| 'medium'` | - | `'medium'` | サイズ |

---

#### CategoryModal

カテゴリ作成・編集モーダル。

**パス**: `components/category/CategoryModal.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| visible | `boolean` | ◯ | - | 表示状態 |
| category | `Category \| null` | - | - | 編集対象カテゴリ |
| onClose | `() => void` | ◯ | - | 閉じるハンドラ |
| onSuccess | `() => void` | ◯ | - | 成功ハンドラ |

---

#### CategoryPicker

カテゴリ選択ピッカー。

**パス**: `components/category/CategoryPicker.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| categories | `Category[]` | ◯ | - | カテゴリ配列 |
| selectedCategoryId | `string \| null` | ◯ | - | 選択ID |
| onSelect | `(categoryId: string \| null) => void` | ◯ | - | 選択ハンドラ |
| visible | `boolean` | ◯ | - | 表示状態 |
| onClose | `() => void` | ◯ | - | 閉じるハンドラ |
| onCategoryCreated | `() => void` | - | - | 作成完了ハンドラ |

---

#### CategoryFilter

カテゴリフィルター。

**パス**: `components/category/CategoryFilter.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| categories | `Category[]` | ◯ | - | カテゴリ配列 |
| selectedCategoryId | `string \| null` | ◯ | - | 選択ID |
| onSelectCategory | `(categoryId: string \| null) => void` | ◯ | - | 選択ハンドラ |

---

### Profile

---

#### ProfileSwitcher

環境切り替えボタン。

**パス**: `components/profile/ProfileSwitcher.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| - | - | - | - | Propsなし |

| 備考 | 内容 |
|------|------|
| 機能 | 前後ボタンで環境切り替え |
| 表示条件 | 複数環境がある場合のみ |

---

#### ProfileSelector

環境選択モーダル。

**パス**: `components/profile/ProfileSelector.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| - | - | - | - | Propsなし |

| 備考 | 内容 |
|------|------|
| 機能 | ボタンタップでモーダル表示、ラジオボタン形式 |

---

#### ProfileChipSelector

環境チップセレクター。

**パス**: `components/profile/ProfileChipSelector.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| profiles | `Profile[]` | ◯ | - | プロファイル配列 |
| selectedProfileId | `string \| null` | ◯ | - | 選択ID |
| onSelectProfile | `(profileId: string) => void` | ◯ | - | 選択ハンドラ |
| showCount | `boolean` | - | `false` | カウント表示 |
| getCount | `(profileId: string) => number` | - | - | カウント取得関数 |
| containerPadding | `number` | - | - | コンテナパディング |

---

### Variable

---

#### VariableModal

変数作成・編集モーダル。

**パス**: `components/variable/VariableModal.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| visible | `boolean` | ◯ | - | 表示状態 |
| editingVariable | `Variable \| null` | ◯ | - | 編集対象変数 |
| onSave | `(name: string, value: string, label: string, icon: string) => void` | ◯ | - | 保存ハンドラ |
| onClose | `() => void` | ◯ | - | 閉じるハンドラ |

| 備考 | 内容 |
|------|------|
| 機能 | 変数名・ラベル・値入力、アイコン選択（130+ アイコン） |
| バリデーション | 予約語チェック、重複チェック、フォーマットチェック |

| エラー | 条件 |
|--------|------|
| 予約語エラー | システム変数名との衝突 |
| 重複エラー | 既存変数名との重複 |
| フォーマットエラー | `^[a-zA-Z_][a-zA-Z0-9_]*$` 違反 |

---

### Import

---

#### ImportSnippetItem

インポート用スニペットアイテム。

**パス**: `components/import/ImportSnippetItem.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| item | `ImportCandidateSnippet` | ◯ | - | スニペット候補 |
| isSelected | `boolean` | ◯ | - | 選択状態 |
| isExpanded | `boolean` | ◯ | - | 展開状態 |
| onToggleSelection | `(id: string, type: TabType) => void` | ◯ | - | 選択切替 |
| onToggleExpand | `(id: string) => void` | ◯ | - | 展開切替 |
| colors | `any` | ◯ | - | テーマカラー |
| t | `(key: string) => string` | ◯ | - | 翻訳関数 |

---

#### ImportProfileItem

インポート用プロファイルアイテム。

**パス**: `components/import/ImportProfileItem.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| item | `ImportCandidateProfile` | ◯ | - | プロファイル候補 |
| isSelected | `boolean` | ◯ | - | 選択状態 |
| isDisabled | `boolean` | ◯ | - | 無効状態 |
| onToggleSelection | `(id: string, type: TabType) => void` | ◯ | - | 選択切替 |
| colors | `any` | ◯ | - | テーマカラー |
| t | `(key: string) => string` | ◯ | - | 翻訳関数 |

---

#### ImportVariableItem

インポート用変数アイテム。

**パス**: `components/import/ImportVariableItem.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| item | `ImportCandidateVariable` | ◯ | - | 変数候補 |
| isSelected | `boolean` | ◯ | - | 選択状態 |
| isDuplicate | `boolean` | ◯ | - | 重複フラグ |
| isExpanded | `boolean` | ◯ | - | 展開状態 |
| onToggleSelection | `(id: string, type: TabType) => void` | ◯ | - | 選択切替 |
| onToggleExpand | `(id: string) => void` | ◯ | - | 展開切替 |
| colors | `any` | ◯ | - | テーマカラー |
| t | `(key: string) => string` | ◯ | - | 翻訳関数 |

---

#### ImportCategoryItem

インポート用カテゴリアイテム。

**パス**: `components/import/ImportCategoryItem.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| item | `ImportCandidateCategory` | ◯ | - | カテゴリ候補 |
| isSelected | `boolean` | ◯ | - | 選択状態 |
| isDisabled | `boolean` | ◯ | - | 無効状態 |
| onToggleSelection | `(id: string, type: TabType) => void` | ◯ | - | 選択切替 |
| colors | `any` | ◯ | - | テーマカラー |
| t | `(key: string) => string` | ◯ | - | 翻訳関数 |

---

### Modal

---

#### UnifiedModal

統一モーダル。

**パス**: `components/UnifiedModal.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| visible | `boolean` | ◯ | - | 表示状態 |
| onClose | `() => void` | ◯ | - | 閉じるハンドラ |
| children | `ReactNode` | ◯ | - | 子要素 |
| title | `string` | - | - | タイトル |
| animationType | `'slide' \| 'fade' \| 'none'` | - | `'slide'` | アニメーション |
| position | `'bottom' \| 'center' \| 'top'` | - | `'bottom'` | 位置 |
| dismissOnBackdropPress | `boolean` | - | `true` | 背景タップで閉じる |
| showCloseButton | `boolean` | - | `false` | 閉じるボタン表示 |
| showHandle | `boolean` | - | `true` | ハンドル表示 |
| contentStyle | `object` | - | - | コンテンツスタイル |
| maxHeight | `DimensionValue` | - | - | 最大高さ |
| width | `DimensionValue` | - | - | 幅 |
| enhancedVisuals | `boolean` | - | `false` | ADHD向け視覚強化 |

| 備考 | 内容 |
|------|------|
| プリセット | BottomSheetModal, CenterModal, FullScreenModal |
| 機能 | スワイプジェスチャー（bottom）、ADHD向け視覚強化 |

---

#### ModalFooter

モーダルフッター。

**パス**: `components/ModalFooter.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| onConfirm | `() => void` | ◯ | - | 確定ハンドラ |
| onCancel | `() => void` | - | - | キャンセルハンドラ |
| confirmText | `string` | - | - | 確定テキスト |
| cancelText | `string` | - | - | キャンセルテキスト |
| confirmDisabled | `boolean` | - | `false` | 確定無効 |
| showCancel | `boolean` | - | `true` | キャンセル表示 |
| confirmType | `ButtonType` | - | `'primary'` | 確定ボタンタイプ |

---

## Web コンポーネント

### Web Layout

---

#### PageLayout

ページレイアウト。

**パス**: `components/PageLayout.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| title | `string` | ◯ | - | タイトル |
| icon | `string` | - | - | アイコン |
| children | `ReactNode` | ◯ | - | 子要素 |
| rightAction | `ReactNode` | - | - | 右側アクション |
| onExportRequest | `() => void` | - | - | エクスポートハンドラ |

| 備考 | 内容 |
|------|------|
| 機能 | サイドメニュー統合、ハンバーガーメニュー（モバイル）、エクスポートモーダル |

---

#### SideMenu

サイドメニュー。

**パス**: `components/SideMenu.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| onExport | `() => void` | ◯ | - | エクスポートハンドラ |
| onImport | `() => void` | ◯ | - | インポートハンドラ |
| isOpen | `boolean` | ◯ | - | 開閉状態 |
| onClose | `() => void` | ◯ | - | 閉じるハンドラ |

| 備考 | 内容 |
|------|------|
| 機能 | ナビゲーション、エクスポート/インポート、言語・テーマ切替、ログアウト、Proバッジ、広告表示（Free） |

---

### Web Modal

---

#### SnippetEditModal

スニペット編集モーダル。

**パス**: `components/SnippetEditModal.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| isOpen | `boolean` | ◯ | - | 開閉状態 |
| mode | `'create' \| 'edit'` | ◯ | - | モード |
| snippetId | `string` | - | - | スニペットID |
| initialTitle | `string` | ◯ | - | 初期タイトル |
| initialContent | `string` | ◯ | - | 初期コンテンツ |
| initialCategoryId | `string \| null` | ◯ | - | 初期カテゴリID |
| initialProfileIds | `string[]` | ◯ | - | 初期プロファイルID |
| initialCopyWithTitle | `boolean` | ◯ | - | 初期コピー設定 |
| categories | `Category[]` | ◯ | - | カテゴリ配列 |
| profiles | `Profile[]` | ◯ | - | プロファイル配列 |
| profileVariables | `ProfileVariable[]` | ◯ | - | プロファイル変数配列 |
| variables | `Variable[]` | ◯ | - | 変数配列 |
| onSave | `(values: SnippetFormValues) => void` | ◯ | - | 保存ハンドラ |
| onClose | `() => void` | ◯ | - | 閉じるハンドラ |

| 備考 | 内容 |
|------|------|
| 機能 | 2カラムレイアウト（編集 + プレビュー）、変数挿入、リアルタイムプレビュー |

---

#### VariableEditModal

変数編集モーダル。

**パス**: `components/VariableEditModal.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| isOpen | `boolean` | ◯ | - | 開閉状態 |
| variableId | `string \| null` | - | - | 変数ID |
| onClose | `() => void` | ◯ | - | 閉じるハンドラ |

---

#### SnippetPreview

スニペットプレビュー。

**パス**: `components/SnippetPreview.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| title | `string` | ◯ | - | タイトル |
| content | `string` | ◯ | - | コンテンツ |
| copyWithTitle | `boolean` | ◯ | - | タイトル含める |
| selectedProfileIds | `string[]` | ◯ | - | 選択プロファイルID |
| profiles | `Profile[]` | ◯ | - | プロファイル配列 |
| variables | `Variable[]` | ◯ | - | 変数配列 |
| profileVariables | `ProfileVariable[]` | ◯ | - | プロファイル変数配列 |

---

#### ProfileMultiSelect

プロファイル複数選択。

**パス**: `components/ProfileMultiSelect.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| profiles | `Profile[]` | ◯ | - | プロファイル配列 |
| selectedProfileIds | `string[]` | ◯ | - | 選択ID配列 |
| onChange | `(ids: string[]) => void` | ◯ | - | 変更ハンドラ |

---

#### WebPageModal

Webページ表示モーダル。

**パス**: `components/WebPageModal.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| isOpen | `boolean` | ◯ | - | 開閉状態 |
| onClose | `() => void` | ◯ | - | 閉じるハンドラ |
| title | `string` | ◯ | - | タイトル |
| url | `string` | ◯ | - | URL |

---

### Web Import

---

#### ImportFileModal

インポートファイル選択モーダル。

**パス**: `components/import/ImportFileModal.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| isOpen | `boolean` | ◯ | - | 開閉状態 |
| onClose | `() => void` | ◯ | - | 閉じるハンドラ |
| onFileSelected | `(file: File, password: string) => Promise<void>` | ◯ | - | ファイル選択ハンドラ |
| isLoading | `boolean` | ◯ | - | ローディング状態 |

| 備考 | 内容 |
|------|------|
| 機能 | ドラッグ&ドロップ、パスワード入力、拡張子チェック |

| エラー | 条件 |
|--------|------|
| ファイルエラー | `.cliptap`以外の拡張子 |

---

#### ImportModeSelectModal

インポートモード選択モーダル。

**パス**: `components/import/ImportModeSelectModal.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| isOpen | `boolean` | ◯ | - | 開閉状態 |
| onClose | `() => void` | ◯ | - | 閉じるハンドラ |
| onSelectMode | `(mode: 'restore' \| 'merge') => void` | ◯ | - | モード選択ハンドラ |

---

#### ImportSelectionModal

インポート項目選択モーダル。

**パス**: `components/import/ImportSelectionModal.tsx`

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|-----|------|-----------|------|
| isOpen | `boolean` | ◯ | - | 開閉状態 |
| onClose | `() => void` | ◯ | - | 閉じるハンドラ |
| candidates | `ImportCandidates` | ◯ | - | インポート候補 |
| onImport | `(snippetIds: string[], profileIds: string[], variableIds: string[], categoryIds: string[]) => Promise<void>` | ◯ | - | インポートハンドラ |
| isProcessing | `boolean` | ◯ | - | 処理中状態 |

| 備考 | 内容 |
|------|------|
| 機能 | タブ切り替え、チェックボックス選択、全選択/全解除、重複警告 |

---

## 共通パターン

### テーマ連携

すべてのコンポーネントは`useTheme()`フックでテーマ値を取得します。

```typescript
const { colors, spacing, typography, responsiveFontSizes, isTablet } = useTheme();
```

### i18n対応

すべてのユーザー向けテキストは翻訳キー経由です。

```typescript
const { t } = useTranslation();
// ...
<Text>{t('common.save')}</Text>
```

### メモ化パターン

高頻度で更新されるコンポーネントは最適化します。

```typescript
// コンポーネントのメモ化
export const SnippetCard = React.memo(function SnippetCard(props: Props) {
  // ...
});

// 計算結果のキャッシュ
const filteredItems = useMemo(() => {
  return items.filter(item => item.active);
}, [items]);

// コールバックの安定性
const handlePress = useCallback(() => {
  onPress(item);
}, [onPress, item]);
```

### エラーハンドリング

```typescript
import { showError, showSuccess, showConfirm } from '../lib/utils/alerts';

// エラー表示
showError(t('error.save_failed'));

// 成功表示
showSuccess(t('success.saved'));

// 確認ダイアログ
const confirmed = await showConfirm(
  t('confirm.delete_title'),
  t('confirm.delete_message')
);
if (confirmed) {
  // 削除処理
}
```

---

## 関連ドキュメント

- [Mobile API仕様書](./API.md)
- [Web API仕様書](./API_WEB.md)
- [アーキテクチャ概要](./ARCHITECTURE.md)
- [コードリーディングガイド](./CODE_READING_GUIDE.md)
