/**
 * CategoryColorSelector - カテゴリカラー選択
 *
 * @description
 * カテゴリの色を選択するUI。プリセットカラーとカスタムRGB入力の2モード切替。
 * カスタムRGBはリアルタイムバリデーション・プレビュー付き（0-255の範囲チェック）。
 */
import { useTranslation } from '@cliptap/shared';

interface CategoryColorSelectorProps {
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
  onPresetColorSelect: (color: string) => void;
  onSwitchToPreset: () => void;
  onSwitchToCustom: () => void;
  onCustomRChange: (value: string) => void;
  onCustomGChange: (value: string) => void;
  onCustomBChange: (value: string) => void;
}

export function CategoryColorSelector({
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
  onPresetColorSelect,
  onSwitchToPreset,
  onSwitchToCustom,
  onCustomRChange,
  onCustomGChange,
  onCustomBChange,
}: CategoryColorSelectorProps) {
  const { t } = useTranslation();

  /* カテゴリカラー選択コンテナ */
  return (
    <div>
      {/* ラベル */}
      <label className="block text-sm font-medium text-gray-700 dark:text-[#A0A0A0] mb-2">{t('category.color')}</label>

      {/* カラーモード切り替えタブ（プリセット/カスタムRGB） */}
      <div className="flex gap-2 mb-4 bg-gray-100 dark:bg-[#2A2A2A] rounded-lg p-1">
        {/* プリセットカラータブ */}
        <button
          onClick={onSwitchToPreset}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            !useCustomColor
              ? 'bg-blue-600 dark:bg-blue-500 text-white'
              : 'text-gray-700 dark:text-[#A0A0A0] hover:bg-gray-200 dark:hover:bg-[#333333]'
          }`}
        >
          {t('category.preset_colors')}
        </button>
        {/* カスタムRGBタブ */}
        <button
          onClick={onSwitchToCustom}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            useCustomColor
              ? 'bg-blue-600 dark:bg-blue-500 text-white'
              : 'text-gray-700 dark:text-[#A0A0A0] hover:bg-gray-200 dark:hover:bg-[#333333]'
          }`}
        >
          {t('category.custom_rgb')}
        </button>
      </div>

      {/* プリセットカラー選択 */}
      {!useCustomColor ? (
        <div className="flex flex-wrap gap-2">
          {presetColors.map((c) => (
            /* プリセットカラーボタン */
            <button
              key={c}
              onClick={() => onPresetColorSelect(c)}
              className={`w-8 h-8 rounded-full transition-transform ${
                color.toUpperCase() === c.toUpperCase() && !useCustomColor
                  ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400 scale-110'
                  : ''
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      ) : (
        /* カスタムRGB入力セクション */
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            {/* RGB入力（0-255、数値以外は自動除外） */}
            <div className="w-1/2 space-y-3">
              {/* R値入力 */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-[#A0A0A0] w-6">R</label>
                <input
                  type="text"
                  value={customR}
                  onChange={(e) => {
                    const filtered = e.target.value.replace(/[^0-9]/g, '');
                    onCustomRChange(filtered);
                  }}
                  placeholder="0-255"
                  maxLength={3}
                  className={`flex-1 px-3 py-2 border rounded-lg text-center focus:outline-none bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#707070] ${
                    !isRValid
                      ? 'border-red-500 dark:border-red-400 border-2'
                      : 'border-gray-300 dark:border-[#2A2A2A]'
                  }`}
                />
              </div>
              {/* G値入力 */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-[#A0A0A0] w-6">G</label>
                <input
                  type="text"
                  value={customG}
                  onChange={(e) => {
                    const filtered = e.target.value.replace(/[^0-9]/g, '');
                    onCustomGChange(filtered);
                  }}
                  placeholder="0-255"
                  maxLength={3}
                  className={`flex-1 px-3 py-2 border rounded-lg text-center focus:outline-none bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#707070] ${
                    !isGValid
                      ? 'border-red-500 dark:border-red-400 border-2'
                      : 'border-gray-300 dark:border-[#2A2A2A]'
                  }`}
                />
              </div>
              {/* B値入力 */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-[#A0A0A0] w-6">B</label>
                <input
                  type="text"
                  value={customB}
                  onChange={(e) => {
                    const filtered = e.target.value.replace(/[^0-9]/g, '');
                    onCustomBChange(filtered);
                  }}
                  placeholder="0-255"
                  maxLength={3}
                  className={`flex-1 px-3 py-2 border rounded-lg text-center focus:outline-none bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#707070] ${
                    !isBValid
                      ? 'border-red-500 dark:border-red-400 border-2'
                      : 'border-gray-300 dark:border-[#2A2A2A]'
                  }`}
                />
              </div>
            </div>

            {/* リアルタイムカラープレビュー */}
            <div className="w-1/2 flex flex-col items-center justify-center gap-2">
              {/* カラープレビューサークル */}
              <div
                className="w-20 h-20 rounded-full border-2 border-gray-300 dark:border-[#2A2A2A] shadow-lg"
                style={{ backgroundColor: currentColor || '#000000' }}
              />
              {/* 16進数カラー値表示 */}
              <div className="text-xs font-mono font-medium text-gray-600 dark:text-[#A0A0A0]">
                {currentColor || '#000000'}
              </div>
            </div>
          </div>

          {/* バリデーションエラーメッセージ */}
          {!isCustomColorValid && (
            <p className="text-sm text-red-600 dark:text-red-400">{t('category.invalid_rgb_values')}</p>
          )}
        </div>
      )}
    </div>
  );
}

