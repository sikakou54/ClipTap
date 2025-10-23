import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { Category } from '../../lib/types/category';
import { CreateCategoryModal } from './CreateCategoryModal';

interface CategoryPickerProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
  visible: boolean;
  onClose: () => void;
  onCategoryCreated?: () => void;
}

export function CategoryPicker({
  categories,
  selectedCategoryId,
  onSelect,
  visible,
  onClose,
  onCategoryCreated,
}: CategoryPickerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSelect = (categoryId: string | null) => {
    onSelect(categoryId);
    onClose();
  };

  const uncategorizedOption = {
    id: null,
    name: t('category.uncategorized'),
    color: colors.textSecondary,
    icon: 'remove-circle-outline',
  };

  const createNewOption = {
    id: 'create-new',
    name: t('category.create'),
    color: colors.primary,
    icon: 'add-circle-outline',
  };

  const options = [uncategorizedOption, ...categories, createNewOption];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('category.select')}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={options}
            keyExtractor={(item) => item.id || 'uncategorized'}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedCategoryId;
              const categoryColor = item.color || colors.primary;
              const isCreateNew = item.id === 'create-new';

              return (
                <TouchableOpacity
                  style={[
                    styles.item,
                    { borderBottomColor: colors.border },
                    isCreateNew && styles.createNewItem,
                  ]}
                  onPress={() => {
                    if (isCreateNew) {
                      setShowCreateModal(true);
                    } else {
                      handleSelect(item.id);
                    }
                  }}
                >
                  <View style={styles.itemLeft}>
                    {isCreateNew ? (
                      <View style={styles.iconContainer}>
                        <Ionicons name="add-circle" size={32} color={colors.primary} />
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.colorIndicator,
                          { backgroundColor: categoryColor },
                        ]}
                      />
                    )}
                    <Text style={[
                      styles.itemText,
                      { color: isCreateNew ? colors.primary : colors.text }
                    ]}>
                      {item.name}
                    </Text>
                  </View>
                  {isSelected && !isCreateNew && (
                    <Ionicons name="checkmark" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>

      <CreateCategoryModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          if (onCategoryCreated) {
            onCategoryCreated();
          }
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
  },
  createNewItem: {
    borderBottomWidth: 0,
  },
});
