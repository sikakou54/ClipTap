import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { useSnippets } from '../../lib/hooks/useSnippets';
import { useCategories } from '../../lib/hooks/useCategories';
import { CategoryPicker } from '../../components/category/CategoryPicker';
import { CategoryBadge } from '../../components/category/CategoryBadge';

export default function CreateSnippetScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const { createSnippet } = useSnippets();
  const { categories, refresh: refreshCategories } = useCategories();

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('error.empty_title'));
      return;
    }

    if (!content.trim()) {
      Alert.alert(t('error.empty_content'));
      return;
    }

    setSaving(true);
    try {
      await createSnippet({
        title: title.trim(),
        content: content.trim(),
        categoryId: selectedCategoryId || undefined,
      });
      router.back();
    } catch (error) {
      Alert.alert(t('error.generic'));
    } finally {
      setSaving(false);
    }
  };

  // ヘッダーのカスタマイズは画面内にUIを配置

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('snippet.create')}</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !title.trim() || !content.trim()}
          style={styles.saveButton}
        >
          <Text
            style={[
              styles.saveText,
              { color: (title.trim() && content.trim()) ? colors.primary : colors.textSecondary },
            ]}
          >
            {t('common.save')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            value={title}
            onChangeText={setTitle}
            placeholder={t('snippet.title_required')}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.section}>
          <TextInput
            style={[
              styles.input,
              styles.contentInput,
              { backgroundColor: colors.surface, color: colors.text },
            ]}
            value={content}
            onChangeText={setContent}
            placeholder={t('snippet.content_placeholder')}
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.categoryButton, { backgroundColor: colors.surface }]}
            onPress={() => setShowCategoryPicker(true)}
          >
            {selectedCategory ? (
              <CategoryBadge category={selectedCategory} />
            ) : (
              <Text style={[styles.categoryPlaceholder, { color: colors.textSecondary }]}>
                {t('category.select')}
              </Text>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CategoryPicker
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        onCategoryCreated={refreshCategories}
      />
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  saveButton: {
    padding: 4,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  contentInput: {
    minHeight: 200,
    paddingTop: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    padding: 12,
  },
  categoryPlaceholder: {
    fontSize: 16,
  },
});
