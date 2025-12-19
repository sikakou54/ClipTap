/**
 * CategoryModal - カテゴリ作成・編集モーダル
 *
 * @description
 * カテゴリの作成・編集を行うモーダルダイアログ。
 * 名前入力（最大文字数制限あり）とカラー選択（CategoryColorSelector）を含む。
 * editingId が null なら新規作成、値があれば編集モード。
 */
import { useTranslation } from '@cliptap/shared';
import { INPUT_LIMITS } from '@cliptap/shared';
import { CategoryColorSelector } from './CategoryColorSelector';

interface CategoryModalProps {
  isOpen: boolean;
  editingId: string | null;
  name: string;
  color: string;
  useCustomColor: boolean;
  customR: string;
  customG: string;
  customB: string;
  isRValid: boolean;
  isGValid: boolean;
  isBValid: boolean;
  isCustomColorValid: boolean;
  currentColor: string;
  presetColors: readonly string[];
  error: string;
  isSubmitting: boolean;
  onClose: () => void;
  onNameChange: (name: string) => void;
  onPresetColorSelect: (color: string) => void;
  onSwitchToPreset: () => void;
  onSwitchToCustom: () => void;
  onCustomRChange: (value: string) => void;
  onCustomGChange: (value: string) => void;
  onCustomBChange: (value: string) => void;
  onSubmit: () => void;
}

export function CategoryModal({
  isOpen,
  editingId,
  name,
  color,
  useCustomColor,
  customR,
  customG,
  customB,
  isRValid,
  isGValid,
  isBValid,
  isCustomColorValid,
  currentColor,
  presetColors,
  error,
  isSubmitting,
  onClose,
  onNameChange,
  onPresetColorSelect,
  onSwitchToPreset,
  onSwitchToCustom,
  onCustomRChange,
  onCustomGChange,
  onCustomBChange,
  onSubmit,
}: CategoryModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  /* カテゴリ作成・編集モーダル（オーバーレイ + コンテナ） */
  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      {/* モーダルコンテナ（クリックイベントの伝播を停止） */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        {/* モーダルタイトル（編集/作成モードに応じて切り替え） */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {editingId ? t('category.edit') : t('category.create')}
        </h2>

        {/* エラーメッセージ（エラーがある場合のみ表示） */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* カテゴリ名入力フィールド */}
          <div>
            {/* ラベルと文字数カウンター */}
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-[#A0A0A0]">{t('category.title')}</label>
              <span className="text-xs text-gray-500 dark:text-[#707070]">
                {name.length}/{INPUT_LIMITS.CATEGORY_NAME_MAX}
              </span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={t('category.name_placeholder')}
              maxLength={INPUT_LIMITS.CATEGORY_NAME_MAX}
              className="w-full px-4 py-3 border border-gray-300 dark:border-[#2A2A2A] rounded-xl focus:outline-none bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#707070]"
            />
          </div>

          {/* カラー選択コンポーネント（プリセット/カスタムRGB） */}
          <CategoryColorSelector
            color={color}
            useCustomColor={useCustomColor}
            customR={customR}
            customG={customG}
            customB={customB}
            isRValid={isRValid}
            isGValid={isGValid}
            isBValid={isBValid}
            isCustomColorValid={isCustomColorValid}
            currentColor={currentColor}
            presetColors={presetColors}
            onPresetColorSelect={onPresetColorSelect}
            onSwitchToPreset={onSwitchToPreset}
            onSwitchToCustom={onSwitchToCustom}
            onCustomRChange={onCustomRChange}
            onCustomGChange={onCustomGChange}
            onCustomBChange={onCustomBChange}
          />
        </div>

        {/* モーダルフッター（キャンセル・保存ボタン） */}
        <div className="mt-6 flex gap-3">
          {/* キャンセルボタン */}
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 dark:border-[#2A2A2A] text-gray-700 dark:text-[#A0A0A0] rounded-xl hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors"
          >
            {t('common.cancel')}
          </button>
          {/* 保存ボタン（バリデーション通過時のみ有効） */}
          <button
            onClick={onSubmit}
            disabled={isSubmitting || !name.trim() || !isCustomColorValid}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
              isSubmitting || !name.trim() || !isCustomColorValid
                ? 'bg-gray-300 dark:bg-[#2A2A2A] text-gray-500 dark:text-[#707070] cursor-not-allowed'
                : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
            }`}
          >
            {/* 処理中は「処理中」、それ以外は「保存」 */}
            {isSubmitting ? t('common.processing') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

