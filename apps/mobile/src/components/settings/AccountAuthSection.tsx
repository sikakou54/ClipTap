/**
 * アカウント認証セクション
 *
 * Apple/Googleサインインボタンとアカウント連携状態を表示。
 * ログイン済み: メールアドレスとログアウトボタン
 * 未ログイン: Apple/Googleサインインボタン（iOSのみApple対応）
 */
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTranslation } from '@cliptap/shared';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { UI_CONSTANTS } from '@constants/ui';
import type { SharedUser } from '@cliptap/shared';

interface AccountAuthSectionProps {
  user: SharedUser | null;
  accountAuthStatus: string;
  authLoading: boolean;
  isLinkingAccount: boolean;
  onAppleSignIn: () => void;
  onGoogleSignIn: () => void;
  onLogout: () => void;
}

export function AccountAuthSection({
  user,
  accountAuthStatus,
  authLoading,
  isLinkingAccount,
  onAppleSignIn,
  onGoogleSignIn,
  onLogout,
}: AccountAuthSectionProps) {
  /* ========================================
     Hooks & コンテキスト
     ======================================== */
  /* 多言語化: 翻訳関数を取得 */
  const { t } = useTranslation();
  /* テーマ: 色・フォントサイズ・行高を取得 */
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();

  /* 認証処理中またはアカウント連携中は、ログアウト・サインインの各ボタンを押せなくする */
  const isDisabled = authLoading || isLinkingAccount;

  /* ========================================
     レンダリング
     ======================================== */
  /* アカウント認証セクションコンテナ */
  return (
    <View
      style={[
        styles.menuGroup,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          paddingRight: UI_CONSTANTS.GAP.LG,
        },
      ]}
    >
      {user ? (
        /* ----------------------------------------
           ログイン済み: ログアウトボタンを表示
           ---------------------------------------- */
        <TouchableOpacity
          style={styles.menuItem}
          onPress={onLogout}
          activeOpacity={0.7}
          disabled={isDisabled}
        >
          {/* 左側: アイコン+テキスト */}
          <View style={styles.menuLeft}>
            {/* ユーザーアイコン */}
            <Ionicons
              name="person-circle-outline"
              size={24}
              color={colors.text}
            />
            {/* テキストエリア */}
            <View style={styles.menuTextContainer}>
              {/* 上段: タイトル+認証状態バッジ */}
              <View style={styles.accountStatusRow}>
                {/* タイトル */}
                <Text
                  style={[
                    styles.menuLabel,
                    {
                      color: colors.text,
                      fontSize: responsiveFontSizes.base,
                      lineHeight: responsiveLineHeights.base,
                    },
                  ]}
                >
                  {t('settings.account_auth.title')}
                </Text>
                {/* 認証状態バッジ（例: "Apple", "Google"） */}
                <View
                  style={[
                    styles.accountStatusBadge,
                    {
                      backgroundColor: colors.primary + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.accountStatusBadgeText,
                      {
                        color: colors.primary,
                        fontSize: responsiveFontSizes.xs,
                        lineHeight: responsiveLineHeights.xs,
                      },
                    ]}
                  >
                    {accountAuthStatus}
                  </Text>
                </View>
              </View>
              {/* 下段: メールアドレス or ヒント */}
              <Text
                style={[
                  styles.menuDescription,
                  {
                    color: colors.textSecondary,
                    fontSize: responsiveFontSizes.sm,
                    lineHeight: responsiveLineHeights.sm,
                  },
                ]}
              >
                {user.email || t('settings.account_auth.tap_to_logout')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        /* ----------------------------------------
           未ログイン: 認証ボタンを表示
           ---------------------------------------- */
        <>
          {/* ヘッダー: タイトル+説明 */}
          <View style={styles.accountAuthHeader}>
            {/* タイトル */}
            <Text
              style={[
                styles.accountAuthHeaderText,
                {
                  color: colors.text,
                  fontSize: responsiveFontSizes.base,
                  lineHeight: responsiveLineHeights.base,
                },
              ]}
            >
              {t('settings.account_auth.title')}
            </Text>
            {/* 説明文 */}
            <Text
              style={[
                styles.accountAuthHintText,
                {
                  color: colors.textSecondary,
                  fontSize: responsiveFontSizes.sm,
                  lineHeight: responsiveLineHeights.sm,
                },
              ]}
            >
              {t('settings.account_auth.description')}
            </Text>
          </View>

          {/* iOS: Appleサインインボタン */}
          {Platform.OS === 'ios' && (
            <>
              <TouchableOpacity
                style={styles.authButton}
                onPress={onAppleSignIn}
                activeOpacity={0.7}
                disabled={isDisabled}
              >
                {/* Appleアイコン */}
                <Ionicons
                  name="logo-apple"
                  size={24}
                  color={colors.text}
                />
                {/* ボタンテキスト */}
                <Text
                  style={[
                    styles.authButtonText,
                    {
                      color: colors.text,
                      fontSize: responsiveFontSizes.base,
                      lineHeight: responsiveLineHeights.base,
                    },
                  ]}
                >
                  {t('auth.sign_in_apple')}
                </Text>
              </TouchableOpacity>

              {/* 区切り線 */}
              <View style={[styles.authButtonSeparator, { backgroundColor: colors.border }]} />
            </>
          )}

          {/* iOS/Android共通: Googleサインインボタン */}
          <TouchableOpacity
            style={styles.authButton}
            onPress={onGoogleSignIn}
            activeOpacity={0.7}
            disabled={isDisabled}
          >
            {/* Googleアイコン */}
            <Ionicons
              name="logo-google"
              size={24}
              color={colors.text}
            />
            {/* ボタンテキスト */}
            <Text
              style={[
                styles.authButtonText,
                {
                  color: colors.text,
                  fontSize: responsiveFontSizes.base,
                  lineHeight: responsiveLineHeights.base,
                },
              ]}
            >
              {t('auth.sign_in_google')}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

/* ========================================
   スタイル定義
   ======================================== */
const styles = StyleSheet.create({
  /** メニューグループ（カード） */
  menuGroup: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.LG,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    overflow: 'hidden',
  },
  /** メニュー項目1行（ログイン済み時） */
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: UI_CONSTANTS.GAP.LG,
  },
  /** 左側エリア（アイコン+テキスト） */
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.GAP.BASE,
    flex: 1,
  },
  /** テキストコンテナ（タイトル+説明） */
  menuTextContainer: {
    flex: 1,
    gap: UI_CONSTANTS.GAP.XS,
  },
  /** メニューラベル（タイトル） */
  menuLabel: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
  },
  /** メニュー説明文 */
  menuDescription: {
    marginTop: UI_CONSTANTS.GAP.XS,
  },
  /** アカウント状態行（タイトル+バッジ） */
  accountStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.GAP.SM,
    flexWrap: 'wrap',
  },
  /** アカウント状態バッジ */
  accountStatusBadge: {
    paddingHorizontal: UI_CONSTANTS.GAP.MD,
    paddingVertical: UI_CONSTANTS.GAP.XXS,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
  },
  /** バッジテキスト（認証プロバイダ名。文字色は使用箇所でテーマ色を後から重ねる） */
  accountStatusBadgeText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  /** 認証セクションヘッダー（未ログイン時） */
  accountAuthHeader: {
    paddingHorizontal: UI_CONSTANTS.GAP.LG,
    paddingVertical: UI_CONSTANTS.GAP.MD,
    gap: UI_CONSTANTS.GAP.XS,
  },
  /** 認証ヘッダーテキスト（タイトル） */
  accountAuthHeaderText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  /** 認証ヒントテキスト（説明） */
  accountAuthHintText: {
    marginTop: UI_CONSTANTS.GAP.XXS,
  },
  /** 認証ボタン（Apple/Google） */
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: UI_CONSTANTS.GAP.LG,
    gap: UI_CONSTANTS.GAP.MD,
  },
  /** 認証ボタンテキスト */
  authButtonText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  /** 認証ボタン間の区切り線 */
  authButtonSeparator: {
    height: UI_CONSTANTS.BORDER_WIDTH.THIN,
    marginHorizontal: UI_CONSTANTS.GAP.LG,
  },
});
