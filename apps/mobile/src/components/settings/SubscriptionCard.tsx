/**
 * サブスクリプションカード
 *
 * Proプランの購読状態を表示し、管理画面への遷移を提供。
 * 購読中: ダイアモンドアイコン（塗りつぶし）+ プライマリカラー背景
 * 未購読: ダイアモンドアイコン（アウトライン）+ 通常背景
 */
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from '@cliptap/shared';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { UI_CONSTANTS } from '@constants/ui';

interface SubscriptionCardProps {
  isSubscribed: boolean;
  isLoading: boolean;
  onPress: () => void;
}

export function SubscriptionCard({ isSubscribed, isLoading, onPress }: SubscriptionCardProps) {
  /* ========================================
     Hooks & コンテキスト
     ======================================== */
  /* 多言語化: 翻訳関数を取得 */
  const { t } = useTranslation();
  /* テーマ: 色・フォントサイズ・行高を取得 */
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();

  /* ========================================
     ローディング中の表示
     ======================================== */
  if (isLoading) {
    /* ローディング状態のサブスクリプションカード */
    return (
      <View
        style={[
          styles.subscriptionCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            justifyContent: 'center',
            minHeight: 100,
          },
        ]}
      >
        {/* ローディングスピナー */}
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  /* ========================================
     購読状態に応じたカード表示
     ======================================== */
  /* サブスクリプションカード（タップ可能） */
  return (
    <TouchableOpacity
      style={[
        styles.subscriptionCard,
        {
          backgroundColor: isSubscribed ? colors.primary + '20' : colors.surface,
          borderColor: isSubscribed ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* 左側: アイコン+テキスト */}
      <View style={styles.subscriptionLeft}>
        {/* ダイアモンドアイコン（購読中: 塗りつぶし、未購読: アウトライン） */}
        <Ionicons
          name={isSubscribed ? 'diamond' : 'diamond-outline'}
          size={32}
          color={colors.primary}
        />
        {/* テキストエリア */}
        <View style={styles.subscriptionText}>
          {/* タイトル: 購読中 or Proプラン */}
          <Text style={[styles.subscriptionTitle, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
            {isSubscribed ? t('subscription.subscribed') : t('subscription.title')}
          </Text>
          {/* サブテキスト: 管理 or 登録 */}
          <Text style={{ color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }}>
            {isSubscribed
              ? t('subscription.manage')
              : t('subscription.subscribe')}
          </Text>
        </View>
      </View>
      {/* 右側: 矢印アイコン */}
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

/* ========================================
   スタイル定義
   ======================================== */
const styles = StyleSheet.create({
  /** サブスクリプションカード全体 */
  subscriptionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: UI_CONSTANTS.GAP.XL,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.XL,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THICK,
  },
  /** 左側エリア（アイコン+テキスト） */
  subscriptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.GAP.LG,
  },
  /** テキストエリア（タイトル+サブテキスト） */
  subscriptionText: {
    gap: UI_CONSTANTS.GAP.XS,
  },
  /** カード見出しの文字（購読中 / Proプラン） */
  subscriptionTitle: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
});
