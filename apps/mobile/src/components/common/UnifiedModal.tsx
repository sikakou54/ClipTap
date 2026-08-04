/**
 * @module UnifiedModal
 * @description
 * 統一アニメーションモーダルコンポーネント
 *
 * プロジェクト全体で使用する統一されたモーダル基盤。
 * 複数のポジション、アニメーション、インタラクションに対応。
 *
 * 機能:
 * - 3種類のポジション（bottom, center, top）
 * - 3種類のアニメーション（slide, fade, none）
 * - スワイプジェスチャーでの閉じる操作（bottom位置のみ）
 * - ハンドルバー表示（bottom位置のみ）
 * - 背景タップで閉じる
 * - ADHD特性に配慮した視覚強化オプション
 *
 * プリセットコンポーネント:
 * - BottomSheetModal: 下からスライドイン
 * - CenterModal: 中央にフェードイン
 * - FullScreenModal: 全画面モーダル
 *
 * @see BottomSheetModal - 下部モーダルのプリセット
 * @see CenterModal - 中央モーダルのプリセット
 */

import React, { useRef, useEffect, ReactNode, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  ViewStyle,
  DimensionValue,
  PanResponder,
  GestureResponderHandlers,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@lib/themeSystem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@cliptap/shared';
import { UI_CONSTANTS } from '@constants/ui';

const { height: screenHeight } = Dimensions.get('window');
const ANIMATION = UI_CONSTANTS.ANIMATION_DURATION;

/*
 * ========================================
 * アニメーションフック
 * ========================================
 */

interface UseModalAnimationParams {
  visible: boolean;
  animationType: ModalAnimationType;
  position: ModalPosition;
  onClose: () => void;
}

interface UseModalAnimationReturn {
  slideAnim: Animated.Value;
  backdropOpacity: Animated.Value;
  scaleAnim: Animated.Value;
  animatedClose: () => void;
  panHandlers: GestureResponderHandlers;
  getAnimatedStyle: () => Animated.WithAnimatedValue<ViewStyle>;
}

function useModalAnimation({
  visible,
  animationType,
  position,
  onClose,
}: UseModalAnimationParams): UseModalAnimationReturn {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [isClosing, setIsClosing] = useState(false);

  const animatedClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);

    const animations: Animated.CompositeAnimation[] = [
      Animated.timing(backdropOpacity, { toValue: 0, duration: ANIMATION.NORMAL, useNativeDriver: true }),
    ];

    if (animationType === 'slide') {
      animations.unshift(
        Animated.timing(slideAnim, { toValue: screenHeight, duration: ANIMATION.NORMAL, useNativeDriver: true })
      );
    } else if (animationType === 'fade') {
      animations.unshift(
        Animated.timing(scaleAnim, { toValue: 0.8, duration: ANIMATION.FAST, useNativeDriver: true })
      );
    }

    Animated.parallel(animations).start(() => {
      setIsClosing(false);
      onClose();
    });
  }, [onClose, isClosing, animationType, slideAnim, backdropOpacity, scaleAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => position === 'bottom',
      onMoveShouldSetPanResponder: (_, gestureState) => position === 'bottom' && gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) slideAnim.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          animatedClose();
        } else {
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!visible) return;

    setIsClosing(false);
    if (animationType === 'slide') slideAnim.setValue(screenHeight);
    else if (animationType === 'fade') scaleAnim.setValue(0.8);
    backdropOpacity.setValue(0);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const animations: Animated.CompositeAnimation[] = [
          Animated.timing(backdropOpacity, { toValue: 1, duration: ANIMATION.ELEGANT, useNativeDriver: true }),
        ];

        if (animationType === 'slide') {
          animations.unshift(
            Animated.timing(slideAnim, { toValue: 0, duration: ANIMATION.ELEGANT, useNativeDriver: true })
          );
        } else if (animationType === 'fade') {
          animations.unshift(
            Animated.timing(scaleAnim, { toValue: 1, duration: ANIMATION.NORMAL, useNativeDriver: true })
          );
        }

        Animated.parallel(animations).start();
      });
    });
  }, [visible, animationType, slideAnim, backdropOpacity, scaleAnim]);

  const getAnimatedStyle = useCallback((): Animated.WithAnimatedValue<ViewStyle> => {
    if (animationType === 'slide') return { transform: [{ translateY: slideAnim }] };
    if (animationType === 'fade') return { transform: [{ scale: scaleAnim }], opacity: scaleAnim };
    return {};
  }, [animationType, slideAnim, scaleAnim]);

  return {
    slideAnim,
    backdropOpacity,
    scaleAnim,
    animatedClose,
    panHandlers: panResponder.panHandlers,
    getAnimatedStyle,
  };
}

/*
 * ========================================
 * 型定義
 * ========================================
 */

/** アニメーションタイプ */
export type ModalAnimationType = 'slide' | 'fade' | 'none';
/** モーダルの表示位置 */
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

/*
 * ========================================
 * メインコンポーネント
 * ========================================
 */

/**
 * 統一モーダルコンポーネント
 *
 * 全てのモーダルUIの基盤となるコンポーネント。
 * アニメーション、ジェスチャー、スタイルを統一的に管理。
 */
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

  const { backdropOpacity, animatedClose, panHandlers, getAnimatedStyle } = useModalAnimation({
    visible,
    animationType,
    position,
    onClose,
  });

  const computedContentStyle = useMemo((): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
      paddingTop: showHandle && position === 'bottom' ? spacing.sm : spacing.lg,
      paddingBottom: spacing.xl,
      ...(enhancedVisuals && {
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.large,
      }),
      ...contentStyle,
    };

    const positionStyles: Record<ModalPosition, ViewStyle> = {
      bottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        paddingBottom: spacing.xl + insets.bottom,
      },
      center: {
        position: 'absolute',
        top: '50%',
        left: '5%',
        right: '5%',
        marginTop: -100,
        borderRadius: 20,
      },
      top: {
        position: 'absolute',
        top: insets.top + spacing.lg,
        left: 0,
        right: 0,
        borderRadius: 0,
      },
    };

    return { ...baseStyle, ...positionStyles[position], maxHeight };
  }, [colors, spacing, shadows, contentStyle, enhancedVisuals, position, showHandle, maxHeight, insets]);

  /* 統一モーダルコンテナ */
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        {/* 背景オーバーレイ（フェードアニメーション） */}
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

        {/* 背景タップエリア（閉じる操作） */}
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={dismissOnBackdropPress ? animatedClose : undefined}
        />

        {/* モーダルコンテンツ（アニメーション適用） */}
        <Animated.View style={[computedContentStyle, getAnimatedStyle()]}>
          {/* ハンドルバー（bottom位置のみ、スワイプジェスチャー対応） */}
          {showHandle && position === 'bottom' && (
            <View
              style={{ alignItems: 'center', paddingBottom: spacing.md, paddingTop: spacing.sm }}
              {...panHandlers}
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

          {/* ヘッダー（タイトルと閉じるボタン） */}
          {(title || showCloseButton) && (
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.lg,
              paddingTop: showHandle && position === 'bottom' ? 0 : undefined,
            }}>
              {/* タイトル */}
              {title ? (
                <Text style={[typography.h2, { color: colors.textPrimary, fontWeight: '700', flex: 1 }]}>
                  {title}
                </Text>
              ) : (
                <View style={{ flex: 1 }} />
              )}

              {/* 閉じるボタン */}
              {showCloseButton && (
                <TouchableOpacity
                  style={{
                    padding: spacing.xs,
                    borderRadius: 12,
                    backgroundColor: enhancedVisuals ? colors.surface : 'transparent',
                  }}
                  onPress={animatedClose}
                  accessibilityLabel={t('common.closeModal')}
                  accessibilityRole="button"
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* モーダルコンテンツ（子要素） */}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

/*
 * ========================================
 * プリセットコンポーネント
 * ========================================
 */

/**
 * 下部スライドモーダル
 *
 * 画面下部からスライドインするモーダル。
 * ピッカーやアクションシートに最適。
 *
 * デフォルト設定:
 * - position: bottom（下部表示）
 * - animationType: slide（スライドアニメーション）
 * - maxHeight: 95%（画面の95%まで表示可能）
 */
export const BottomSheetModal: React.FC<Omit<UnifiedModalProps, 'position' | 'animationType'>> = ({
  maxHeight = '95%',
  ...props
}) => (
  <UnifiedModal
    {...props}
    maxHeight={maxHeight}
    position="bottom"
    animationType="slide"
  />
);

/**
 * 中央フェードモーダル
 *
 * 画面中央にフェードインするモーダル。
 * 確認ダイアログやアラートに最適。
 *
 * デフォルト設定:
 * - position: center（中央表示）
 * - animationType: fade（フェードアニメーション）
 */
export const CenterModal: React.FC<Omit<UnifiedModalProps, 'position' | 'animationType'>> = (props) => (
  <UnifiedModal
    {...props}
    position="center"
    animationType="fade"
  />
);

/**
 * 全画面モーダル
 *
 * 画面全体を覆うモーダル。
 * 複雑なフォームや詳細表示に最適。
 *
 * デフォルト設定:
 * - position: top（上部表示）
 * - maxHeight: 100%（全画面）
 * - showHandle: false（ハンドルバー非表示）
 * - animationType: slide（デフォルト、カスタマイズ可能）
 */
export const FullScreenModal: React.FC<Omit<UnifiedModalProps, 'position' | 'maxHeight' | 'showHandle'>> = ({
  animationType = 'slide',
  ...props
}) => (
  <UnifiedModal
    {...props}
    animationType={animationType}
    position="top"
    maxHeight="100%"
    showHandle={false}
  />
);

export default UnifiedModal;
