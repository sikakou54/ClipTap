/**
 * プロファイル作成・編集モーダルコンポーネント
 *
 * @description
 * プロファイルの作成・編集を行うモーダル
 */
import { useTranslation } from '@cliptap/shared';
import { INPUT_LIMITS } from '@cliptap/shared';
import { useEscapeClose } from '@hooks/useEscapeClose';

interface ProfileModalProps {
  isOpen: boolean;
  editingId: string | null;
  name: string;
  error: string;
  isSubmitting: boolean;
  onClose: () => void;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
}

export function ProfileModal({
  isOpen,
  editingId,
  name,
  error,
  isSubmitting,
  onClose,
  onNameChange,
  onSubmit,
}: ProfileModalProps) {
  const { t } = useTranslation();

  /* onClose は未保存確認付きのハンドラ（useProfilesScreen.handleCloseModal）なので、ESCでも警告が出る */
  useEscapeClose(isOpen, onClose);

  if (!isOpen) return null;

  /* モーダルオーバーレイ（背景クリックで閉じる）
     固定位置で画面全体を覆い、半透明の背景を表示。
     クリックでモーダルを閉じる。z-index: 50で最前面に表示。 */
  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      {/* モーダルコンテナ（クリックイベントの伝播を停止）
          中央配置、最大幅制限あり。背景クリックで閉じないよう、
          stopPropagationでクリックイベントの伝播を停止。 */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        {/* モーダルタイトル（編集/作成モードに応じて切り替え）
            editingIdがnullなら「作成」、値があれば「編集」を表示。 */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {editingId ? t('profile.edit') : t('profile.create')}
        </h2>

        {/* エラーメッセージ（エラーがある場合のみ表示）
            バリデーションエラーやAPIエラーを表示。
            赤色の背景とボーダーで視覚的に強調。 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* プロファイル名入力フィールド
            プロファイル名を入力するテキストフィールド。
            最大文字数制限（INPUT_LIMITS.PROFILE_NAME_MAX）あり。
            リアルタイムで文字数カウンターを表示。 */}
        <div>
          {/* ラベルと文字数カウンター */}
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-[#A0A0A0]">{t('profile.name')}</label>
            <span className="text-xs text-gray-500 dark:text-[#707070]">
              {name.length}/{INPUT_LIMITS.PROFILE_NAME_MAX}
            </span>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={t('profile.name_placeholder')}
            maxLength={INPUT_LIMITS.PROFILE_NAME_MAX}
            className="w-full px-4 py-3 border border-gray-300 dark:border-[#2A2A2A] rounded-xl focus:outline-none bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#707070]"
          />
        </div>

        {/* モーダルフッター（キャンセル・保存ボタン）
            2つのボタンを横並びで配置。キャンセルは常に有効、
            保存はバリデーション通過時のみ有効。 */}
        <div className="mt-6 flex gap-3">
          {/* キャンセルボタン（モーダルを閉じる）
              クリックでonCloseを呼び出し、変更を破棄してモーダルを閉じる。 */}
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 dark:border-[#2A2A2A] text-gray-700 dark:text-[#A0A0A0] rounded-xl hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors"
          >
            {t('common.cancel')}
          </button>
          {/* 保存ボタン（バリデーション通過時のみ有効）
              プロファイル名が空、または送信中（isSubmitting）の場合は無効化。
              無効時はグレーアウト、有効時は青色で表示。
              送信中は「処理中」、通常時は「保存」を表示。 */}
          <button
            onClick={onSubmit}
            disabled={isSubmitting || !name.trim()}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
              isSubmitting || !name.trim()
                ? 'bg-gray-300 dark:bg-[#2A2A2A] text-gray-500 dark:text-[#707070] cursor-not-allowed'
                : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
            }`}
          >
            {isSubmitting ? t('common.processing') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

