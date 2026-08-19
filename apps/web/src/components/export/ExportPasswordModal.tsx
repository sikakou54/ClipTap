/**
 * エクスポート用パスワード入力モーダル
 *
 * @description
 * エクスポート実行前にパスワードを入力させるモーダル。
 * 表示状態・入力値・処理中フラグは呼び出し元（ExportSelectionModal）が保持し、
 * このコンポーネントは受け取った値の描画と入力イベントの通知だけを行う。
 */

import { Dialog } from '@headlessui/react';
import { useTranslation } from '@cliptap/shared';

/**
 * エクスポート用パスワード入力モーダルのProps型定義
 */
interface ExportPasswordModalProps {
  /** モーダルの表示/非表示状態 */
  isOpen: boolean;
  /** 入力中のパスワード */
  password: string;
  /** パスワード入力欄の変更時のコールバック */
  onPasswordChange: (value: string) => void;
  /** OKボタン押下・Enterキー送信時のコールバック */
  onSubmit: () => void;
  /** キャンセル・背景クリックなどで閉じる時のコールバック */
  onCancel: () => void;
  /** エクスポート処理中かどうか（OKボタンの無効化とラベル切り替えに使う） */
  isProcessing: boolean;
}

export function ExportPasswordModal({
  isOpen,
  password,
  onPasswordChange,
  onSubmit,
  onCancel,
  isProcessing,
}: ExportPasswordModalProps) {
  const { t } = useTranslation();

  /* パスワード入力モーダル。呼び出し元の選択モーダルが z-50 のため、その前面に出すよう z-[60] を指定している */
  return (
    <Dialog open={isOpen} onClose={onCancel} className="relative z-[60]">
      {/* 背景オーバーレイ */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      {/* モーダルコンテナ（中央配置） */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {/* モーダルパネル */}
        <Dialog.Panel className="w-full max-w-md bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-xl p-6">
          {/* タイトル */}
          <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">
            {t('export_import.password_title')}
          </Dialog.Title>
          {/* 説明文 */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
            {t('export_import.password_description')}
          </p>
          {/* パスワード入力欄（Enterキーでも送信可能） */}
          <input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder={t('export_import.password_placeholder')}
            autoFocus
            className="w-full px-4 py-3 border border-gray-300 dark:border-[#2A2A2A] rounded-xl focus:outline-none mb-4 bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#707070]"
            onKeyDown={(e) => {
              /* Enterキーが押されたら送信 */
              if (e.key === 'Enter' && password.trim()) {
                onSubmit();
              }
            }}
          />
          {/* ボタン群（キャンセル・OK） */}
          <div className="flex gap-3">
            {/* キャンセルボタン */}
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#333] border border-gray-300 dark:border-[#444] rounded-lg hover:bg-gray-50 dark:hover:bg-[#444]"
            >
              {t('common.cancel')}
            </button>
            {/* OKボタン（パスワード未入力または処理中は無効化） */}
            <button
              onClick={onSubmit}
              disabled={!password.trim() || isProcessing}
              className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                !password.trim() || isProcessing
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {/* 処理中は「処理中」、それ以外は「OK」 */}
              {isProcessing ? t('common.processing') : t('common.ok')}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
