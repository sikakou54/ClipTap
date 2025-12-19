import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';
import { useSnippets } from '../../lib/hooks/useSnippets';
import { useCategories } from '../../lib/hooks/useCategories';
import { useProfiles } from '../../lib/hooks/useProfiles';
import { CategoryBadge } from '../category/CategoryBadge';
import { VariablePreview } from './VariablePreview';
import { Header } from '../common/Header';
import { commonStyles, snippetFormStyles } from '../../lib/styles/commonStyles';
import { showError, showInfo } from '../../lib/utils/alerts';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SnippetFormScreenProps {
  mode: 'create' | 'edit';
  snippetId?: string;
}

export function SnippetFormScreen({ mode, snippetId }: SnippetFormScreenProps) {
  const { t } = useTranslation();
  const { colors, isTablet, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [copyWithTitle, setCopyWithTitle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode === 'edit');

  const { createSnippet, updateSnippet, getById } = useSnippets();
  const { categories, refresh: refreshCategories } = useCategories();
  const { profiles } = useProfiles();

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const isEditMode = mode === 'edit';
  const canSave = title.trim() !== '' && content.trim() !== '';

  // カテゴリ選択画面から戻ってきた時にカテゴリ一覧を再読み込み
  useFocusEffect(
    useCallback(() => {
      refreshCategories();
    }, [refreshCategories])
  );

  // 編集モードの場合、スニペットデータを読み込む
  useEffect(() => {
    const loadSnippet = async () => {
      if (!isEditMode || !snippetId) {
        setLoading(false);
        return;
      }

      try {
        const snippet = await getById(snippetId);
        if (snippet) {
          setTitle(snippet.title || '');
          setContent(snippet.content);
          setSelectedCategoryId(snippet.categoryId);
          setSelectedProfileIds(snippet.profileIds || []);
          setCopyWithTitle(snippet.copyWithTitle);
        }
      } catch (error) {
        showError('error.not_found');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadSnippet();
  }, [isEditMode, snippetId, getById]);

  // タイトル入力画面に遷移
  const handleTitlePress = () => {
    global.snippetTitleCallback = (newTitle: string) => {
      setTitle(newTitle);
    };
    router.push({
      pathname: '/snippet/title-input',
      params: { title, onSave: 'true' },
    });
  };

  // コンテンツ入力画面に遷移
  const handleContentPress = () => {
    global.snippetContentCallback = (newContent: string) => {
      setContent(newContent);
    };
    router.push({
      pathname: '/snippet/content-input',
      params: { content, onSave: 'true' },
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showInfo('error.empty_title');
      return;
    }

    if (!content.trim()) {
      showInfo('error.empty_content');
      return;
    }

    setSaving(true);
    try {
      if (isEditMode && snippetId) {
        await updateSnippet({
          id: snippetId,
          title: title.trim(),
          content: content.trim(),
          categoryId: selectedCategoryId,
          profileIds: selectedProfileIds,
          copyWithTitle,
        });
      } else {
        await createSnippet({
          title: title.trim(),
          content: content.trim(),
          categoryId: selectedCategoryId,
          profileIds: selectedProfileIds,
          copyWithTitle,
        });
      }
      router.back();
    } catch (error) {
      showError();
    } finally {
      setSaving(false);
    }
  };

  // ローディング表示
  if (loading) {
    return (
      <View style={[commonStyles.container, commonStyles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[commonStyles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <Header
        title={isEditMode ? t('snippet.edit') : t('snippet.create')}
        isModal={!isTablet}
        rightAction={
          <TouchableOpacity
            onPress={handleSave}
            style={snippetFormStyles.saveButton}
            disabled={saving || !canSave}
          >
            <Text style={[
              snippetFormStyles.saveText,
              {
                color: (saving || !canSave) ? colors.textSecondary : colors.primary,
                fontSize: responsiveFontSizes.base,
              }
            ]}>
              {t('common.save')}
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={snippetFormStyles.content}>
        {/* タイトル */}
        <View style={snippetFormStyles.section}>
          <TouchableOpacity
            style={[snippetFormStyles.titleButton, { backgroundColor: colors.surface }]}
            onPress={handleTitlePress}
          >
            <Text style={[snippetFormStyles.titleText, { color: title ? colors.text : colors.textSecondary, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
              {title || t('snippet.title_placeholder')}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* コンテンツ */}
        <View style={snippetFormStyles.section}>
          <TouchableOpacity
            style={[snippetFormStyles.contentButton, { backgroundColor: colors.surface }]}
            onPress={handleContentPress}
          >
            <Text
              style={[snippetFormStyles.contentText, { color: content ? colors.text : colors.textSecondary, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}
            >
              {content || t('snippet.content_placeholder')}
            </Text>
            <View style={snippetFormStyles.editIconContainer}>
              <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* カテゴリ */}
        <View style={snippetFormStyles.section}>
          <TouchableOpacity
            style={[snippetFormStyles.categoryButton, { backgroundColor: colors.surface }]}
            onPress={() => {
              // グローバルコールバックでカテゴリ選択結果を受け取る
              global.categorySelectCallback = (categoryId: string | null) => {
                setSelectedCategoryId(categoryId);
              };
              router.push({
                pathname: '/category/select',
                params: { selectedId: selectedCategoryId ?? 'null' },
              });
            }}
          >
            {selectedCategory ? (
              <CategoryBadge category={selectedCategory} />
            ) : (
              <Text style={{ color: colors.textSecondary, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }}>
                {t('snippet.select_category')}
              </Text>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* 環境（プロファイル） */}
        <View style={snippetFormStyles.section}>
          <TouchableOpacity
            style={[snippetFormStyles.categoryButton, { backgroundColor: colors.surface }]}
            onPress={() => {
              // グローバルコールバックで環境選択結果を受け取る
              global.profileSelectCallback = (profileIds: string[]) => {
                setSelectedProfileIds(profileIds);
              };
              router.push({
                pathname: '/snippet/profile-select',
                params: { selectedIds: selectedProfileIds.join(',') },
              });
            }}
          >
            <View style={{ flex: 1 }}>
              {selectedProfileIds.length === 0 ? (
                <Text style={{ color: colors.textSecondary, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }}>
                  {t('snippet.select_profile')}
                </Text>
              ) : (
                <View>
                  <Text style={{ color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base, fontWeight: '500' }}>
                    {t('snippet.profiles_selected', { count: selectedProfileIds.length })}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: responsiveFontSizes.sm, marginTop: 2 }}>
                    {profiles
                      .filter(p => selectedProfileIds.includes(p.id))
                      .map(p => p.name)
                      .join(', ')}
                  </Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* タイトル付きコピー */}
        <View style={snippetFormStyles.section}>
          <View style={[snippetFormStyles.categoryButton, { backgroundColor: colors.surface }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base, fontWeight: '500' }}>
                {t('snippet.copy_with_title')}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: responsiveFontSizes.sm, marginTop: 2 }}>
                {t('snippet.copy_with_title_description')}
              </Text>
            </View>
            <Switch
              value={copyWithTitle}
              onValueChange={setCopyWithTitle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        {/* 変数プレビュー */}
        <VariablePreview
          title={title}
          content={content}
          selectedProfileIds={selectedProfileIds}
          copyWithTitle={copyWithTitle}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
