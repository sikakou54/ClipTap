# ClipTap Web 認証 & サブスクリプション再設計

Firebase Authentication を用いて「Google / Apple ログイン必須化」を行い、RevenueCat の Customer ID をログインユーザー ID（Firebase UID）に統一するための設計メモです。

---

## 目標

1. Web アプリ利用前に必ず Firebase でログインさせる  
2. ログイン済みユーザーの UID を RevenueCat `appUserId` として使用  
3. **[変更]** `.cliptap` 内に埋め込まれた `r` (customerId) は将来的に廃止し、エクスポート時には出力しない
4. **[変更]** インポート時のサブスクリプション判定は、`.cliptap` 内のデータではなく、**「現在ログイン中のユーザーのステータス」** のみを正とする

---

## 全体フロー（ASCII 図）

```
┌─────────────┐        ┌────────────────────┐
│  Firebase    │        │   RevenueCat        │
│ Authentication│        │ (Purchases SDK)    │
└──────┬──────┘        └─────────┬──────────┘
       │ onAuthStateChanged()               │
       ▼                                     │
┌───────────────┐      UID=customerId      ▼
│  useAuthStore  │──────────────────────▶ initializeSDK(uid)
┌───────────────┐                           │
│ App Router    │                           │
│ (Guard Login) │             ┌──────────────┐
└──────┬────────┘             │ useSubscript.│◀───────┘ getCustomerInfo()
       │                      └──────────────┘
       │                              │ updateValidFlags()
       │                              ▼
       │                      ┌──────────────┐
       └─────────────────────▶│ Data Store   │
                              └──────────────┘
```

---

## 実装タスク

### 1. Firebase Auth ログイン必須化（完了）

1. Firebase 設定  
   - `.env` に `VITE_FIREBASE_*` を追加  
   - `src/lib/firebase.ts` を作成し `initializeApp`, `getAuth` をラップ
2. `useAuthStore`（Zustand）  
   - state: `{ user, loading, error }`  
   - `listenAuthState()` で `onAuthStateChanged` を購読  
   - `signInWithGoogle() / signInWithApple()`, `signOut()` を提供
3. ルーティング制御  
   - `App.tsx` で `useAuthStore` を参照  
   - `loading` 中はスピナー、`user` が無い場合は `LoginPage` を表示  
   - 既存の `loadFromCache()` は `user` が確定してから実行

### 2. RevenueCat 連携の UID 統一（完了）

1. `useSubscriptionStore` 改修  
   - `checkSubscription` は `useAuthStore.user.uid` を使用して `Purchases.configure` を実行
   - `.cliptap` ファイル内の `customerId` には依存しない

### 3. IndexedDB / .cliptap の UID 一致チェック（改修完了）

1. `loadCache()` 後に `cached.customerId === firebaseUID` を検証  
   - 不一致なら `clearCache()` してホーム画面に遷移
2. `.cliptap` インポート時
   - `exportData.r` (customerId) が存在し、かつ `firebaseUID` と不一致の場合のみ警告フラグを立てる
   - ユーザー確認ダイアログを表示し、承認されれば読み込みを許可（他人のファイルも読み込めるようにする）
3. `saveCache()` 時は常に `firebaseUID` を `customerId` として保存

### 4. [NEW] `.cliptap` ファイル仕様変更（`r` フィールド廃止）

1. **Web 側実装**
   - 型定義 (`types.ts`): `r` (RevenueCat Customer ID) を `optional` に変更し、将来的に削除予定であることをコメント追記
   - エクスポータ (`cliptapExporter.ts`): `r` フィールドを出力しないように変更
   - パーサ (`cliptapParser.ts`): `r` が存在しなくてもエラーにしない。存在する場合は「不一致警告」のために使用するが、サブスクリプション判定には使わない

2. **モバイル側実装**
   - エクスポータ (`ExportImportService.ts`): `r` フィールドの書き出しを削除
   - インポート処理は既存のままで問題ないか確認（モバイル版はもともとログインユーザー/端末情報で判定しているはずだが、ファイル内の `r` に依存していないか確認）

---

## UI & UX メモ

- **LoginPage**  
  - ロゴ・説明テキスト  
  - 「Google でログイン」「Apple でログイン」ボタン  
  - 利用規約／プライバシーポリシーへのリンク  
- **アカウント認証メニュー (Mobile)**
  - 設定画面に「アカウント認証」セクションを追加
  - Google / Apple ログイン連携により、モバイルのサブスクリプション情報をアカウントに紐付け
  - ログアウト（認証解除）時は RevenueCat からもログアウトし、権利を端末（匿名ユーザー）に戻す（Transfer）

---

## 今後の検討

- Web 側から RevenueCat の購入操作を行う場合、同じ UID を流用できるため保守性が高い
- モバイル・Web 間でのデータ同期（Cloud Firestore など）を検討する場合も、この UID をキーにできる

---

担当タスク紐づけ:
- TODO#doc_update: 本ドキュメント更新（完了）
- TODO#web_parser_update: Web側型定義・パーサ改修
- TODO#web_export_update: Web側エクスポータ改修
- TODO#mobile_export_update: モバイル側エクスポータ改修
