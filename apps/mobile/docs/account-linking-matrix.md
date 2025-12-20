# アカウント連携時のサブスクリプション状態マトリクス

## 概要

ユーザーB（匿名ユーザー）が、ユーザーA（既存UID: `user123`）のアカウントでログイン（`Purchases.logIn('user123')`）した場合の動作をまとめます。

## 前提条件

- **ユーザーA**: 既に `user123` というUIDでRevenueCatに登録されている（または未登録）
- **ユーザーB**: 匿名ユーザーとして使用中
- **操作**: ユーザーBが `user123` でログイン（`linkAccount('user123')` が呼ばれる）

## RevenueCatの動作

`Purchases.logIn(uid)` は以下のように動作します：

1. 現在の匿名ユーザー（ユーザーB）の購入履歴を、指定されたUID（`user123`）に紐付けます
2. 既にそのUIDにサブスクリプションがある場合、両方の購入履歴がマージされます
3. RevenueCatダッシュボードの「Restore Behavior」設定によって優先順位が決まります：
   - **"Keep with original"（デフォルト）**: 既存UIDの購入を優先
   - **"Transfer to new"**: 匿名ユーザーの購入を優先

## マトリクス

| ユーザーA（既存UID） | ユーザーB（匿名） | ログイン後の状態 | 説明 |
|---------------------|-----------------|----------------|------|
| **無料** | **無料** | **無料** | 両方とも無料プランのため、ログイン後も無料プランのまま。`isSubscribed()` は `false` のため、`restorePurchases()` が呼ばれるが、復元する購入履歴がないため変化なし。 |
| **無料** | **Pro** | **Pro** | 匿名ユーザーBのProプランが `user123` に移行される。`isSubscribed()` は `true` のため、`restorePurchases()` は呼ばれない。ユーザーBはProプランのまま。 |
| **Pro** | **無料** | **Pro** | 既存UIDのProプランが優先される（デフォルト設定の場合）。`isSubscribed()` は `true` のため、`restorePurchases()` は呼ばれない。ユーザーBはProプランになる。 |
| **Pro** | **Pro** | **Pro** | 両方のProプランがマージされる。既存UIDのサブスクリプションが優先される（デフォルト設定の場合）。有効期限が異なる場合、より長い有効期限のものが優先される可能性がある。`isSubscribed()` は `true` のため、`restorePurchases()` は呼ばれない。ユーザーBはProプランのまま。 |

## コードの動作フロー

```typescript
async linkAccount(userId: string): Promise<void> {
  // 1. RevenueCatにログイン（マージ処理が行われる）
  await this.identifyUser(userId); // Purchases.logIn(userId)
  
  // 2. サブスクリプション状態をチェック
  if (!this.isSubscribed()) {
    // 3. 無料プランの場合のみ、復元処理を試みる
    // （匿名ユーザー時代の購入履歴が引き継がれていない可能性があるため）
    await this.restorePurchases();
  }
  
  // 4. サブスクリプション状態を永続化
  await this.saveSubscriptionStatusToAppGroup();
  this.updateValidFlags();
}
```

## 各ケースの詳細

### ケース1: ユーザーA（無料） + ユーザーB（無料）

**動作:**
1. `Purchases.logIn('user123')` が呼ばれる
2. 両方とも無料プランのため、マージ後も無料プラン
3. `isSubscribed()` は `false`
4. `restorePurchases()` が呼ばれるが、復元する購入履歴がないため変化なし
5. 最終状態: **無料プラン**

### ケース2: ユーザーA（無料） + ユーザーB（Pro）

**動作:**
1. `Purchases.logIn('user123')` が呼ばれる
2. 匿名ユーザーBのProプランが `user123` に移行される
3. `isSubscribed()` は `true`
4. `restorePurchases()` は呼ばれない
5. 最終状態: **Proプラン**（ユーザーBのProプランが移行）

### ケース3: ユーザーA（Pro） + ユーザーB（無料）

**動作:**
1. `Purchases.logIn('user123')` が呼ばれる
2. 既存UIDのProプランが優先される（デフォルト設定の場合）
3. `isSubscribed()` は `true`
4. `restorePurchases()` は呼ばれない
5. 最終状態: **Proプラン**（ユーザーAのProプランが有効）

### ケース4: ユーザーA（Pro） + ユーザーB（Pro）

**動作:**
1. `Purchases.logIn('user123')` が呼ばれる
2. 両方のProプランがマージされる
3. 既存UIDのサブスクリプションが優先される（デフォルト設定の場合）
4. 有効期限が異なる場合、より長い有効期限のものが優先される可能性がある
5. `isSubscribed()` は `true`
6. `restorePurchases()` は呼ばれない
7. 最終状態: **Proプラン**（両方の購入履歴がマージ）

## 注意事項

1. **RevenueCatの設定**: 「Restore Behavior」が "Transfer to new" に設定されている場合、ケース3とケース4の動作が異なる可能性があります
2. **有効期限**: ケース4で有効期限が異なる場合、RevenueCatが自動的に最適なものを選択します
3. **データの損失**: マージ処理により、どちらかの購入履歴が失われることはありません（両方が保持されます）

## まとめ

- **無料 + 無料**: 無料プランのまま
- **無料 + Pro**: Proプランになる（匿名ユーザーのProプランが移行）
- **Pro + 無料**: Proプランになる（既存UIDのProプランが有効）
- **Pro + Pro**: Proプランのまま（両方がマージ）

すべてのケースで、ユーザーBはログイン後もProプランを持っている場合はProプランのまま、無料プランの場合は無料プランのまま（または既存UIDのProプランがあればProプランになる）です。

