/**
 * カテゴリ編集モーダル（expo-router modal）
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { useCategories } from '../../lib/hooks/useCategories';
import { CATEGORY_COLORS } from '../../lib/constants/colors';
import { Header } from '../../components/common/Header';
import { commonStyles } from '../../lib/styles/commonStyles';
import { showAlert } from '../../lib/utils/alerts';

export default function CategoryEditModal() {
  const { t } = useTranslation();
  const { colors, isTablet, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const { categories, createCategory, updateCategory } = useCategories();
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [saving, setSaving] = useState(false);

  // 編集モードの判定
  const categoryId = params.id as string | undefined;
  const isEdit = !!categoryId;
  const category = categories.find(c => c.id === categoryId);

  useEffect(() => {
    if (category) {
      setCategoryName(category.name);
      setSelectedColor(category.color || CATEGORY_COLORS[0]);
    } else {
      setCategoryName('');
      setSelectedColor(CATEGORY_COLORS[0]);
    }
  }, [category]);

  const handleSave = async () => {
    if (!categoryName.trim()) {
      showAlert('', t('error.empty_content'), undefined, 'error');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && categoryId) {
        await updateCategory(categoryId, {
          name: categoryName.trim(),
          color: selectedColor,
        });
      } else {
        await createCategory({
          name: categoryName.trim(),
          color: selectedColor,
        });
      }
      router.back();
    } catch (error: any) {
      showAlert('', error.message, undefined, 'error');
    } finally {
      setSaving(false);
    }
  };

  // expo-routerのStackモーダルとして表示
  return (
    <SafeAreaView
      style={[commonStyles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <Header
        title={isEdit ? t('category.edit') : t('category.create')}
        isModal={true}
        rightAction={
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || !categoryName.trim()}
            style={styles.saveButton}
          >
            <Text
              style={[
                styles.saveText,
                {
                  color: (saving || !categoryName.trim()) ? colors.textSecondary : colors.primary,
                  fontSize: responsiveFontSizes.base,
                }
              ]}
            >
              {t('common.save')}
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              fontSize: responsiveFontSizes.base,
            }
          ]}
          value={categoryName}
          onChangeText={setCategoryName}
          placeholder={t('category.name_placeholder')}
          placeholderTextColor={colors.textSecondary}
          autoFocus
          onSubmitEditing={handleSave}
        />

        <View style={styles.colorSection}>
          <Text style={[styles.label, { color: colors.text, fontSize: responsiveFontSizes.sm, lineHeight: responsiveLineHeights.sm }]}>
            {t('category.color')}
          </Text>
          <View style={styles.colorGrid}>
            {CATEGORY_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  {
                    backgroundColor: color,
                    width: isTablet ? 48 : 40,
                    height: isTablet ? 48 : 40,
                    borderRadius: isTablet ? 24 : 20,
                  },
                  selectedColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <Ionicons name="checkmark" size={isTablet ? 24 : 20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  input: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  colorSection: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '500',
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButton: {
    padding: 4,
  },
  saveText: {
    fontWeight: '600',
  },
});
