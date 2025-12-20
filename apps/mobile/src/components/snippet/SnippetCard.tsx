/**
 * スニペットカードコンポーネント
 *
 * 一覧画面で表示される個別のスニペットカード。
 * タップでコピー、長押しで展開、アクションボタンで編集・削除。
 *
 * 主な機能:
 * - ワンタップコピー（触覚フィードバック付き）
 * - コンテンツの展開/折りたたみ
 * - 変数の自動解決（{{変数名}} → 実際の値）
 * - カテゴリバッジ表示
 * - 編集・削除ボタン
 *
 * パフォーマンス最適化:
 * - React.memoによるメモ化
 * - カスタム比較関数で不要な再レンダリングを防止
 *
 * @see SnippetList - 親コンポーネント
 * @see useSnippetPreview - 変数解決フック
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { SnippetWithDisplay, Category } from '@cliptap/shared';
import { CategoryBadge } from '@components/category/CategoryBadge';
import { UI_CONSTANTS } from '@constants/ui';
import { useSnippetCard } from '@hooks/components/useSnippetCard';

/**
 * SnippetCardのProps
 * @property snippet - 表示するスニペットデータ
 * @property onPress - タップ時のコールバック（コピー処理）
 * @property onEdit - 編集ボタンタップ時のコールバック
 * @property onDelete - 削除ボタンタップ時のコールバック
 * @property disableCopy - コピー機能を無効化（省略可、デフォルト: false）
 * @property category - カテゴリオブジェクト（省略可：親から渡される場合、パフォーマンス最適化のため）
 */
interface SnippetCardProps {
  snippet: SnippetWithDisplay;
  onPress: (snippet: SnippetWithDisplay) => void;
  onEdit: (snippet: SnippetWithDisplay) => void;
  onDelete: (snippet: SnippetWithDisplay) => void;
  disableCopy?: boolean;
  category?: Category | null;
}

const SnippetCardComponent = ({
  snippet,
  onPress,
  onEdit,
  onDelete,
  disableCopy = false,
  category: categoryProp,
}: SnippetCardProps) => {
  const { colors, isTablet, responsive, responsiveFontSizes, responsiveLineHeights } = useTheme();

  /* フックからロジックを取得 */
  const {
    isCopying,
    isCopied,
    isExpanded,
    category,
    displayTitle,
    displayContent,
    handleCopy,
    handleDelete,
    handleEdit,
    toggleExpanded,
  } = useSnippetCard({
    snippet,
    onPress,
    onEdit,
    onDelete,
    categoryProp,
  });

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {/* メインコンテンツエリア */}
      <View style={[
        styles.mainContent,
        {
          padding: responsive.card.padding,
          paddingBottom: 60,
        }
      ]}>
        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.title,
              {
                color: colors.text,
                fontSize: responsiveFontSizes.base,
              }
            ]}
            numberOfLines={UI_CONSTANTS.NUMBER_OF_LINES.SINGLE}
            ellipsizeMode="tail"
          >
            {displayTitle}
          </Text>
        </View>

        {/* カテゴリバッジ */}
        {category && (
          <View style={styles.categoryBadgeContainer}>
            <CategoryBadge category={category} size="small" />
          </View>
        )}

        <TouchableOpacity
          onPress={toggleExpanded}
          activeOpacity={0.7}
          style={[
            styles.contentWrapper,
            !isExpanded && {
              minHeight: isTablet ? 68 : 60,
            }
          ]}
        >
          <Text
            style={[
              styles.content,
              {
                color: colors.textSecondary,
                fontSize: responsiveFontSizes.sm,
                lineHeight: responsiveLineHeights.sm,
              }
            ]}
            numberOfLines={isExpanded ? undefined : UI_CONSTANTS.NUMBER_OF_LINES.DOUBLE}
            ellipsizeMode="tail"
          >
            {displayContent}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 展開ボタン */}
      <TouchableOpacity
        style={[
          styles.roundButton,
          {
            position: 'absolute',
            left: UI_CONSTANTS.GAP.MD,
            bottom: UI_CONSTANTS.GAP.MD,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }
        ]}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={isTablet ? 22 : 18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* アクションボタン */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.roundButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }
          ]}
          onPress={handleDelete}
        >
          <Ionicons
            name="trash-outline"
            size={isTablet ? 22 : 18}
            color="#FF3B30"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roundButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }
          ]}
          onPress={handleEdit}
        >
          <Ionicons
            name="create-outline"
            size={isTablet ? 22 : 18}
            color={colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roundButton,
            {
              borderColor: isCopied ? "#34C759" : colors.primary,
              backgroundColor: colors.surface,
            },
            disableCopy && styles.disabledButton
          ]}
          onPress={handleCopy}
          disabled={isCopying || disableCopy}
        >
          <Ionicons
            name={isCopied ? "checkmark" : "copy-outline"}
            size={isTablet ? 22 : 18}
            color={disableCopy ? colors.textSecondary : (isCopied ? "#34C759" : colors.primary)}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * SnippetCard をメモ化して不要な再レンダリングを防ぐ
 * FlashList のパフォーマンス最適化のため
 *
 * カスタム比較関数でsnippetの主要プロパティとその他のPropsを比較
 * すべて変更なしの場合のみ再レンダリングをスキップ
 */
export const SnippetCard = React.memo(SnippetCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.snippet.id === nextProps.snippet.id &&
    prevProps.snippet.updatedAt === nextProps.snippet.updatedAt &&
    prevProps.snippet.title === nextProps.snippet.title &&
    prevProps.snippet.content === nextProps.snippet.content &&
    prevProps.snippet.categoryId === nextProps.snippet.categoryId &&
    prevProps.snippet.displayTitle === nextProps.snippet.displayTitle &&
    prevProps.snippet.displayContent === nextProps.snippet.displayContent &&
    prevProps.disableCopy === nextProps.disableCopy &&
    prevProps.category?.id === nextProps.category?.id
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.LG,
    marginBottom: UI_CONSTANTS.GAP.LG,
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
    overflow: 'hidden',
  },
  mainContent: {
    gap: UI_CONSTANTS.GAP.SM,
  },
  titleContainer: {
    width: '100%',
  },
  title: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  categoryBadgeContainer: {
    marginTop: UI_CONSTANTS.GAP.XS,
  },
  contentWrapper: {
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  actionButtons: {
    position: 'absolute',
    right: UI_CONSTANTS.GAP.MD,
    bottom: UI_CONSTANTS.GAP.MD,
    flexDirection: 'row',
    gap: UI_CONSTANTS.GAP.SM,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.4,
    borderColor: '#ccc',
  },
});
