# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**ClipTap** - 定型文・コードスニペットを1タップでクリップボードにコピーできる超シンプルなモバイルアプリ。

### コアコンセプト
- **1タップコピー**: 登録したテキストを即座にクリップボードへコピー
- **ローカルファースト**: オフラインで完全動作、プライバシー重視
- **超軽量UI**: 最小の操作で最大の生産性を実現
- **完全無料**: 全機能無料、広告表示による収益化

### 技術スタック
- **フレームワーク**: Expo SDK 53 + React Native 0.79
- **スタイリング**: 統合テーマシステム（`lib/themeSystem.tsx`）+ StyleSheet
- **データベース**: SQLite (expo-sqlite) + Repository Pattern
- **ナビゲーション**: Expo Router (file-based routing)
- **多言語対応**: i18next（日本語・英語）
- **クリップボード**: expo-clipboard
- **広告**: react-native-google-mobile-ads (AdMob)

## ディレクトリ構造

```
clip-tap/
├── app/                          # Expo Router 画面
│   ├── _layout.tsx              # ルートレイアウト（プロバイダー管理）
│   ├── (tabs)/                  # タブナビゲーション
│   │   ├── _layout.tsx          # タブレイアウト
│   │   ├── index.tsx            # スニペット一覧（ホーム）
│   │   ├── categories.tsx       # カテゴリ管理
│   │   └── settings.tsx         # 設定画面
│   ├── snippet/
│   │   ├── create.tsx           # スニペット作成
│   │   └── edit.tsx             # スニペット編集
│   └── onboarding.tsx           # オンボーディング（初回起動）
│
├── components/                   # 再利用可能なコンポーネント
│   ├── common/                  # 基本UIコンポーネント（継承）
│   ├── snippet/                 # スニペット関連コンポーネント
│   │   ├── SnippetCard.tsx     # スニペットカード（タップでコピー）
│   │   ├── SnippetList.tsx     # スニペット一覧表示
│   │   ├── SearchBar.tsx       # 検索バー
│   │   └── SortMenu.tsx        # 並べ替えメニュー
│   ├── category/                # カテゴリ関連
│   │   ├── CategoryPicker.tsx  # カテゴリ選択
│   │   ├── CategoryFilter.tsx  # カテゴリフィルター
│   │   └── CategoryBadge.tsx   # カテゴリバッジ表示
│   └── feedback/                # フィードバック
│       ├── CopyToast.tsx       # コピー完了トースト
│       └── HapticFeedback.tsx  # 振動フィードバック
│
├── lib/                         # コアライブラリ
│   ├── database/                # データベース層
│   │   ├── database.ts          # SQLite管理
│   │   ├── migrations/          # マイグレーション
│   │   └── schema.ts            # テーブル定義
│   ├── mappers/                 # Mapperパターン実装
│   │   ├── BaseMapper.ts       # 基底クラス（継承）
│   │   ├── SnippetMapper.ts    # スニペットMapper
│   │   ├── CategoryMapper.ts   # カテゴリMapper
│   │   └── TagMapper.ts        # タグMapper
│   ├── services/                # ビジネスロジック
│   │   ├── SnippetService.ts   # スニペット管理
│   │   ├── CategoryService.ts  # カテゴリ管理
│   │   ├── ClipboardService.ts # クリップボード操作
│   │   ├── SearchService.ts    # 検索処理
│   │   ├── BackupService.ts    # バックアップ/復元
│   │   └── AnalyticsService.ts # 使用統計
│   ├── types/                   # 型定義
│   │   ├── snippet.ts          # スニペット型
│   │   ├── category.ts         # カテゴリ型
│   │   └── settings.ts         # 設定型
│   ├── utils/                   # ユーティリティ
│   │   ├── clipboard.ts        # クリップボードヘルパー
│   │   ├── haptic.ts           # 振動制御
│   │   └── storage.ts          # ローカルストレージ
│   └── hooks/                   # カスタムフック
│       ├── useSnippets.ts      # スニペット管理フック
│       ├── useSearch.ts        # 検索フック
│       ├── useClipboard.ts     # クリップボードフック
│       └── useBackup.ts        # バックアップフック
│
├── locales/                     # 翻訳ファイル
│   ├── ja/translation.json     # 日本語
│   └── en/translation.json     # 英語
│
├── assets/                      # アセット
└── config/                      # 設定ファイル
    ├── constants.ts             # 定数定義
    └── presets.ts               # プリセットテンプレート
```

## データモデル

### Snippets Table
```sql
CREATE TABLE snippets (
  id TEXT PRIMARY KEY,
  title TEXT,                    -- タイトル（省略可）
  content TEXT NOT NULL,          -- 本文（必須）
  categoryId TEXT,                -- カテゴリID
  isPinned INTEGER DEFAULT 0,     -- ピン留め
  usageCount INTEGER DEFAULT 0,   -- 使用回数
  lastUsedAt TEXT,                -- 最終使用日時
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (categoryId) REFERENCES categories(id)
);

CREATE INDEX idx_snippets_category ON snippets(categoryId);
CREATE INDEX idx_snippets_usage ON snippets(usageCount DESC);
CREATE INDEX idx_snippets_pinned ON snippets(isPinned DESC);
```

### Categories Table
```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT,                    -- カテゴリカラー
  icon TEXT,                      -- アイコン名
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL
);
```

### Tags Table (多対多)
```sql
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE snippet_tags (
  snippetId TEXT NOT NULL,
  tagId TEXT NOT NULL,
  PRIMARY KEY (snippetId, tagId),
  FOREIGN KEY (snippetId) REFERENCES snippets(id) ON DELETE CASCADE,
  FOREIGN KEY (tagId) REFERENCES tags(id)
);
```

## 主要機能実装

### 広告実装

```typescript
// components/ads/AdBanner.tsx
import React from 'react';
import { View, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

export function AdBanner({ style }: { style?: any }) {
  const adUnitId = __DEV__ 
    ? TestIds.BANNER  // 開発時はテストIDを使用
    : Platform.select({
        ios: 'ca-app-pub-xxx/xxx',
        android: 'ca-app-pub-xxx/xxx',
      });

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => console.log('Ad loaded')}
        onAdFailedToLoad={(error) => console.error('Ad failed to load:', error)}
      />
    </View>
  );
}

// 画面での使用例
export function HomeScreen() {
  const { colors } = useTheme();
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* スニペット一覧 */}
      </ScrollView>
      
      {/* 画面下部に広告を固定表示 */}
      <AdBanner style={{ 
        position: 'absolute', 
        bottom: 0,
        backgroundColor: colors.surface 
      }} />
    </View>
  );
}
```

### 1. スニペット作成/編集

```typescript
// lib/services/SnippetService.ts
export class SnippetService {
  async createSnippet(data: CreateSnippetInput): Promise<Snippet> {
    const snippet = await snippetMapper.create({
      title: data.title || generateTitleFromContent(data.content),
      content: data.content,
      categoryId: data.categoryId,
      tags: data.tags
    });
    
    // 使用統計の初期化
    await analyticsService.trackSnippetCreated(snippet.id);
    
    return snippet;
  }
  
  async copyToClipboard(id: string): Promise<void> {
    const snippet = await snippetMapper.getById(id);
    if (!snippet) throw new Error('Snippet not found');
    
    // クリップボードにコピー
    await Clipboard.setStringAsync(snippet.content);
    
    // 使用回数をインクリメント
    await snippetMapper.incrementUsageCount(id);
    
    // 振動フィードバック
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // トースト表示
    ToastService.show({
      message: t('snippet.copied'),
      type: 'success',
      duration: 1500
    });
  }
}
```

### 2. 検索機能

```typescript
// lib/services/SearchService.ts
export class SearchService {
  async searchSnippets(query: string, options?: SearchOptions): Promise<Snippet[]> {
    if (!query.trim()) return [];
    
    const results = await snippetMapper.search({
      query,
      searchIn: ['title', 'content', 'tags'],
      categoryId: options?.categoryId,
      sortBy: options?.sortBy || 'relevance'
    });
    
    return results;
  }
  
  // インクリメンタルサーチ対応
  async getSuggestions(query: string): Promise<string[]> {
    // タイトルとタグから候補を生成
    return snippetMapper.getAutocompleteSuggestions(query);
  }
}
```

### 3. 1タップコピー実装

```typescript
// components/snippet/SnippetCard.tsx
export function SnippetCard({ snippet, onEdit, onDelete }: Props) {
  const { colors } = useTheme();
  const [isCopying, setIsCopying] = useState(false);
  
  const handleTap = async () => {
    if (isCopying) return;
    
    setIsCopying(true);
    
    try {
      await snippetService.copyToClipboard(snippet.id);
      
      // 視覚的フィードバック
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true
        })
      ]).start();
      
    } finally {
      setIsCopying(false);
    }
  };
  
  return (
    <TouchableOpacity
      onPress={handleTap}
      onLongPress={() => showContextMenu(snippet)}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleValue }] }]}>
        {/* カード内容 */}
      </Animated.View>
    </TouchableOpacity>
  );
}
```

### 4. バックアップ/復元

```typescript
// lib/services/BackupService.ts
export class BackupService {
  async exportToJSON(): Promise<BackupData> {
    const snippets = await snippetMapper.getAll();
    const categories = await categoryMapper.getAll();
    const settings = await settingsService.getAll();
    
    return {
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      data: { snippets, categories, settings }
    };
  }
  
  async importFromJSON(data: BackupData): Promise<void> {
    // バージョン互換性チェック
    this.validateBackupVersion(data.version);
    
    // トランザクション内で復元
    await database.transaction(async () => {
      // 既存データのクリア（オプション）
      if (options.clearExisting) {
        await this.clearAllData();
      }
      
      // データの復元
      await categoryMapper.bulkCreate(data.categories);
      await snippetMapper.bulkCreate(data.snippets);
      await settingsService.restore(data.settings);
    });
  }
  
  // ファイル共有によるバックアップ
  async shareBackupFile(): Promise<void> {
    const data = await this.exportToJSON();
    const jsonString = JSON.stringify(data, null, 2);
    const filename = `cliptap-backup-${Date.now()}.json`;
    
    await Sharing.shareAsync(filename, {
      mimeType: 'application/json',
      dialogTitle: t('backup.share_title')
    });
  }
}
```

## パフォーマンス最適化

### リスト最適化
```typescript
// スニペット一覧の仮想化
<FlashList
  data={snippets}
  renderItem={({ item }) => <SnippetCard snippet={item} />}
  estimatedItemSize={100}
  keyExtractor={(item) => item.id}
  // 使用頻度の高いアイテムを上位に
  getItemType={(item) => item.isPinned ? 'pinned' : 'normal'}
/>
```

### 検索の最適化
```typescript
// デバウンス処理で検索負荷軽減
const debouncedSearch = useDebounce(searchQuery, 300);

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch);
  }
}, [debouncedSearch]);
```

### メモリ最適化
```typescript
// 大量データ対応
const ITEMS_PER_PAGE = 50;

// ページネーション
const loadMore = async () => {
  const nextPage = await snippetMapper.getPaginated({
    offset: currentOffset,
    limit: ITEMS_PER_PAGE
  });
  setSnippets(prev => [...prev, ...nextPage]);
};
```

## セキュリティ実装

### アプリロック
```typescript
// lib/services/SecurityService.ts
export class SecurityService {
  async enableBiometric(): Promise<void> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) throw new Error('Biometric not available');
    
    await AsyncStorage.setItem('biometric_enabled', 'true');
  }
  
  async authenticate(): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t('security.authenticate'),
      fallbackLabel: t('security.usePasscode')
    });
    
    return result.success;
  }
}
```

## ウィジェット実装

### iOS ウィジェット
```typescript
// ios/ClipTapWidget/Widget.swift
struct ClipTapWidget: Widget {
  let kind: String = "ClipTapWidget"
  
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      ClipTapWidgetView(entry: entry)
    }
    .configurationDisplayName("ClipTap")
    .description("Quick access to your snippets")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}
```

### Android ウィジェット
```xml
<!-- android/app/src/main/res/xml/snippet_widget_info.xml -->
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="110dp"
    android:minHeight="110dp"
    android:updatePeriodMillis="86400000"
    android:previewImage="@drawable/widget_preview"
    android:initialLayout="@layout/snippet_widget"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen">
</appwidget-provider>
```

**ウィジェット機能（全て無料）**
- 無制限のウィジェット配置
- お気に入りスニペットの表示
- ウィジェットからの直接コピー
- サイズ変更対応（Small/Medium/Large）

## 開発コマンド

```bash
# 開発
npm start                  # Expo開発サーバー
npm run ios               # iOS実行
npm run android           # Android実行
npm run web              # Web実行

# ビルド
eas build --platform ios     # iOSビルド
eas build --platform android # Androidビルド

# テスト
npm test                      # テスト実行
npx tsc --noEmit             # 型チェック

# リリース
eas submit --platform ios    # App Store申請
eas submit --platform android # Play Store申請
```

## 重要な開発ルール

### 必須チェックリスト
1. **1タップコピー最優先**: タップ操作は即座にコピー実行、遅延なし
2. **振動フィードバック**: コピー時は必ずHaptics.Light
3. **トースト表示時間**: 1.5秒固定、邪魔にならない位置
4. **検索デバウンス**: 300ms固定、リアルタイム感重視
5. **データベース**: Mapper経由必須、直接SQL禁止
6. **型安全性**: `npx tsc --noEmit`エラー0件必須
7. **オフライン動作**: ネットワーク不要で全機能動作
8. **起動速度**: スプラッシュ表示は最小限（<2秒）

### UI/UXガイドライン
- **最小タップ数**: 全操作を3タップ以内で完結
- **カード高さ**: 最小80dp確保、タップしやすさ重視  
- **長押し時間**: 500ms固定、誤操作防止
- **スワイプ操作**: 編集は右スワイプ、削除は左スワイプ
- **アニメーション**: 100ms以内、軽快さ重視
- **ダークモード**: システム設定に追従
- **広告配置**: 画面下部バナー固定、操作の妨げにならない位置

### 広告実装ガイドライン
```typescript
// 広告表示ルール
- バナー広告: 画面下部に固定表示
- インタースティシャル広告: なし（UX優先）
- リワード広告: なし（シンプル維持）
- 広告非表示: 設定画面のみ非表示
- リフレッシュ: 30秒間隔
```

## トラブルシューティング

### よくある問題

**クリップボードにコピーされない**
```bash
# iOS: Info.plistに権限追加
<key>NSUserActivityTypes</key>
<array>
  <string>NSUserActivityTypeBrowsingWeb</string>
</array>
```

**振動フィードバックが動作しない**
```typescript
// android/app/src/main/AndroidManifest.xml
<uses-permission android:name="android.permission.VIBRATE" />
```

**SQLiteエラー**
```bash
# キャッシュクリア
expo start --clear
# データベースリセット
await database.dropAllTables();
await database.createTables();
```

## リリース準備

### App Store対策
- プライバシーポリシー明記（クリップボード使用、AdMob広告）
- スクリーンショット6枚（6.7", 5.5"）
- 説明文にキーワード「コピー」「クリップボード」「定型文」「無料」
- 年齢制限: 4+（広告あり）

### Google Play対策
- targetSdkVersion 34以上
- 64bitビルド必須
- プライバシーポリシーURL必須
- データセーフティセクション記載（広告ID使用）
- コンテンツレーティング: 全年齢対象

### 収益化設定（広告のみ）
```typescript
// AdMob設定
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

const ADMOB_IDS = {
  ios: {
    banner: 'ca-app-pub-xxx/xxx',  // 本番用IDに置き換え
  },
  android: {
    banner: 'ca-app-pub-xxx/xxx',  // 本番用IDに置き換え
  }
};

// バナー広告コンポーネント
export function AdBanner() {
  const adUnitId = Platform.select({
    ios: ADMOB_IDS.ios.banner,
    android: ADMOB_IDS.android.banner,
  });

  return (
    <View style={styles.adContainer}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,  // GDPR対応
        }}
      />
    </View>
  );
}

// 広告配置例
const styles = StyleSheet.create({
  adContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
});
```