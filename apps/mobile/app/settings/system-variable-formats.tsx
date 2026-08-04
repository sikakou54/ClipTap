import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  DEFAULT_SYSTEM_VARIABLE_FORMATS,
  SYSTEM_VARIABLE_KEYS,
  SYSTEM_VARIABLES,
  SystemVariableFormatMapper,
  SnippetService,
  UI_SYSTEM_VARIABLES,
  extractVariables,
  formatByPattern,
  normalizeLocale,
  normalizeVariableName,
  type SystemVariableFormats,
  type SystemVariableKey,
  useTranslation,
} from '@cliptap/shared';
import { FlashList } from '@mobile-types/flashlist';
import { Header } from '@components/common/Header';
import { commonStyles } from '@lib/styles/commonStyles';
import { useTheme } from '@lib/themeSystem';
import { showConfirm } from '@utils/alerts';
import i18next from '@i18n/config';

interface FormatListItem {
  key: SystemVariableKey;
  usageCount: number;
}

export default function SystemVariableFormatsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, responsiveFontSizes } = useTheme();
  const [formats, setFormats] = useState<SystemVariableFormats>({});

  const reload = useCallback(() => {
    setFormats(SystemVariableFormatMapper.loadRegistry());
  }, []);

  useFocusEffect(reload);

  const items = useMemo<FormatListItem[]>(() => {
    const snippets = SnippetService.getAll();
    return SYSTEM_VARIABLE_KEYS.map((key) => {
      const definition = SYSTEM_VARIABLES.find((item) => item.key === key);
      const aliases = new Set(definition?.aliases.map(normalizeVariableName) ?? []);
      const usageCount = snippets.filter((snippet) => {
        const names = extractVariables(`${snippet.title ?? ''}\n${snippet.content}`);
        return names.some((name) => aliases.has(normalizeVariableName(name)));
      }).length;
      return { key, usageCount };
    });
  }, []);

  const handleResetAll = useCallback(() => {
    showConfirm('variables.format_reset_all_confirm', () => {
      SystemVariableFormatMapper.deleteAll();
      reload();
    }, undefined, 'danger');
  }, [reload]);

  const locale = normalizeLocale(i18next.language);

  return (
    <View style={[commonStyles.container, { backgroundColor: colors.background }]}>
      {/* 画面ヘッダー */}
      <Header
        title={t('settings.system_variable_formats')}
        backIcon="arrow-back"
        rightAction={
          <TouchableOpacity style={styles.resetButton} onPress={handleResetAll}>
            <Text style={{ color: colors.primary, fontSize: responsiveFontSizes.sm }}>
              {t('variables.format_reset_all')}
            </Text>
          </TouchableOpacity>
        }
      />

      {/* 書式の適用範囲説明 */}
      <Text
        style={[
          styles.description,
          { color: colors.textSecondary, fontSize: responsiveFontSizes.sm },
        ]}
      >
        {t('variables.format_desc')}
      </Text>

      {/* システム変数一覧 */}
      <FlashList
        data={items}
        estimatedItemSize={104}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => {
          const definition = UI_SYSTEM_VARIABLES.find((value) => value.name === item.key);
          const pattern = formats[item.key] ?? DEFAULT_SYSTEM_VARIABLE_FORMATS[item.key];
          const preview = formatByPattern(new Date(), pattern, locale);

          return (
            <TouchableOpacity
              style={[styles.item, { borderBottomColor: colors.border }]}
              onPress={() => router.push({ pathname: '/variable/format-edit', params: { key: item.key } })}
            >
              {/* 変数名と現在の書式 */}
              <View style={styles.itemContent}>
                <Text style={[styles.label, { color: colors.text, fontSize: responsiveFontSizes.base }]}>
                  {definition ? t(definition.labelKey) : item.key}
                </Text>
                <Text style={[styles.token, { color: colors.textSecondary }]}>{`{{${item.key}}}`}</Text>
                <Text style={[styles.preview, { color: colors.text }]}>{preview}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: responsiveFontSizes.xs }}>
                  {t('variables.format_usage_count', { count: item.usageCount })}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  resetButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  description: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  item: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemContent: {
    flex: 1,
    gap: 3,
  },
  label: {
    fontWeight: '600',
  },
  token: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  preview: {
    fontSize: 18,
    fontWeight: '500',
  },
});
