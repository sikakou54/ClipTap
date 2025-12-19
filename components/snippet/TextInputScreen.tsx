import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/themeSystem';
import { VariableToolbar } from './VariableToolbar';
import { Header } from '../common/Header';
import { commonStyles } from '../../lib/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TextInputScreenProps {
  type: 'title' | 'content';
}

export function TextInputScreen({ type }: TextInputScreenProps) {
  const { t } = useTranslation();
  const { colors, isTablet, responsiveFontSizes, responsiveLineHeights } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const paramKey = type;
  const callbackKey = type === 'title' ? 'snippetTitleCallback' : 'snippetContentCallback';

  const initialText = (params[paramKey] as string) || '';
  const [text, setText] = useState(initialText);
  const [cursorPosition, setCursorPosition] = useState(initialText.length);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const textInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const contentHeight = useRef<number>(0);

  // キーボードイベントのリスナー
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      'keyboardWillShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      'keyboardWillHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    const keyboardDidShow = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHide = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  // 自動フォーカス
  useEffect(() => {
    setTimeout(() => {
      textInputRef.current?.focus();
      // カーソルをテキストの末尾に移動
      if (initialText.length > 0) {
        textInputRef.current?.setNativeProps({
          selection: { start: initialText.length, end: initialText.length }
        });
      }
    }, 100);
  }, []);

  // 変数挿入ハンドラー
  const insertVariable = (variableName: string) => {
    const variable = `{{${variableName}}}`;
    const newText =
      text.slice(0, cursorPosition) +
      variable +
      text.slice(cursorPosition);

    setText(newText);
    setCursorPosition(cursorPosition + variable.length);

    // フォーカスを戻す
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  };

  const handleSave = () => {
    if (params.onSave) {
      (global as any)[callbackKey]?.(text);
    }
    router.back();
  };

  return (
    <SafeAreaView
      style={[commonStyles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <Header
        title={t(`snippet.${type}_input`)}
        isModal={!isTablet}
        rightAction={
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={[styles.saveText, { color: colors.primary, fontSize: responsiveFontSizes.base, lineHeight: responsiveLineHeights.base }]}>
              {t('common.done')}
            </Text>
          </TouchableOpacity>
        }
      />

      <View
        style={[
          styles.contentWrapper,
          { marginBottom: keyboardHeight > 0 ? Platform.OS === 'ios' ? keyboardHeight : keyboardHeight + 24 : 0 }
        ]}
      >
        <TextInput
          ref={textInputRef}
          value={text}
          onChangeText={setText}
          onSelectionChange={(e) => {
            setCursorPosition(e.nativeEvent.selection.start);
          }}
          placeholder={t(`snippet.${type}_input_placeholder`)}
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: responsiveFontSizes.base,
              lineHeight: responsiveFontSizes.base * 1.5,
            }
          ]}
          multiline
          textAlignVertical="top"
          scrollEnabled={true}
        />

        {/* 変数挿入ツールバー */}
        <View
          style={[
            styles.toolbarContainer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            }
          ]}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            setToolbarHeight(height);
          }}
        >
          <VariableToolbar onInsert={insertVariable} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  saveButton: {
    padding: 4,
  },
  saveText: {
    fontWeight: '600',
  },
  contentWrapper: {
    flex: 1,
  },
  input: {
    flex: 1,
    padding: 16,
  },
  toolbarContainer: {
    borderTopWidth: 1,
  },
});
