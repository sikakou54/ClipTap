/**
 * ローディングスピナーコンポーネント
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/themeSystem';

type LoadingSize = 'small' | 'medium' | 'large';

interface LoadingSpinnerProps {
  message?: string;
  size?: LoadingSize;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'medium',
  fullScreen = false,
}) => {
  const { colors, spacing, typography } = useTheme();

  const getSizeValue = (): 'small' | 'large' => {
    return size === 'small' ? 'small' : 'large';
  };

  const content = (
    <View style={[
      styles.container,
      fullScreen && styles.fullScreen,
      { gap: spacing.sm }
    ]}>
      <ActivityIndicator
        size={getSizeValue()}
        color={colors.primary}
      />
      {message && (
        <Text style={[
          typography.body,
          { color: colors.textSecondary }
        ]}>
          {message}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={[
        styles.fullScreenContainer,
        { backgroundColor: colors.background }
      ]}>
        {content}
      </View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullScreen: {
    flex: 1,
  },
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});

export default LoadingSpinner;
