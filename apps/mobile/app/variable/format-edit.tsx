import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import {
  DEFAULT_SYSTEM_VARIABLE_FORMATS,
  SYSTEM_VARIABLE_KEYS,
  SystemVariableFormatMapper,
  UI_SYSTEM_VARIABLES,
  formatByPattern,
  getSystemVariableFormatPresets,
  normalizeLocale,
  type SystemVariableKey,
  useTranslation,
} from '@cliptap/shared';
import { FlashList } from '@mobile-types/flashlist';
import { ScreenContainer } from '@components/common/ScreenContainer';
import { useTheme } from '@lib/themeSystem';
import i18next from '@i18n/config';

const isSystemVariableKey = (value: string): value is SystemVariableKey => (
  SYSTEM_VARIABLE_KEYS.some((key) => key === value)
);

export default function SystemVariableFormatEditScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ key?: string }>();
  const { colors } = useTheme();
  const key = params.key && isSystemVariableKey(params.key) ? params.key : 'today';
  const locale = normalizeLocale(i18next.language);
  const current = SystemVariableFormatMapper.getAll()[key] ?? DEFAULT_SYSTEM_VARIABLE_FORMATS[key];
  const presets = useMemo(() => getSystemVariableFormatPresets(key, locale), [key, locale]);
  const definition = UI_SYSTEM_VARIABLES.find((item) => item.name === key);

  const handleSelect = (pattern: string) => {
    if (pattern === DEFAULT_SYSTEM_VARIABLE_FORMATS[key]) {
      SystemVariableFormatMapper.delete(key);
    } else {
      SystemVariableFormatMapper.upsert(key, pattern);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (Platform.OS === 'android') {
      ToastAndroid.show(t('variables.format_changed'), ToastAndroid.SHORT);
    }
    router.back();
  };

  return (
    <ScreenContainer
      title={definition ? t(definition.labelKey) : key}
      isModal
    >
      {/* プリセット一覧 */}
      <FlashList
        data={presets}
        estimatedItemSize={76}
        keyExtractor={(pattern) => pattern}
        renderItem={({ item: pattern, index }) => {
          const selected = pattern === current;
          return (
            <TouchableOpacity
              style={[styles.item, { borderBottomColor: colors.border }]}
              onPress={() => handleSelect(pattern)}
            >
              <View style={styles.textContent}>
                <View style={styles.previewRow}>
                  <Text style={[styles.preview, { color: colors.text }]}>
                    {formatByPattern(new Date(), pattern, locale)}
                  </Text>
                  {index === 0 && (
                    <Text style={[styles.defaultBadge, { color: colors.primary }]}>
                      {t('variables.format_default')}
                    </Text>
                  )}
                </View>
                <Text style={[styles.pattern, { color: colors.textSecondary }]}>{pattern}</Text>
              </View>
              <Ionicons
                name={selected ? 'radio-button-on' : 'radio-button-off'}
                size={24}
                color={selected ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  item: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  textContent: {
    flex: 1,
    gap: 4,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preview: {
    fontSize: 19,
    fontWeight: '600',
  },
  defaultBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  pattern: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
