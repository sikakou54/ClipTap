import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  DEFAULT_SYSTEM_VARIABLE_FORMATS,
  SYSTEM_VARIABLE_KEYS,
  SystemVariableFormatMapper,
  UI_SYSTEM_VARIABLES,
  formatByPattern,
  normalizeLocale,
  type SystemVariableFormats,
  type SystemVariableKey,
  useTranslation,
} from '@cliptap/shared';
import { FlashList } from '@mobile-types/flashlist';
import { ScreenContainer } from '@components/common/ScreenContainer';
import { useTheme } from '@lib/themeSystem';
import { showConfirm } from '@utils/alerts';
import i18next from '@i18n/config';

interface FormatListItem {
  key: SystemVariableKey;
}

const FORMAT_LIST_ITEMS: FormatListItem[] = SYSTEM_VARIABLE_KEYS.map((key) => ({ key }));

export default function SystemVariableFormatsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, responsiveFontSizes } = useTheme();
  const [formats, setFormats] = useState<SystemVariableFormats>({});

  const reload = useCallback(() => {
    setFormats(SystemVariableFormatMapper.loadRegistry());
  }, []);

  useFocusEffect(reload);

  const handleResetAll = useCallback(() => {
    showConfirm('variables.format_reset_all_confirm', () => {
      SystemVariableFormatMapper.deleteAll();
      reload();
    }, undefined, 'danger');
  }, [reload]);

  const locale = normalizeLocale(i18next.language);

  return (
    <ScreenContainer
      title={t('settings.system_variable_formats')}
      backIcon="arrow-back"
      rightAction={
        <TouchableOpacity style={styles.resetButton} onPress={handleResetAll}>
          <Text style={{ color: colors.primary, fontSize: responsiveFontSizes.sm }}>
            {t('variables.format_reset_all')}
          </Text>
        </TouchableOpacity>
      }
    >
      {/* システム変数一覧 */}
      <FlashList
        data={FORMAT_LIST_ITEMS}
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
              {/* システム変数アイコン */}
              <View style={[styles.itemIcon, { backgroundColor: colors.surface }]}>
                <Ionicons
                  name={(definition?.icon ?? 'code-outline') as any}
                  size={24}
                  color={colors.primary}
                />
              </View>

              {/* 変数名と現在の書式 */}
              <View style={styles.itemContent}>
                <Text style={[styles.label, { color: colors.text, fontSize: responsiveFontSizes.base }]}>
                  {definition ? t(definition.labelKey) : item.key}
                </Text>
                <Text style={[styles.token, { color: colors.textSecondary }]}>{`{{${item.key}}}`}</Text>
                <Text style={[styles.preview, { color: colors.text }]}>{preview}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  resetButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
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
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
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
