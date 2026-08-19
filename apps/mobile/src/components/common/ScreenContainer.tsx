/**
 * 画面ルートコンテナ
 *
 * すべての画面のルート要素。セーフエリアの確保とヘッダー描画をまとめて担う。
 *
 * 主な機能:
 * - セーフエリアの確保（SafeAreaView）
 * - ヘッダー描画（Headerへのprops転送、またはcustomHeaderの差し込み）
 * - キーボード回避（keyboardAvoiding指定時のみ）
 *
 * セーフエリアをこのコンポーネントへ集約している理由:
 * useSafeAreaInsets()はナビゲータ直下に1つだけ存在するSafeAreaProviderの値、
 * すなわちウィンドウ全体のインセットを返す。iOSのpresentation: 'modal'は
 * ステータスバーより下のカード表示になるため、モーダル内で同フックを使うと
 * 不要な上部インセットが返る。逆にAndroidのモーダルは全画面表示かつ
 * edgeToEdgeEnabledのため、呼び出し側がSafeAreaViewを付け忘れると
 * ヘッダーがステータスバーへ潜り込む。
 * ネイティブのSafeAreaViewは画面ごとのインセットを参照するので、
 * 画面ルートを本コンポーネントに統一することで両プラットフォームで正しくなる。
 *
 * ただしpresentation: 'fullScreenModal'や'transparentModal'のように
 * 画面全体を覆うモーダル提示の画面は例外で、SafeAreaViewが参照するインセットが0になる。
 * これらは画面全体を覆うためウィンドウのインセットが正しい値になるので、
 * fullScreenModalプロパティを指定してuseSafeAreaInsets()側へ切り替える。
 *
 * @see Header - ヘッダー本体（内部余白のみを持ち、インセットは扱わない）
 */

import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { Header, type HeaderProps } from '@components/common/Header';
import { commonStyles } from '@lib/styles/commonStyles';
import { useTheme } from '@lib/themeSystem';

/*
 * ========================================
 * 定数
 * ========================================
 */

/** セーフエリアを適用する既定の辺（下辺は各画面のフッター実装に委ねる） */
const DEFAULT_EDGES: readonly Edge[] = ['top', 'left', 'right'];

/*
 * ========================================
 * Props定義
 * ========================================
 */

/**
 * ScreenContainerのProps
 *
 * 共通ヘッダーを使う画面はHeaderPropsをそのまま渡す（titleは必須の運用）。
 * ホームや検索のように独自ヘッダーを描画する画面はcustomHeaderを渡す。
 * この場合は共通Headerを描画しないためtitleを省略でき、HeaderPropsは使われない。
 *
 * @property customHeader - 共通Headerの代わりに描画する独自ヘッダー
 * @property edges - セーフエリアを適用する辺（デフォルト: 上・左・右）
 * @property fullScreenModal - presentation: 'fullScreenModal' / 'transparentModal' など画面全体を覆うモーダル提示の画面に指定する（デフォルト: false）
 * @property keyboardAvoiding - キーボード回避を有効にするか（デフォルト: false）
 * @property keyboardVerticalOffset - キーボード回避時の上部オフセット（デフォルト: 0）
 * @property children - ヘッダー配下に表示する画面本体
 */
interface ScreenContainerProps extends Omit<HeaderProps, 'title'> {
  title?: string;
  customHeader?: React.ReactNode;
  edges?: readonly Edge[];
  fullScreenModal?: boolean;
  keyboardAvoiding?: boolean;
  keyboardVerticalOffset?: number;
  children: React.ReactNode;
}

export function ScreenContainer({
  title,
  customHeader,
  edges = DEFAULT_EDGES,
  fullScreenModal = false,
  keyboardAvoiding = false,
  keyboardVerticalOffset = 0,
  children,
  ...headerProps
}: ScreenContainerProps) {
  /*
   * ========================================
   * Hooks & コンテキスト
   * ========================================
   */
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  /*
   * ========================================
   * レンダリング
   * ========================================
   */

  /* 独自ヘッダーの指定があればそれを描画し、無い画面は共通Headerを描画する */
  const header = customHeader ?? <Header title={title ?? ''} {...headerProps} />;

  /* ヘッダーと画面本体（キーボード回避が必要な画面はヘッダーごと包む） */
  const content = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {header}
      {children}
    </KeyboardAvoidingView>
  ) : (
    <>
      {header}
      {children}
    </>
  );

  /* 画面全体を覆うモーダル提示はSafeAreaViewのインセットが0になるためウィンドウのインセットを直接適用する */
  if (fullScreenModal) {
    return (
      <View
        style={[
          commonStyles.container,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        {content}
      </View>
    );
  }

  /* セーフエリアを確保した画面ルート */
  return (
    <SafeAreaView
      style={[commonStyles.container, { backgroundColor: colors.background }]}
      edges={edges}
    >
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
});
