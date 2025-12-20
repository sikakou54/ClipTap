/**
 * @module RootLayout
 * @description ルートレイアウト
 *
 * ClipTapアプリ全体のプロバイダー構成とナビゲーション設定を管理。
 * Expo Routerの_layout.tsxとして、アプリ起動時に最初に実行される。
 *
 * @responsibility
 * - アダプター初期化処理（useAdapterInitialization）
 * - アプリデータ初期化処理（useAppInitialization、AuthProvider内）
 * - プロバイダー階層: ThemeProvider → AlertProvider → AuthProvider → SubscriptionProvider → DatabaseProvider
 * - 全画面のナビゲーション設定（Stack Navigator）
 * - スプラッシュスクリーンの表示制御
 *
 * @see docs/ARCHITECTURE.md - 全体アーキテクチャ
 */

import { Stack } from 'expo-router';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemeProvider } from '@lib/themeSystem';
import { AlertProvider } from '@providers/AlertProvider';
import { SubscriptionProvider } from '@providers/SubscriptionProvider';
import { SplashScreen } from '@components/common/SplashScreen';
import { AuthProvider, DatabaseProvider, ProfileProvider, VariableProvider, CategoryProvider, SnippetProvider } from '@cliptap/shared';
import { useAdapterInitialization } from '@hooks/screens/useAdapterInitialization';
import { useAppInitialization } from '@hooks/screens/useAppInitialization';

const MODAL_SLIDE_OPTIONS = {
  presentation: 'modal',
  headerShown: false,
  animation: 'slide_from_bottom',
} as const;

const HEADER_HIDDEN_OPTIONS = {
  headerShown: false,
} as const;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
});

/**
 * アプリコンテンツ
 *
 * AuthProvider内で使用。アプリデータ初期化後にナビゲーションを表示。
 */
function AppContent({ isTabletDevice }: { isTabletDevice: boolean }) {
  const { isAppReady, isLoaded, setLoaded } = useAppInitialization();

  const tabletAwareModalOptions = {
    presentation: isTabletDevice ? 'card' : 'modal',
    headerShown: false,
    animation: !isTabletDevice ? 'slide_from_bottom' : undefined,
  } as const;

  if (!isAppReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  /* データベースプロバイダーとナビゲーションスタック */
  /* Provider階層: Database → Profile → Variable → Category */
  return (
    <DatabaseProvider value={{ isLoaded, setLoaded }}>
      <ProfileProvider>
        <VariableProvider>
          <CategoryProvider>
            <SnippetProvider>
              <Stack screenOptions={HEADER_HIDDEN_OPTIONS}>
                {/* ホーム画面 */}
                <Stack.Screen name="index" />
                {/* 検索画面（透明モーダル） */}
                <Stack.Screen
                  name="search"
                  options={{ presentation: 'transparentModal', headerShown: false, animation: 'fade' }}
                />
                {/* スニペット作成画面 */}
                <Stack.Screen name="snippet/create" options={tabletAwareModalOptions} />
                {/* スニペット編集画面 */}
                <Stack.Screen name="snippet/edit" options={tabletAwareModalOptions} />
                {/* スニペット内容入力画面 */}
                <Stack.Screen name="snippet/content-input" options={tabletAwareModalOptions} />
                {/* スニペットタイトル入力画面 */}
                <Stack.Screen name="snippet/title-input" options={tabletAwareModalOptions} />
                {/* スニペットプロファイル選択画面 */}
                <Stack.Screen name="snippet/profile-select" options={MODAL_SLIDE_OPTIONS} />
                {/* カテゴリ編集画面 */}
                <Stack.Screen name="category/edit" options={MODAL_SLIDE_OPTIONS} />
                {/* カテゴリ選択画面 */}
                <Stack.Screen name="category/select" options={MODAL_SLIDE_OPTIONS} />
                {/* 変数編集画面 */}
                <Stack.Screen name="variable/edit" options={MODAL_SLIDE_OPTIONS} />
                {/* 変数プロファイル値編集画面 */}
                <Stack.Screen name="variable/profile-value-edit" options={MODAL_SLIDE_OPTIONS} />
                {/* プロファイル編集画面 */}
                <Stack.Screen name="profile/edit" options={MODAL_SLIDE_OPTIONS} />
                {/* プロファイル変数編集画面 */}
                <Stack.Screen name="profile/variable-edit" options={MODAL_SLIDE_OPTIONS} />
                {/* 設定画面 */}
                <Stack.Screen name="settings" options={HEADER_HIDDEN_OPTIONS} />
                {/* サブスクリプション課金画面（フルスクリーンモーダル） */}
                <Stack.Screen
                  name="subscription/paywall"
                  options={{ presentation: 'fullScreenModal', headerShown: false }}
                />
                {/* サブスクリプション管理画面 */}
                <Stack.Screen name="subscription/manage" options={HEADER_HIDDEN_OPTIONS} />
                {/* WebView画面 */}
                <Stack.Screen name="webview" options={HEADER_HIDDEN_OPTIONS} />
              </Stack>
            </SnippetProvider>
          </CategoryProvider>
        </VariableProvider>
      </ProfileProvider>
    </DatabaseProvider>
  );
}

export default function RootLayout() {
  const { isAdaptersReady, showSplash, isTabletDevice, hideSplash } = useAdapterInitialization();

  return (
    <>
      {/* アダプター初期化完了後のメインアプリコンテンツ */}
      {isAdaptersReady && (
        <View style={styles.rootContainer}>
          {/* プロバイダー階層（テーマ → アラート → 認証 → サブスクリプション → Database → Profile → Variable → Category） */}
          <ThemeProvider>
            <AlertProvider>
              <AuthProvider>
                <SubscriptionProvider>
                  <AppContent isTabletDevice={isTabletDevice} />
                </SubscriptionProvider>
              </AuthProvider>
            </AlertProvider>
          </ThemeProvider>
        </View>
      )}

      {/* スプラッシュスクリーン（初期化中に表示） */}
      {showSplash && <SplashScreen onFinish={hideSplash} isLoading={!isAdaptersReady} />}
    </>
  );
}
