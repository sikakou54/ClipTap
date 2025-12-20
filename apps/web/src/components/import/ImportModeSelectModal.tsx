import { Dialog } from '@headlessui/react';
import { useTranslation } from '@cliptap/shared';

/**
 * インポートモード選択モーダルのProps型定義
 */
interface ImportModeSelectModalProps {
  /** モーダルの表示/非表示状態 */
  isOpen: boolean;
  /** モーダルを閉じる時のコールバック */
  onClose: () => void;
  /** インポートモードが選択された時のコールバック（restore: 復元、merge: マージ） */
  onSelectMode: (mode: 'restore' | 'merge') => void;
}

/**
 * インポートモード選択モーダルコンポーネント
 *
 * バックアップからの復元（全削除して復元）か、
 * 選択的な追加（既存データと統合）かを選択させる
 */
export function ImportModeSelectModal({ isOpen, onClose, onSelectMode }: ImportModeSelectModalProps) {
  const { t } = useTranslation();

  /* インポートモード選択モーダル（復元/マージ選択） */
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* オーバーレイ（背景暗転） */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* モーダルコンテナ */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-xl p-6">
          {/* モーダルタイトル */}
          <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white mb-6 text-center">
            {t('backup.select_import_method')}
          </Dialog.Title>

          {/* インポートモード選択ボタン */}
          <div className="space-y-4">
            {/* 復元モード: 既存データを全削除して復元 */}
            <button
              onClick={() => onSelectMode('restore')}
              className="w-full p-4 border-2 border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-start text-left gap-4 group"
            >
              {/* 復元アイコン */}
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                {/* 復元モードタイトル */}
                <h3 className="font-bold text-red-700 dark:text-red-400 mb-1">
                  {t('backup.restore_from_backup')}
                </h3>
                {/* 復元モード説明 */}
                <p className="text-xs text-red-600 dark:text-red-300 leading-relaxed">
                  {t('backup.restore_description')}
                </p>
              </div>
            </button>

            {/* マージモード: 既存データを保持して選択的に追加 */}
            <button
              onClick={() => onSelectMode('merge')}
              className="w-full p-4 border-2 border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors flex items-start text-left gap-4 group"
            >
              {/* マージアイコン */}
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                {/* マージモードタイトル */}
                <h3 className="font-bold text-blue-700 dark:text-blue-400 mb-1">
                  {t('backup.select_and_add')}
                </h3>
                {/* マージモード説明 */}
                <p className="text-xs text-blue-600 dark:text-blue-300 leading-relaxed">
                  {t('backup.select_and_add_description')}
                </p>
              </div>
            </button>
          </div>

          {/* キャンセルボタン */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

