import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { categoryService } from '../../lib/services/CategoryService';
import { CATEGORY_COLORS } from '../../lib/constants/colors';
import { Category } from '../../lib/types/category';

interface EditCategoryModalProps {
  visible: boolean;
  category: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditCategoryModal({
  visible,
  category,
  onClose,
  onSuccess,
}: EditCategoryModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setCategoryName(category.name);
      setSelectedColor(category.color || CATEGORY_COLORS[0]);
    }
  }, [category]);

  const handleSave = async () => {
    if (!category) return;

    if (!categoryName.trim()) {
      Alert.alert(t('error.generic'), t('error.empty_content'));
      return;
    }

    setSaving(true);
    try {
      await categoryService.update(category.id, {
        name: categoryName.trim(),
        color: selectedColor,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert(t('error.generic'), error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (category) {
      setCategoryName(category.name);
      setSelectedColor(category.color || CATEGORY_COLORS[0]);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('category.edit')}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            value={categoryName}
            onChangeText={setCategoryName}
            placeholder={t('category.name_placeholder')}
            placeholderTextColor={colors.textSecondary}
            autoFocus
            onSubmitEditing={handleSave}
          />

          <Text style={[styles.label, { color: colors.text }]}>カラー</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorPicker}
          >
            {CATEGORY_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleClose}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={saving || !categoryName.trim()}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                {t('common.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  colorPicker: {
    paddingVertical: 4,
    gap: 12,
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
