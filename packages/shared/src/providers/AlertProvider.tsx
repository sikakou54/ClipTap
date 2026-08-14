/**
 * AlertProvider - 共通アラートダイアログのContext Provider
 *
 * 現状、platformAdapter を渡している箇所は無く、常にデフォルトアダプター
 * （ブラウザの alert/confirm）が使われる。Webはこのファイルをそのまま利用し（アダプター注入なし）、
 * Mobileは apps/mobile 側が独自のモーダル実装とフックを持っているため、
 * platformAdapter は現在未使用の拡張点である。
 *
 * @module AlertProvider
 */

import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/**
 * アラートのタイプ
 */
export type AlertType = 'default' | 'warning' | 'danger';

/**
 * アラート表示オプション
 */
export interface AlertOptions {
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
  type?: AlertType;
}

/**
 * AlertContextの型定義
 */
export interface AlertContextType {
  /** アラートを表示する関数 */
  showAlert: (options: AlertOptions) => void;
  /** アラートを非表示にする関数 */
  hideAlert: () => void;
}

/**
 * プラットフォーム固有のアラート表示アダプター
 *
 * 現状これを注入している呼び出し元は無い（Mobileは apps/mobile 側の独自Providerを使う）。
 * 未指定時はデフォルトアダプターのブラウザ alert/confirm が使われる。
 */
export interface AlertPlatformAdapter {
  /** アラートを表示 */
  showAlert: (options: AlertOptions) => void;
  /** アラートを非表示（モーダルタイプの場合のみ使用） */
  hideAlert?: () => void;
}

/**
 * AlertProviderのProps
 */
export interface AlertProviderProps {
  children: ReactNode;
  /** プラットフォーム固有のアダプター（未指定時はデフォルト実装を使用） */
  platformAdapter?: AlertPlatformAdapter;
}

/* ======================================== */
/* Context */
/* ======================================== */

const AlertContext = createContext<AlertContextType | null>(null);

/* ======================================== */
/* デフォルトアダプター（ブラウザ用） */
/* ======================================== */

/**
 * デフォルトのアラートアダプター（ブラウザのalert/confirm使用）
 */
const defaultAdapter: AlertPlatformAdapter = {
  showAlert: (options: AlertOptions) => {
    if (typeof window === 'undefined') return;

    const message = options.title ? `${options.title}\n\n${options.message}` : options.message;

    if (options.onCancel) {
      /* 確認ダイアログ */
      const result = window.confirm(message);
      if (result) {
        options.onConfirm?.();
      } else {
        options.onCancel?.();
      }
    } else {
      /* 単純なアラート */
      window.alert(message);
      options.onConfirm?.();
    }
  },
  hideAlert: () => {
    /* ブラウザのalert/confirmは自動で閉じるため何もしない */
  },
};

/* ======================================== */
/* Provider コンポーネント */
/* ======================================== */

/**
 * 共通アラートプロバイダー
 *
 * プラットフォーム固有のアダプターを注入して使用します。
 * アダプター未指定時はブラウザのalert/confirmを使用します。
 */
export function AlertProvider({ children, platformAdapter }: AlertProviderProps) {
  const adapter = platformAdapter ?? defaultAdapter;

  const showAlert = useCallback(
    (options: AlertOptions) => {
      adapter.showAlert(options);
    },
    [adapter]
  );

  const hideAlert = useCallback(() => {
    adapter.hideAlert?.();
  }, [adapter]);

  const value = useMemo<AlertContextType>(
    () => ({ showAlert, hideAlert }),
    [showAlert, hideAlert]
  );

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}

/* ======================================== */
/* フック */
/* ======================================== */

/**
 * アラートフック
 *
 * AlertProviderの子コンポーネントからアラート機能にアクセス。
 *
 * @returns showAlert, hideAlert関数を含むオブジェクト
 * @throws AlertProvider外で使用した場合にエラー
 */
export function useAlert(): AlertContextType {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
}
