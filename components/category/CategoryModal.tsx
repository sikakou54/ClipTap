import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { useCategories } from '../../lib/hooks/useCategories';
import { CATEGORY_COLORS } from '../../lib/constants/colors';
import { Category } from '../../lib/types/category';
import { UI_CONSTANTS } from '../../lib/constants/ui';
import { showAlert } from '../../lib/utils/alerts';

interface CategoryModalProps {
  visible: boolean;
  category?: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryModal({
  visible,
  category,
  onClose,
  onSuccess,
}: CategoryModalProps) {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const { createCategory, updateCategory } = useCategories();
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const isEdit = !!category;

  useEffect(() => {
    if (category) {
      setCategoryName(category.name);
      setSelectedColor(category.color || CATEGORY_COLORS[0]);
    } else {
      setCategoryName('');
      setSelectedColor(CATEGORY_COLORS[0]);
    }
  }, [category, visible]);

  const handleSave = async () => {
    if (!categoryName.trim()) {
      showAlert(t('error.generic'), t('error.empty_content'), undefined, 'error');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateCategory(category.id, {
          name: categoryName.trim(),
          color: selectedColor,
        });
      } else {
        await createCategory({
          name: categoryName.trim(),
          color: selectedColor,
        });
      }
      handleClose();
      onSuccess();
    } catch (error: any) {
      showAlert(t('error.generic'), error.message, undefined, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setCategoryName('');
    setSelectedColor(CATEGORY_COLORS[0]);
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
            <Text style={[styles.title, { color: colors.text, fontSize: responsiveFontSizes.md, lineHeight: responsiveLineHeights.md }]}>
              {isEdit ? t('category.edit') : t('category.create')}
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

          <Text style={[styles.label, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>{t('category.color')}</Text>
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
              <Text style={[styles.buttonText, { color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={saving || !categoryName.trim()}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF', fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
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
    padding: UI_CONSTANTS.GAP.XL,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.XL,
    padding: UI_CONSTANTS.GAP.XL,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.GAP.LG,
  },
  title: {

    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
  input: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    padding: UI_CONSTANTS.GAP.BASE,

    marginBottom: UI_CONSTANTS.GAP.LG,
  },
  label: {

    fontWeight: UI_CONSTANTS.FONT_WEIGHT.MEDIUM,
    marginBottom: UI_CONSTANTS.GAP.BASE,
  },
  colorPicker: {
    paddingVertical: UI_CONSTANTS.GAP.XS,
    gap: UI_CONSTANTS.GAP.BASE,
    marginBottom: UI_CONSTANTS.GAP.XL,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.XL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.EXTRA_THICK,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: UI_CONSTANTS.GAP.XXS },
    shadowOpacity: 0.3,
    shadowRadius: UI_CONSTANTS.GAP.XS,
    elevation: UI_CONSTANTS.GAP.XS,
  },
  buttons: {
    flexDirection: 'row',
    gap: UI_CONSTANTS.GAP.BASE,
  },
  button: {
    flex: 1,
    paddingVertical: UI_CONSTANTS.GAP.BASE,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.BASE,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: UI_CONSTANTS.BORDER_WIDTH.THIN,
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  buttonText: {

    fontWeight: UI_CONSTANTS.FONT_WEIGHT.SEMIBOLD,
  },
});
