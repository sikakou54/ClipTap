/**
 * 設定画面レイアウト
 *
 * 設定セクション内のネストされたナビゲーションを管理するレイアウトコンポーネント。
 * Expo Routerのファイルベースルーティングにより、settings/配下の画面遷移を制御。
 *
 * 管理する画面:
 * - index: 設定メインメニュー
 * - categories: カテゴリ管理
 * - profiles: プロファイル（環境）管理
 * - variables: カスタム変数管理
 * - export-import: バックアップ・復元
 * - select-export-data: エクスポートデータ選択（モーダル）
 * - select-import-data: インポートデータ選択（モーダル）
 *
 * @see docs/ARCHITECTURE.md - ナビゲーション構造
 */
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  /* 設定画面のナビゲーションスタック */
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 設定メインメニュー */}
      <Stack.Screen name="index" />
      {/* カテゴリ管理画面 */}
      <Stack.Screen name="categories" />
      {/* プロファイル管理画面 */}
      <Stack.Screen name="profiles" />
      {/* 変数管理画面 */}
      <Stack.Screen name="variables" />
      {/* システム変数書式管理画面 */}
      <Stack.Screen name="system-variable-formats" />
      {/* エクスポート・インポート画面 */}
      <Stack.Screen name="export-import" />
      {/* エクスポートデータ選択モーダル */}
      <Stack.Screen
        name="select-export-data"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      {/* インポートデータ選択モーダル */}
      <Stack.Screen
        name="select-import-data"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
