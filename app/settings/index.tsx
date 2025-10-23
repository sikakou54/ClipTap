import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const menuItems = [
    {
      id: 'categories',
      icon: 'folder-outline' as const,
      label: t('category.title'),
      onPress: () => router.push('/settings/categories'),
    },
    {
      id: 'terms',
      icon: 'document-text-outline' as const,
      label: t('settings.terms'),
      onPress: () => router.push({
        pathname: '/webview',
        params: { file: 'terms', title: t('settings.terms') },
      }),
    },
    {
      id: 'privacy',
      icon: 'shield-checkmark-outline' as const,
      label: t('settings.privacy'),
      onPress: () => router.push({
        pathname: '/webview',
        params: { file: 'privacy', title: t('settings.privacy') },
      }),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon} size={24} color={colors.text} />
                <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  menuSection: {
    padding: 16,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});
