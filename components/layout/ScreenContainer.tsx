/**
 * 画面コンテナコンポーネント
 */

import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/themeSystem';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  safeArea?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  paddingBottom?: number;
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  safeArea = true,
  style,
  contentContainerStyle,
  paddingBottom = 0,
}) => {
  const { colors, spacing } = useTheme();

  const containerStyle = [
    styles.container,
    { backgroundColor: colors.background },
    style
  ];

  const content = scrollable ? (
    <ScrollView
      style={containerStyle}
      contentContainerStyle={[
        { paddingHorizontal: spacing.md, paddingBottom },
        contentContainerStyle
      ]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[containerStyle, { padding: spacing.md }]}>
      {children}
    </View>
  );

  if (safeArea) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {content}
      </SafeAreaView>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScreenContainer;
