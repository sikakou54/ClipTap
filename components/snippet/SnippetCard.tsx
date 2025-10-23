import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { Snippet } from '../../lib/types/snippet';

interface SnippetCardProps {
  snippet: Snippet;
  onPress: (snippet: Snippet) => void;
  onEdit: (snippet: Snippet) => void;
  onDelete: (snippet: Snippet) => void;
}

export function SnippetCard({
  snippet,
  onPress,
  onEdit,
  onDelete,
}: SnippetCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [isCopying, setIsCopying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 2行に切り詰める関数
  const getTruncatedContent = (text: string) => {
    const lines = text.split('\n');
    if (lines.length <= 2) {
      return text;
    }
    return lines.slice(0, 2).join('\n') + '...';
  };

  const handleCopy = async () => {
    if (isCopying) return;
    setIsCopying(true);

    try {
      await onPress(snippet);
      setIsCopied(true);
      // 2秒後に元に戻す
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      // エラー時も元に戻す
      setIsCopied(false);
    } finally {
      setIsCopying(false);
    }
  };

  const handleLongPress = () => {
    Alert.alert(
      snippet.title || t('snippet.title'),
      undefined,
      [
        {
          text: t('common.edit'),
          onPress: () => onEdit(snippet),
        },
        {
          text: t('common.delete'),
          onPress: () => {
            Alert.alert(
              t('snippet.delete_confirm'),
              undefined,
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('common.delete'),
                  style: 'destructive',
                  onPress: () => onDelete(snippet),
                },
              ]
            );
          },
          style: 'destructive',
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      t('snippet.delete_confirm'),
      undefined,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => onDelete(snippet),
        },
      ]
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
      <View style={styles.mainContent}>
        <View style={styles.titleContainer}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {snippet.title}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.contentWrapper}>
            <Text
              style={[styles.content, { color: colors.textSecondary }]}
            >
              {isExpanded ? snippet.content : getTruncatedContent(snippet.content)}
            </Text>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.textSecondary}
              style={styles.expandIcon}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* アクションボタン */}
      <View style={[styles.actionButtons, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCopy}
          disabled={isCopying}
        >
          <Ionicons
            name={isCopied ? "checkmark-circle" : "copy-outline"}
            size={20}
            color={isCopied ? "#34C759" : colors.primary}
          />
          <Text style={[styles.actionText, { color: isCopied ? "#34C759" : colors.primary }]}>
            {t('common.copy')}
          </Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEdit(snippet)}
        >
          <Ionicons name="create-outline" size={20} color={colors.text} />
          <Text style={[styles.actionText, { color: colors.text }]}>
            {t('common.edit')}
          </Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={[styles.actionText, { color: '#FF3B30' }]}>
            {t('common.delete')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mainContent: {
    padding: 16,
    gap: 8,
  },
  titleContainer: {
    width: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    flexShrink: 1,
  },
  expandIcon: {
    marginBottom: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    width: 1,
  },
});
