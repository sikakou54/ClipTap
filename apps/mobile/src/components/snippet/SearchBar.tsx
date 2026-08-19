/**
 * 検索バーコンポーネント
 *
 * スニペット検索用の入力フィールド。
 * 検索アイコン、入力フィールド、クリアボタンを含む。
 *
 * @see app/search.tsx - 検索画面での使用例
 */

import { useCallback } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@cliptap/shared';
import { useTheme } from '@lib/themeSystem';
import { UI_CONSTANTS } from '@constants/ui';

/**
 * SearchBarのProps
 * @property value - 入力値（制御コンポーネント）
 * @property onChangeText - テキスト変更時のコールバック
 * @property onClear - クリアボタン押下時のコールバック（省略可：デフォルトでテキストを空にする）
 * @property placeholder - プレースホルダーテキスト（省略可）
 * @property autoFocus - マウント時に自動フォーカスするか（省略可、デフォルト: false）
 */
interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder,
  autoFocus = false,
}: SearchBarProps) {
  const { t } = useTranslation();
  const { colors, responsiveFontSizes } = useTheme();

  /**
   * クリアボタン押下時の処理
   * onClearが指定されている場合はそれを実行、なければ空文字をセット
   */
  const handleClear = useCallback(() => {
    if (onClear) {
      onClear();
    } else {
      onChangeText('');
    }
  }, [onClear, onChangeText]);
  /* 検索バーコンテナ */
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* 検索アイコン */}
      <Ionicons
        name="search"
        size={20}
        color={colors.textSecondary}
        style={styles.icon}
      />

      {/* テキスト入力フィールド */}
      <TextInput
        style={[styles.input, { color: colors.text, fontSize: responsiveFontSizes.base }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || t('snippet.search_placeholder')}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        autoFocus={autoFocus}
      />

      {/* クリアボタン（入力がある場合のみ表示） */}
      {value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearButton}
          hitSlop={UI_CONSTANTS.HIT_SLOP.DEFAULT}
        >
          <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 45,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
});
