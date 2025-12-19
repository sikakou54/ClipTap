/**
 * 設定画面カスタムフック
 *
 * 設定画面のビジネスロジックを管理するフック。
 * UI層から認証・メニュー処理を分離する。
 *
 * 主な責務:
 * - 認証処理（Apple/Google サインイン・サインアウト）
 * - キーボード設定ガイドモーダルの状態管理
 * - メニュー項目の定義
 *
 * @see app/settings/index.tsx - 設定画面UI
 * @see useDevMenu - 開発者メニュー（DEVモード用）
 */

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation, useAuth, Logger, isAuthCancelledError } from '@cliptap/shared';
import { useSubscription } from '@providers/SubscriptionProvider';
import { showAlert, showConfirm } from '@utils/alerts';
import { useDevMenu, type UseDevMenuReturn } from './useDevMenu';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/** メニュー項目の型定義 */
export interface MenuItem {
  id: string;
  icon: 'options-outline' | 'code-outline' | 'folder-outline' | 'keypad-outline' | 'sync-outline' | 'document-text-outline' | 'shield-checkmark-outline';
  label: string;
  onPress: () => void;
  isPro: boolean;
}

/** useSettingsScreen フックの返却値 */
export interface UseSettingsScreenReturn extends UseDevMenuReturn {
  /* 状態 */
  /** キーボードガイドモーダル表示状態 */
  showKeyboardGuide: boolean;
  /** アカウント連携処理中フラグ */
  isLinkingAccount: boolean;
  /** 認証読み込み中フラグ */
  authLoading: boolean;
  /** サブスクリプション状態 */
  isSubscribed: boolean;
  /** Firebase認証ユーザー */
  user: ReturnType<typeof useAuth>['user'];
  /** アカウント認証状態テキスト */
  accountAuthStatus: string;
  /** メニュー項目一覧 */
  menuItems: MenuItem[];

  /* ハンドラ */
  /** キーボードガイドモーダルを閉じる */
  closeKeyboardGuide: () => void;
  /** Appleでサインイン */
  handleAppleSignIn: () => Promise<void>;
  /** Googleでサインイン */
  handleGoogleSignIn: () => Promise<void>;
  /** ログアウト */
  handleLogout: () => Promise<void>;
  /** サブスクリプション画面へ遷移 */
  handleSubscriptionPress: () => void;
}

/* ======================================== */
/* フック実装 */
/* ======================================== */

export function useSettingsScreen(): UseSettingsScreenReturn {
  /* ======================================== */
  /* Hooks & コンテキスト */
  /* ======================================== */
  const { t } = useTranslation();
  const router = useRouter();
  const { isSubscribed } = useSubscription();
  const {
    user,
    loading: authLoading,
    signInWithApple,
    signInWithGoogle,
    signOut: authSignOut,
  } = useAuth();

  /* 開発者メニュー（DEVモード用） */
  const devMenu = useDevMenu();

  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [showKeyboardGuide, setShowKeyboardGuide] = useState(false);
  const [isLinkingAccount, setIsLinkingAccount] = useState(false);

  /* ======================================== */
  /* 認証ハンドラ */
  /* ======================================== */

  /**
   * サインインエラー時の共通処理
   */
  const handleSignInError = useCallback((error: unknown) => {
    if (isAuthCancelledError(error)) {
      Logger.debug('[useSettingsScreen] Account auth cancelled by user');
      return;
    }

    Logger.error('[useSettingsScreen] Account auth failed:', error);
    const errorObj = error as { message?: string } | null;
    showAlert(
      t('error.account_auth_failed_title', 'アカウント認証失敗'),
      errorObj?.message || t('error.account_auth_failed_message', 'アカウント連携中にエラーが発生しました。')
    );
  }, [t]);

  /**
   * Appleでサインイン
   */
  const handleAppleSignIn = useCallback(async () => {
    /* 処理中なら何もしない */
    if (authLoading || isLinkingAccount) return;

    /* 処理開始 */
    setIsLinkingAccount(true);
    try {
      /* 共有AuthHookのAppleサインインを実行 */
      await signInWithApple();
      /* 成功時はUIが自動で更新される（onAuthStateChanged経由） */
    } catch (error) {
      /* エラー時の共通処理を実行 */
      handleSignInError(error);
    } finally {
      /* 処理終了 */
      setIsLinkingAccount(false);
    }
  }, [authLoading, isLinkingAccount, signInWithApple, handleSignInError]);

  /**
   * Googleでサインイン
   */
  const handleGoogleSignIn = useCallback(async () => {
    /* 処理中なら何もしない */
    if (authLoading || isLinkingAccount) return;

    /* 処理開始 */
    setIsLinkingAccount(true);
    try {
      /* 共有AuthHookのGoogleサインインを実行 */
      await signInWithGoogle();
      /* 成功時はUIが自動で更新される（onAuthStateChanged経由） */
    } catch (error) {
      /* エラー時の共通処理を実行 */
      handleSignInError(error);
    } finally {
      /* 処理終了 */
      setIsLinkingAccount(false);
    }
  }, [authLoading, isLinkingAccount, signInWithGoogle, handleSignInError]);

  /**
   * ログアウト処理
   */
  const handleLogout = useCallback(async () => {
    /* 処理中なら何もしない */
    if (authLoading || isLinkingAccount) return;

    /* 確認ダイアログを表示 */
    showConfirm(
      t('settings.account_auth.confirm_logout', '現在のアカウント連携を解除しますか？'),
      async () => {
        /* OKが押されたらログアウト処理開始 */
        setIsLinkingAccount(true);
        try {
          /* 共有AuthHookのログアウトを実行 */
          await authSignOut();
          /* 成功アラートを表示 */
          showAlert(
            t('settings.account_auth.logout_success_title', '連携を解除しました'),
            t('settings.account_auth.logout_success_message', 'アカウント連携が解除されました。')
          );
        } catch (error) {
          /* エラーログ出力とアラート表示 */
          Logger.error('[useSettingsScreen] Logout failed:', error);
          showAlert(
            t('error.logout_failed_title', 'ログアウト失敗'),
            t('error.logout_failed_message', 'ログアウト中にエラーが発生しました。')
          );
        } finally {
          /* 処理終了 */
          setIsLinkingAccount(false);
        }
      }
    );
  }, [authLoading, isLinkingAccount, authSignOut, t]);

  /* ======================================== */
  /* その他のハンドラ */
  /* ======================================== */

  const closeKeyboardGuide = useCallback(() => {
    setShowKeyboardGuide(false);
  }, []);

  const handleSubscriptionPress = useCallback(() => {
    router.push(isSubscribed ? '/subscription/manage' : '/subscription/paywall');
  }, [router, isSubscribed]);

  /* ======================================== */
  /* 派生状態 */
  /* ======================================== */

  const accountAuthStatus = user
    ? t('settings.account_auth.status_authenticated', '連携済')
    : t('settings.account_auth.status_unauthenticated', '未連携');

  /* ======================================== */
  /* メニュー項目定義 */
  /* ======================================== */

  const menuItems: MenuItem[] = useMemo(() => [
    {
      id: 'profiles',
      icon: 'options-outline',
      label: t('settings.profiles'),
      onPress: () => router.push('/settings/profiles'),
      isPro: false,
    },
    {
      id: 'variables',
      icon: 'code-outline',
      label: t('settings.variables'),
      onPress: () => router.push('/settings/variables'),
      isPro: false,
    },
    {
      id: 'categories',
      icon: 'folder-outline',
      label: t('category.title'),
      onPress: () => router.push('/settings/categories'),
      isPro: false,
    },
    {
      id: 'keyboard',
      icon: 'keypad-outline',
      label: t('settings.keyboard_setup'),
      onPress: () => setShowKeyboardGuide(true),
      isPro: false,
    },
    {
      id: 'terms',
      icon: 'document-text-outline',
      label: t('settings.terms'),
      onPress: () => router.push({
        pathname: '/webview',
        params: { file: 'terms', title: t('settings.terms') },
      }),
      isPro: false,
    },
    {
      id: 'privacy',
      icon: 'shield-checkmark-outline',
      label: t('settings.privacy'),
      onPress: () => router.push({
        pathname: '/webview',
        params: { file: 'privacy', title: t('settings.privacy') },
      }),
      isPro: false,
    },
  ], [t, router]);

  /* ======================================== */
  /* 戻り値 */
  /* ======================================== */

  return {
    /* 状態 */
    showKeyboardGuide,
    isLinkingAccount,
    authLoading,
    isSubscribed,
    user,
    accountAuthStatus,
    menuItems,

    /* ハンドラ */
    closeKeyboardGuide,
    handleAppleSignIn,
    handleGoogleSignIn,
    handleLogout,
    handleSubscriptionPress,

    /* 開発者メニューハンドラ（useDevMenuから） */
    ...devMenu,
  };
}
