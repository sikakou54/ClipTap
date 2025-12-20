/**
 * アイコン選択モーダルコンポーネント
 *
 * @description
 * カスタム変数のアイコンを選択するためのモーダル。
 * グリッド形式でアイコン一覧を表示し、選択されたアイコンをハイライト。
 */
import { useTranslation, VARIABLE_ICONS, type VariableIconName } from '@cliptap/shared';
import { VariableIcon } from '@components/common/VariableIcon';
import { useBodyScrollLock } from '@hooks/useBodyScrollLock';

interface IconPickerModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean;
  /** 現在選択中のアイコン */
  selectedIcon: VariableIconName;
  /** アイコン選択時のコールバック */
  onSelect: (icon: VariableIconName) => void;
  /** モーダルを閉じるコールバック */
  onClose: () => void;
}

export function IconPickerModal({ isOpen, selectedIcon, onSelect, onClose }: IconPickerModalProps) {
  const { t } = useTranslation();

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleSelect = (icon: VariableIconName) => {
    onSelect(icon);
    onClose();
  };

  /* アイコン選択モーダル（オーバーレイ + コンテナ） */
  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      {/* モーダルコンテナ */}
      <div
        className="bg-white dark:bg-[#1A1A1A] rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2A2A2A] flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('settings.select_icon')}
          </h2>
          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-[#707070] hover:text-gray-600 dark:hover:text-[#A0A0A0] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* アイコングリッド */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-8 gap-2">
            {VARIABLE_ICONS.map((icon) => {
              const isSelected = icon === selectedIcon;
              return (
                <button
                  key={icon}
                  onClick={() => handleSelect(icon)}
                  className={`p-3 rounded-lg transition-colors flex items-center justify-center ${
                    isSelected
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500'
                      : 'hover:bg-gray-100 dark:hover:bg-[#2A2A2A] text-gray-600 dark:text-[#A0A0A0]'
                  }`}
                  title={icon}
                >
                  <VariableIcon name={icon} size={22} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
