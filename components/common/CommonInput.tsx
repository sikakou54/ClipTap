/**
 * 共通入力フィールドコンポーネント
 * バリデーション機能付き
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  TextInput,
  View,
  Text,
  TextInputProps,
  ViewStyle,
  TextStyle,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeSystem';

export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'multiline';

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
  const [validationError, setValidationError] = useState<string | undefined>();
  const [focused, setFocused] = useState(false);
  const { colors, spacing, typography } = useTheme();

  const displayError = error || validationError;

  const runValidation = useCallback((value: string) => {
    if (!validator) return;

    const result = validator(value);
    const errorMessage = result.isValid ? undefined : result.error;
    setValidationError(errorMessage);

    if (onValidationChange) {
      onValidationChange(result.isValid, errorMessage);
    }
  }, [validator, onValidationChange]);

  const handleChangeText = useCallback((text: string) => {
    onChangeText?.(text);

    if (validateOnChange) {
      runValidation(text);
    }
  }, [onChangeText, validateOnChange, runValidation]);

  const handleBlur = useCallback((e: any) => {
    setFocused(false);
    onBlur?.(e);

    if (validator && textInputProps.value) {
      runValidation(textInputProps.value as string);
    }
  }, [onBlur, validator, runValidation, textInputProps.value]);

  const handleFocus = useCallback((e: any) => {
    setFocused(true);
    onFocus?.(e);
  }, [onFocus]);

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

  const borderColor = useMemo(() => {
    if (displayError) return colors.error;
    if (focused) return colors.primary;
    return colors.border;
  }, [displayError, focused, colors]);

  return (
    <View style={containerStyle}>
      {label && (
        <Text style={[
          typography.label,
          { color: colors.text, marginBottom: spacing.xs }
        ]}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}

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
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={colors.textSecondary}
            style={{ marginRight: spacing.xs }}
          />
        )}

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
