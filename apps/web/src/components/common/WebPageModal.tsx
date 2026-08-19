/**
 * Webページ表示モーダルコンポーネント
 *
 * @description
 * 外部WebページをiFrameで表示するフルスクリーンモーダル。
 * 利用規約やプライバシーポリシーなどの表示に使用。
 */
import { useBodyScrollLock } from '@hooks/useBodyScrollLock';
import { useEscapeClose } from '@hooks/useEscapeClose';

interface WebPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export function WebPageModal({ isOpen, onClose, title, url }: WebPageModalProps) {
  useBodyScrollLock(isOpen);
  useEscapeClose(isOpen, onClose);

  if (!isOpen) return null;

  /* Webページ表示モーダル（フルスクリーン、iFrame表示） */
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center p-4 z-50" onClick={onClose}>
      {/* モーダルコンテナ（最大幅制限、クリックイベントの伝播を停止） */}
      <div
        className="bg-white dark:bg-[#1A1A1A] rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー（タイトルと閉じるボタン） */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2A2A2A] flex items-center justify-between shrink-0">
          {/* タイトル */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-[#707070] hover:text-gray-600 dark:hover:text-[#A0A0A0] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* iFrameコンテナ（Webページ表示エリア） */}
        <div className="flex-1 w-full h-full bg-gray-50 dark:bg-[#0b1120]">
           <iframe
             src={url}
             className="w-full h-full border-0"
             title={title}
           />
        </div>
      </div>
    </div>
  );
}

