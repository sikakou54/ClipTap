// 統一アニメーションモーダルコンポーネント
// プロジェクト全体の重複モーダル実装を統一
// ADHD特性に配慮した直感的なアニメーション

import React, { useRef, useEffect, ReactNode, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  ViewStyle,
  DimensionValue,
  PanResponder
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/themeSystem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const { height: screenHeight } = Dimensions.get('window');

// 型定義

export type ModalAnimationType = 'slide' | 'fade' | 'none';
export type ModalPosition = 'bottom' | 'center' | 'top';

export interface UnifiedModalProps {
  /** モーダルの表示状態 */
  visible: boolean;
  /** モーダルを閉じる処理 */
  onClose: () => void;
  /** モーダル内のコンテンツ */
  children: ReactNode;
  /** モーダルのタイトル（オプション） */
  title?: string;
  /** アニメーションタイプ（デフォルト: slide） */
  animationType?: ModalAnimationType;
  /** モーダルの位置（デフォルト: bottom） */
  position?: ModalPosition;
  /** 背景タップで閉じるか（デフォルト: true） */
  dismissOnBackdropPress?: boolean;
  /** クローズボタンを表示するか（デフォルト: true） */
  showCloseButton?: boolean;
  /** ハンドルバーを表示するか（デフォルト: true、bottom位置時のみ） */
  showHandle?: boolean;
  /** カスタムスタイル */
  contentStyle?: object;
  /** モーダルの最大高さ（デフォルト: 80%） */
  maxHeight?: DimensionValue;
  /** モーダルの幅（デフォルト: 100%、center位置時は90%） */
  width?: DimensionValue;
  /** ADHDユーザー向け視覚強化（デフォルト: true） */
  enhancedVisuals?: boolean;
}

// 統一モーダルコンポーネント

export const UnifiedModal: React.FC<UnifiedModalProps> = ({
  visible,
  onClose,
  children,
  title,
  animationType = 'slide',
  position = 'bottom',
  dismissOnBackdropPress = true,
  showCloseButton = true,
  showHandle = true,
  contentStyle = {},
  maxHeight = '80%',
  enhancedVisuals = true
}) => {
  const { colors, spacing, typography, shadows } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // ==============================
  // アニメーション値
  // ==============================
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // アニメーション準備完了フラグ
  // モーダル表示準備完了フラグ

  // ==============================
  // アニメーション制御
  // ==============================
  const [isClosing, setIsClosing] = useState(false);

  // PanResponderでスワイプジェスチャーを処理
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => position === 'bottom',
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 下方向のスワイプのみ反応
        return position === 'bottom' && gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // 100px以上スワイプしたか、速度が十分速い場合は閉じる
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          animatedClose();
        } else {
          // 元の位置に戻す
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  // アニメーション付きでモーダルを閉じる関数
  const animatedClose = useCallback(() => {
    if (isClosing) return; // 既に閉じる処理中の場合は無視

    setIsClosing(true);

    const animations = [];

    if (animationType === 'slide') {
      animations.push(
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 280, // 少し長めにして滑らかに
          useNativeDriver: true,
        })
      );
    } else if (animationType === 'fade') {
      animations.push(
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 220,
          useNativeDriver: true,
        })
      );
    }

    animations.push(
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      })
    );

    Animated.parallel(animations).start(() => {
      // アニメーション完了後にモーダルを閉じる
      setIsClosing(false);
      onClose();
    });
  }, [onClose, isClosing, animationType, slideAnim, backdropOpacity, scaleAnim]);

  useEffect(() => {
    if (visible) {
      // フラグをリセット
      setIsClosing(false);

      // アニメーション値を初期値に設定
      if (animationType === 'slide') {
        slideAnim.setValue(screenHeight);
      } else if (animationType === 'fade') {
        scaleAnim.setValue(0.8);
      }
      backdropOpacity.setValue(0);

      // 2段階でアニメーション開始（確実にちらつき防止）
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {

          const animations = [];

          if (animationType === 'slide') {
            animations.push(
              Animated.timing(slideAnim, {
                toValue: 0,
                duration: 320, // 開く時は少し長めで優雅に
                useNativeDriver: true,
              })
            );
          } else if (animationType === 'fade') {
            animations.push(
              Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 280,
                useNativeDriver: true,
              })
            );
          }

          animations.push(
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 320,
              useNativeDriver: true,
            })
          );

          Animated.parallel(animations).start();
        });
      });
    }
  }, [visible, animationType, slideAnim, backdropOpacity, scaleAnim]);

  // ==============================
  // スタイル計算
  // ==============================

  const getContentStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
      paddingTop: showHandle && position === 'bottom' ? spacing.sm : spacing.lg,
      paddingBottom: spacing.xl,
      // ADHD配慮の視覚強化
      ...(enhancedVisuals && {
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.large,
      }),
      ...contentStyle,
    };

    // Position-specific styles
    if (position === 'bottom') {
      baseStyle.position = 'absolute';
      baseStyle.bottom = 0;
      baseStyle.left = 0;
      baseStyle.right = 0;
      baseStyle.borderTopLeftRadius = 24;
      baseStyle.borderTopRightRadius = 24;
      baseStyle.borderBottomLeftRadius = 0;
      baseStyle.borderBottomRightRadius = 0;
      baseStyle.paddingBottom = spacing.xl + insets.bottom; // Safe areaを考慮
    } else if (position === 'center') {
      baseStyle.position = 'absolute';
      baseStyle.top = '50%';
      baseStyle.left = '5%';
      baseStyle.right = '5%';
      baseStyle.marginTop = -100; // 高さの半分程度を想定
      baseStyle.borderRadius = 20;
    } else { // top
      baseStyle.position = 'absolute';
      baseStyle.top = insets.top + spacing.lg;
      baseStyle.left = 0;
      baseStyle.right = 0;
      baseStyle.borderRadius = 0;
    }

    // maxHeightは文字列で渡されるため、別途設定
    if (maxHeight) {
      (baseStyle as any).maxHeight = maxHeight;
    }

    return baseStyle;
  };

  const getAnimatedStyle = (): any => {
    if (animationType === 'slide') {
      return {
        transform: [{ translateY: slideAnim }],
      };
    } else if (animationType === 'fade') {
      return {
        transform: [{ scale: scaleAnim }],
        opacity: scaleAnim,
      };
    }
    return {};
  };

  // ==============================
  // レンダリング
  // ==============================

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        {/* 背景オーバーレイ */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            opacity: backdropOpacity,
          }}
        />

        {/* 背景タップエリア */}
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={dismissOnBackdropPress ? animatedClose : undefined}
        />

        {/* モーダルコンテンツ */}
        <Animated.View style={[getContentStyle(), getAnimatedStyle()]}>
          {/* ハンドルバー（bottom位置のみ） */}
          {showHandle && position === 'bottom' && (
            <View
              style={{
                alignItems: 'center',
                paddingBottom: spacing.md,
                paddingTop: spacing.sm,
              }}
              {...panResponder.panHandlers}
            >
              <View style={{
                width: 40,
                height: 4,
                backgroundColor: colors.textSecondary,
                borderRadius: 2,
                opacity: 0.3,
              }} />
            </View>
          )}

          {/* ヘッダー部分 */}
          {(title || showCloseButton) && (
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.lg,
              paddingTop: showHandle && position === 'bottom' ? 0 : undefined,
            }}>
              {title ? (
                <Text style={[
                  typography.h2,
                  {
                    color: colors.textPrimary,
                    fontWeight: '700',
                    flex: 1,
                  }
                ]}>
                  {title}
                </Text>
              ) : (
                <View style={{ flex: 1 }} />
              )}

              {showCloseButton && (
                <TouchableOpacity
                  style={{
                    padding: spacing.xs,
                    borderRadius: 12,
                    backgroundColor: enhancedVisuals ? colors.surface : 'transparent',
                  }}
                  onPress={animatedClose}
                  accessibilityLabel={t('common.closeModal', 'モーダルを閉じる')}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* メインコンテンツ */}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

// 便利なプリセット

export const BottomSheetModal: React.FC<Omit<UnifiedModalProps, 'position' | 'animationType'>> = ({
  visible,
  onClose,
  children,
  title,
  dismissOnBackdropPress,
  showCloseButton,
  showHandle,
  contentStyle,
  maxHeight,
  width,
  enhancedVisuals
}) => (
  <UnifiedModal
    visible={visible}
    onClose={onClose}
    children={children}
    title={title}
    dismissOnBackdropPress={dismissOnBackdropPress}
    showCloseButton={showCloseButton}
    showHandle={showHandle}
    contentStyle={contentStyle}
    maxHeight={maxHeight || "95%"}
    width={width}
    enhancedVisuals={enhancedVisuals}
    position="bottom"
    animationType="slide"
  />
);

export const CenterModal: React.FC<Omit<UnifiedModalProps, 'position' | 'animationType'>> = ({
  visible,
  onClose,
  children,
  title,
  dismissOnBackdropPress,
  showCloseButton,
  showHandle,
  contentStyle,
  maxHeight,
  width,
  enhancedVisuals
}) => (
  <UnifiedModal
    visible={visible}
    onClose={onClose}
    children={children}
    title={title}
    dismissOnBackdropPress={dismissOnBackdropPress}
    showCloseButton={showCloseButton}
    showHandle={showHandle}
    contentStyle={contentStyle}
    maxHeight={maxHeight}
    width={width}
    enhancedVisuals={enhancedVisuals}
    position="center"
    animationType="fade"
  />
);

export const FullScreenModal: React.FC<Omit<UnifiedModalProps, 'position' | 'maxHeight' | 'showHandle'>> = ({
  visible,
  onClose,
  children,
  title,
  dismissOnBackdropPress,
  showCloseButton,
  contentStyle,
  animationType,
  width,
  enhancedVisuals
}) => (
  <UnifiedModal
    visible={visible}
    onClose={onClose}
    children={children}
    title={title}
    dismissOnBackdropPress={dismissOnBackdropPress}
    showCloseButton={showCloseButton}
    contentStyle={contentStyle}
    animationType={animationType || "slide"}
    width={width}
    enhancedVisuals={enhancedVisuals}
    position="top"
    maxHeight="100%"
    showHandle={false}
  />
);

export default UnifiedModal;