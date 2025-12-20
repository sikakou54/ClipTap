/**
 * @module AlertProvider
 * @description
 * カスタムアラートダイアログのContext Provider
 *
 * React NativeのAlertの代わりに使用するカスタムモーダルを提供。
 * テーマに対応し、確認/キャンセルボタンのカスタマイズが可能。
 *
 * @see useAlert - アラートフック
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@lib/themeSystem';
import { CommonButton } from '@components/common/CommonButton';

/* ========================================
   型定義
   ======================================== */

/**
 * アラート表示オプション
 */
interface AlertOptions {
  /** ダイアログのタイトル */
  title: string;
  /** ダイアログのメッセージ本文 */
  message: string;
  /** 確認ボタン押下時のコールバック */
  onConfirm?: () => void;
  /** キャンセルボタン押下時のコールバック（設定するとキャンセルボタンが表示される） */
  onCancel?: () => void;
  /** 確認ボタンのテキスト（デフォルト: 'OK'） */
  confirmText?: string;
  /** キャンセルボタンのテキスト（デフォルト: 'キャンセル'） */
  cancelText?: string;
  /** アラートの種類（ボタンの色に影響） */
  type?: 'default' | 'warning' | 'danger';
}

/**
 * AlertContextの型定義
 */
interface AlertContextType {
  /** アラートを表示する関数 */
  showAlert: (options: AlertOptions) => void;
  /** アラートを非表示にする関数 */
  hideAlert: () => void;
}

/* ========================================
   Context
   ======================================== */

/** アラート用Context（初期値null） */
const AlertContext = createContext<AlertContextType | null>(null);

/* ========================================
   フック
   ======================================== */

/**
 * アラートフック
 *
 * AlertProviderの子コンポーネントからアラート機能にアクセス。
 *
 * @returns showAlert, hideAlert関数を含むオブジェクト
 * @throws AlertProvider外で使用した場合にエラー
 */
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};

/* ========================================
   Provider コンポーネント
   ======================================== */

/**
 * カスタムアラートダイアログのProviderコンポーネント
 *
 * アプリのルートに配置し、子コンポーネント全体でアラート機能を利用可能にする。
 * Modalコンポーネントを使用して画面中央にダイアログを表示。
 */
export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /* モーダルの表示状態 */
  const [visible, setVisible] = useState(false);
  /* 現在のアラートオプション */
  const [options, setOptions] = useState<AlertOptions | null>(null);
  const { colors, spacing, typography } = useTheme();

  /**
   * アラートを表示
   * オプションを設定し、モーダルを表示状態にする
   */
  const showAlert = useCallback((opts: AlertOptions) => {
    setOptions(opts);
    setVisible(true);
  }, []);

  /**
   * アラートを非表示
   * モーダルを閉じてから300ms後にオプションをクリア
   * （フェードアウトアニメーション完了を待つ）
   */
  const hideAlert = useCallback(() => {
    setVisible(false);
    setTimeout(() => setOptions(null), 300);
  }, []);

  /**
   * 確認ボタン押下時の処理
   * コールバックを実行してからアラートを閉じる
   */
  const handleConfirm = () => {
    options?.onConfirm?.();
    hideAlert();
  };

  /**
   * キャンセルボタン押下時の処理
   * コールバックを実行してからアラートを閉じる
   */
  const handleCancel = () => {
    options?.onCancel?.();
    hideAlert();
  };

  /**
   * アラートタイプに応じた確認ボタンの種類を取得
   * - default: primary（青）
   * - warning: warning（黄）
   * - danger: danger（赤）
   */
  const getButtonType = () => {
    /* switch: アラートタイプに応じたボタンスタイルを決定 */
    switch (options?.type) {
      case 'warning':
        /* 警告: 黄色系のボタン */
        return 'warning' as const;
      case 'danger':
        /* 危険: 赤色系のボタン */
        return 'danger' as const;
      default:
        /* デフォルト: 青色系のボタン */
        return 'primary' as const;
    }
  };

  /* アラートプロバイダー（Context + モーダル） */
  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {/* アラートモーダル（フェードインアニメーション付き） */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={hideAlert}
      >
        {/* オーバーレイ（背景暗転） */}
        <View style={styles.overlay}>
          {/* アラートボックス */}
          <View style={[
            styles.alertBox,
            { backgroundColor: colors.surface, borderColor: colors.border }
          ]}>
            {/* タイトル */}
            <Text style={[
              typography.h3,
              { color: colors.text, marginBottom: spacing.sm }
            ]}>
              {options?.title}
            </Text>
            {/* メッセージ */}
            <Text style={[
              typography.body,
              { color: colors.textSecondary, marginBottom: spacing.xl }
            ]}>
              {options?.message}
            </Text>
            {/* ボタン行（キャンセル/確認） */}
            <View style={[styles.buttonRow, { gap: spacing.sm }]}>
              {/* キャンセルボタン（オプション） */}
              {options?.onCancel && (
                <CommonButton
                  title={options.cancelText || 'キャンセル'}
                  onPress={handleCancel}
                  type="secondary"
                  fullWidth
                />
              )}
              {/* 確認ボタン */}
              <CommonButton
                title={options?.confirmText || 'OK'}
                onPress={handleConfirm}
                type={getButtonType()}
                fullWidth
              />
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

/* ========================================
   スタイル
   ======================================== */

/**
 * アラートダイアログのスタイル定義
 */
const styles = StyleSheet.create({
  /** オーバーレイ（半透明の背景） */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', /* 50%の黒背景 */
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  /** アラートボックス本体 */
  alertBox: {
    width: '100%',
    maxWidth: 400, /* 最大幅を制限 */
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  /** ボタンを横並びに配置 */
  buttonRow: {
    flexDirection: 'row',
  },
});
