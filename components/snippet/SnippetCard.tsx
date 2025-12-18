import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { Snippet } from '../../lib/types/snippet';
import { Category } from '../../lib/types/category';
import { VariableParser } from '../../lib/services/VariableParser';
import { useVariables } from '../../lib/hooks/useVariables';
import { useProfiles } from '../../lib/hooks/useProfiles';
import { categoryService } from '../../lib/services/CategoryService';
import { CategoryBadge } from '../category/CategoryBadge';
import { UI_CONSTANTS } from '../../lib/constants/ui';
import { showConfirm } from '../../lib/utils/alerts';

interface SnippetCardProps {
  snippet: Snippet;
  onPress: (snippet: Snippet) => void;
  onEdit: (snippet: Snippet) => void;
  onDelete: (snippet: Snippet) => void;
  disableCopy?: boolean;
  overrideProfileId?: string | null; // 変数解決時に使用するプロファイルID（検索画面用）
}

export function SnippetCard({
  snippet,
  onPress,
  onEdit,
  onDelete,
  disableCopy = false,
  overrideProfileId,
}: SnippetCardProps) {
  const { t } = useTranslation();
  const { colors, isTablet, responsive, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const [isCopying, setIsCopying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayTitle, setDisplayTitle] = useState(snippet.title);
  const [displayContent, setDisplayContent] = useState(snippet.content);
  const [category, setCategory] = useState<Category | null>(null);

  // アクティブプロファイルを監視
  const { activeProfile } = useProfiles();
  const { createCustomVariableResolver } = useVariables();

  // カテゴリ情報を取得
  useEffect(() => {
    const loadCategory = async () => {
      if (snippet.categoryId) {
        const cat = await categoryService.getById(snippet.categoryId);
        setCategory(cat);
      } else {
        setCategory(null);
      }
    };
    loadCategory();
  }, [snippet.categoryId]);

  // 変数を変換して表示用のテキストを生成
  useEffect(() => {
    const convertVariables = async () => {
      let convertedTitle = snippet.title;
      let convertedContent = snippet.content;

      // overrideProfileIdが指定されている場合はそれを使用、なければアクティブプロファイル
      const profileIdToUse = overrideProfileId !== undefined ? overrideProfileId : activeProfile?.id;

      // カスタム変数リゾルバを作成（共通ロジックを使用）
      const customResolver = createCustomVariableResolver(profileIdToUse || undefined);

      // タイトルに変数が含まれている場合は変換
      if (snippet.title && VariableParser.hasVariables(snippet.title)) {
        convertedTitle = await VariableParser.replaceVariables(snippet.title, customResolver);
      }

      // 内容に変数が含まれている場合は変換
      if (VariableParser.hasVariables(snippet.content)) {
        convertedContent = await VariableParser.replaceVariables(snippet.content, customResolver);
      }

      setDisplayTitle(convertedTitle);
      setDisplayContent(convertedContent);
    };

    convertVariables();
  }, [snippet, activeProfile, overrideProfileId]);

  const handleCopy = async () => {
    if (isCopying) return;
    setIsCopying(true);

    try {
      await onPress(snippet);
      setIsCopied(true);
    } catch (error) {
      // エラー時も元に戻す
      setIsCopied(false);
    } finally {
      setIsCopying(false);
    }
  };

  // isCopiedフラグを2秒後にリセット（メモリリーク対策）
  useEffect(() => {
    if (!isCopied) return;

    const timeoutId = setTimeout(() => {
      setIsCopied(false);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [isCopied]);

  const handleDelete = () => {
    showConfirm(
      'snippet.delete_confirm',
      () => onDelete(snippet),
      undefined,
      'danger'
    );
  };

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
      <View style={[styles.mainContent, { padding: responsive.card.padding }]}>
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
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.contentWrapper,
            !isExpanded && {
              minHeight: isTablet ? 68 : 60,
            }
          ]}>
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
            <View style={styles.expandIconContainer}>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={isTablet ? 20 : 16}
                color={colors.textSecondary}
              />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* アクションボタン */}
      <View style={[styles.actionButtons, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { paddingVertical: isTablet ? 14 : 10 },
            disableCopy && styles.disabledButton
          ]}
          onPress={handleCopy}
          disabled={isCopying || disableCopy}
        >
          <Ionicons
            name={isCopied ? "checkmark-circle" : "copy-outline"}
            size={isTablet ? 24 : 20}
            color={disableCopy ? colors.textSecondary : (isCopied ? "#34C759" : colors.primary)}
          />
          <Text style={[
            styles.actionText,
            {
              color: disableCopy ? colors.textSecondary : (isCopied ? "#34C759" : colors.primary),
              fontSize: responsiveFontSizes.sm,
            }
          ]}>
            {t('common.copy')}
          </Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          style={[styles.actionButton, { paddingVertical: isTablet ? 14 : 10 }]}
          onPress={() => onEdit(snippet)}
        >
          <Ionicons
            name="create-outline"
            size={isTablet ? 24 : 20}
            color={colors.text}
          />
          <Text style={[
            styles.actionText,
            {
              color: colors.text,
              fontSize: responsiveFontSizes.sm,
            }
          ]}>
            {t('common.edit')}
          </Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          style={[styles.actionButton, { paddingVertical: isTablet ? 14 : 10 }]}
          onPress={handleDelete}
        >
          <Ionicons
            name="trash-outline"
            size={isTablet ? 24 : 20}
            color="#FF3B30"
          />
          <Text style={[
            styles.actionText,
            {
              color: '#FF3B30',
              fontSize: responsiveFontSizes.sm,
            }
          ]}>
            {t('common.delete')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
  expandIconContainer: {
    alignItems: 'center',
    paddingTop: UI_CONSTANTS.GAP.XS,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: UI_CONSTANTS.GAP.SM,
  },
  disabledButton: {
    opacity: 0.4,
  },
  actionText: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
  },
  divider: {
    width: UI_CONSTANTS.BORDER_WIDTH.THIN,
  },
});
