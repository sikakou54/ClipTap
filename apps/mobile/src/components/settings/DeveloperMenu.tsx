/**
 * 開発者メニュー
 *
 * 開発モード（__DEV__）でのみ表示されるデバッグ機能メニュー。
 * サブスクリプション状態テスト、DBリセット、完全削除、スキーマバージョン変更の4機能を提供。
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { SCHEMA_VERSION } from '@database/schema';
import { UI_CONSTANTS } from '@constants/ui';

interface DeveloperMenuProps {
  onSubscriptionToggle: () => void;
  onResetDatabase: () => void;
  onDeleteDatabase: () => void;
  onChangeSchemaVersion: () => void;
}

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  description: string;
  onPress: () => void;
}

function DevMenuItem({ icon, iconColor, title, description, onPress }: MenuItemProps) {
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();

  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* 左側: アイコン+テキスト */}
      <View style={styles.menuLeft}>
        {/* メニューアイコン */}
        <Ionicons name={icon} size={24} color={iconColor} />
        {/* テキストエリア */}
        <View style={styles.devMenuText}>
          {/* タイトル */}
          <Text style={[styles.devMenuTitle, { color: iconColor, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
            {title}
          </Text>
          {/* 説明文 */}
          <Text style={{ color: colors.textSecondary, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }}>
            {description}
          </Text>
        </View>
      </View>
      {/* 右側: 矢印アイコン */}
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

export function DeveloperMenu({
  onSubscriptionToggle,
  onResetDatabase,
  onDeleteDatabase,
  onChangeSchemaVersion,
}: DeveloperMenuProps) {
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();

  const menuItems = [
    {
      id: 'subscription',
      icon: 'bug-outline' as const,
      iconColor: colors.text,
      title: 'Subscription Override',
      description: 'Test keyboard extension states',
      onPress: onSubscriptionToggle,
    },
    {
      id: 'reset',
      icon: 'refresh-outline' as const,
      iconColor: colors.error || '#FF6B6B',
      title: 'Reset Database',
      description: 'Delete all data and runSeed test data',
      onPress: onResetDatabase,
    },
    {
      id: 'delete',
      icon: 'trash-outline' as const,
      iconColor: colors.error || '#FF6B6B',
      title: 'Delete Database File',
      description: 'Completely delete database file and recreate',
      onPress: onDeleteDatabase,
    },
    {
      id: 'schema',
      icon: 'git-branch-outline' as const,
      iconColor: colors.text,
      title: 'Change Schema Version',
      description: `Test database migrations (Current: ${SCHEMA_VERSION})`,
      onPress: onChangeSchemaVersion,
    },
  ];

  /* 開発者メニューセクション */
  return (
    <View style={styles.menuSection}>
      {/* セクションタイトル */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: responsiveFontSizes.xs, lineHeight: responsiveLineHeights.xs }]}>
        Developer Menu
      </Text>
      {/* メニューグループ（カード形式） */}
      <View style={[styles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {menuItems.map((item, index) => (
          <React.Fragment key={item.id}>
            {/* 開発者メニューアイテム */}
            <DevMenuItem
              icon={item.icon}
              iconColor={item.iconColor}
              title={item.title}
              description={item.description}
              onPress={item.onPress}
            />
            {/* セパレーター（最後のアイテム以外） */}
            {index < menuItems.length - 1 && (
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

/* ========================================
   スタイル定義
   ======================================== */
const styles = StyleSheet.create({
  /** メニューセクション全体 */
  menuSection: {
    padding: UI_CONSTANTS.GAP.LG,
  },
  /** セクションタイトル */
  sectionTitle: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
    marginBottom: UI_CONSTANTS.GAP.MD,
    marginLeft: UI_CONSTANTS.GAP.XS,
    textTransform: 'uppercase', // 大文字変換
  },
  /** メニューグループ（カード） */
  menuGroup: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.LG,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    overflow: 'hidden', // 角丸を適用
  },
  /** メニュー項目1行 */
  menuItem: {
    flexDirection: 'row', // 横並び（左: アイコン+テキスト、右: 矢印）
    justifyContent: 'space-between', // 両端揃え
    alignItems: 'center', // 縦方向中央揃え
    padding: UI_CONSTANTS.GAP.LG,
  },
  /** 左側エリア（アイコン+テキスト） */
  menuLeft: {
    flexDirection: 'row', // 横並び
    alignItems: 'center',
    gap: UI_CONSTANTS.GAP.BASE,
    flex: 1, // 残りスペースを使用
  },
  /** 区切り線 */
  separator: {
    height: UI_CONSTANTS.BORDER_WIDTH.THIN,
    marginLeft: 56,
  },
  /** テキストエリア（タイトル+説明） */
  devMenuText: {
    gap: UI_CONSTANTS.GAP.XS,
  },
  /** メニュータイトル */
  devMenuTitle: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
});
