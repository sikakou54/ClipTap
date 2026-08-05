/**
 * 共通入力フィールドコンポーネント
 *
 * アプリ全体で使用される統一された入力フィールド。
 * バリデーション機能、アイコン表示、エラー表示を提供。
 *
 * 主な機能:
 * - 入力タイプ別キーボード設定（text, email, password, number, multiline）
 * - リアルタイムバリデーション（入力時 or フォーカスアウト時）
 * - ラベル・ヘルパーテキスト・エラーメッセージ表示
 * - 左右アイコン配置（右アイコンはタップ可能）
 * - フォーカス状態のボーダー色変更
 *
 * @see SnippetFormScreen - 使用例
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  TextInput,
  View,
  Text,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';

/*
 * ========================================
 * 型定義
 * ========================================
 */

/**
 * 入力タイプ
 * - text: 通常テキスト（デフォルト）
 * - email: メールアドレス（@キーボード）
 * - password: パスワード（マスク表示）
 * - number: 数値（テンキー）
 * - multiline: 複数行テキスト
 */
export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'multiline';

/*
 * ========================================
 * Props定義
 * ========================================
 */

/**
 * CommonInputのProps
 * @property type - 入力タイプ（キーボード種類を決定）
 * @property label - 入力欄上部のラベルテキスト
 * @property error - 外部から渡すエラーメッセージ
 * @property helperText - ヘルパーテキスト（エラーがない時に表示）
 * @property icon - 左側アイコン名
 * @property rightIcon - 右側アイコン名
 * @property onRightIconPress - 右アイコンタップ時のコールバック
 * @property containerStyle - コンテナのスタイル上書き
 * @property inputStyle - 入力欄のスタイル上書き
 * @property required - 必須マーク表示フラグ
 * @property validateOnChange - 入力時にバリデーション実行するか
 * @property validator - カスタムバリデーション関数
 * @property onValidationChange - バリデーション結果変更時のコールバック
 */
interface CommonInputProps extends Omit<TextInputProps, 'style'> {
  type?: InputType;
  label?: string;
  error?: string;
  helperText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  required?: boolean;
  validateOnChange?: boolean;
  validator?: (value: string) => { isValid: boolean; error?: string };
  onValidationChange?: (isValid: boolean, error?: string) => void;
}

const CommonInput: React.FC<CommonInputProps> = ({
  type = 'text',
  label,
  error,
  helperText,
  icon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  required = false,
  validateOnChange = false,
  validator,
  onValidationChange,
  onChangeText,
  onBlur,
  onFocus,
  ...textInputProps
}) => {
  /*
   * ========================================
   * Hooks & コンテキスト
   * ========================================
   */
  const { colors, spacing, typography } = useTheme();

  /*
   * ========================================
   * 状態管理
   * ========================================
   */
  const [validationError, setValidationError] = useState<string | undefined>();
  const [focused, setFocused] = useState(false);

  const displayError = error || validationError;

  /*
   * ========================================
   * ヘルパー関数
   * ========================================
   */

  /**
   * バリデーション実行
   * validatorが渡されている場合のみ実行し、
   * 結果をstateとコールバックで通知
   */
  const runValidation = useCallback((value: string) => {
    if (!validator) return;

    const result = validator(value);
    const errorMessage = result.isValid ? undefined : result.error;
    setValidationError(errorMessage);

    if (onValidationChange) {
      onValidationChange(result.isValid, errorMessage);
    }
  }, [validator, onValidationChange]);

  /*
   * ========================================
   * イベントハンドラ
   * ========================================
   */

  /**
   * テキスト変更時の処理
   * 親コンポーネントへ通知し、validateOnChangeがtrueならバリデーション実行
   */
  const handleChangeText = useCallback((text: string) => {
    onChangeText?.(text);

    if (validateOnChange) {
      runValidation(text);
    }
  }, [onChangeText, validateOnChange, runValidation]);

  /**
   * フォーカスアウト時の処理
   */
  const handleBlur = useCallback<NonNullable<TextInputProps['onBlur']>>((e) => {
    setFocused(false);
    onBlur?.(e);

    if (validator && textInputProps.value) {
      runValidation(textInputProps.value);
    }
  }, [onBlur, validator, runValidation, textInputProps.value]);

  /**
   * フォーカス時の処理
   */
  const handleFocus = useCallback<NonNullable<TextInputProps['onFocus']>>((e) => {
    setFocused(true);
    onFocus?.(e);
  }, [onFocus]);

  /**
   * 入力タイプに応じたキーボードタイプを取得
   * @returns React Nativeのキーボードタイプ
   */
  const getKeyboardType = (): TextInputProps['keyboardType'] => {
    switch (type) {
      case 'email':
        return 'email-address';
      case 'number':
        return 'numeric';
      default:
        return 'default';
    }
  };

  /**
   * ボーダー色を決定
   * 優先順位: エラー > フォーカス > 通常
   */
  const borderColor = useMemo(() => {
    if (displayError) return colors.error;
    if (focused) return colors.primary;
    return colors.border;
  }, [displayError, focused, colors]);

  /*
   * ========================================
   * レンダリング
   * ========================================
   */

  /* 共通入力フィールドコンテナ */
  return (
    <View style={containerStyle}>
      {/* ラベル（オプション） */}
      {label && (
        <Text style={[
          typography.label,
          { color: colors.text, marginBottom: spacing.xs }
        ]}>
          {label}
          {/* 必須マーク */}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}

      {/* 入力欄コンテナ（アイコン + テキスト入力 + 右アイコン） */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor,
        borderRadius: 8,
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.sm,
        minHeight: type === 'multiline' ? 100 : 44,
      }}>
        {/* 左側アイコン（オプション） */}
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={colors.textSecondary}
            style={{ marginRight: spacing.xs }}
          />
        )}

        {/* テキスト入力欄 */}
        <TextInput
          style={[
            typography.body,
            {
              flex: 1,
              color: colors.text,
              paddingVertical: spacing.xs,
              textAlignVertical: type === 'multiline' ? 'top' : 'center',
            },
            inputStyle
          ]}
          placeholderTextColor={colors.textTertiary}
          keyboardType={getKeyboardType()}
          secureTextEntry={type === 'password'}
          multiline={type === 'multiline'}
          numberOfLines={type === 'multiline' ? 4 : 1}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          onFocus={handleFocus}
          {...textInputProps}
        />

        {/* 右側アイコン（オプション、タップ可能） */}
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={colors.textSecondary}
              style={{ marginLeft: spacing.xs }}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* エラーメッセージまたはヘルパーテキスト */}
      {(displayError || helperText) && (
        <Text style={[
          typography.caption,
          {
            color: displayError ? colors.error : colors.textSecondary,
            marginTop: spacing.xxs
          }
        ]}>
          {displayError || helperText}
        </Text>
      )}
    </View>
  );
};

export default CommonInput;
