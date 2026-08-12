/**
 * プロファイルアイテムコンポーネント
 *
 * @description
 * 個別のプロファイルを表示するコンポーネント
 */
import { useTranslation } from '@cliptap/shared';
import type { Profile } from '@cliptap/shared';

interface ProfileItemProps {
  profile: Profile;
  isLast: boolean;
  onEdit: (profile: Profile) => void;
  onDelete: (id: string) => void;
  /** 標準に設定するコールバック（プロファイルIDを渡す） */
  onSetDefault: (id: string) => void;
}

export function ProfileItem({ profile, isLast, onEdit, onDelete, onSetDefault }: ProfileItemProps) {
  const { t } = useTranslation();
  const isEnabled = profile.valid;

  /* プロファイルアイテム（アイコン、名前、バッジ、編集・削除ボタン） */
  return (
    <div
      className={`p-4 ${!isLast ? 'border-b border-gray-200 dark:border-[#2A2A2A]' : ''} ${
        !isEnabled ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        {/* プロファイルアイコン */}
        <div className={`p-2 rounded-lg ${isEnabled ? 'bg-gray-100 dark:bg-[#2A2A2A]' : 'bg-gray-100 dark:bg-[#2A2A2A]'}`}>
          <svg
            className={`w-5 h-5 ${isEnabled ? 'text-gray-600 dark:text-[#A0A0A0]' : 'text-gray-400 dark:text-[#707070]'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        {/* プロファイル名・バッジ */}
        <div className="flex-1 flex items-center gap-2">
          {/* プロファイル名 */}
          <span className="font-medium text-gray-900 dark:text-white">{profile.name}</span>
          {/* デフォルトバッジ（デフォルトプロファイルの場合のみ表示） */}
          {profile.isDefault && (
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 text-xs rounded-full">
              {t('profile.default_badge')}
            </span>
          )}
          {/* 無効化バッジ（無効化されている場合のみ表示） */}
          {!profile.valid && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
              {t('settings.variable_disabled')}
            </span>
          )}
        </div>
        {/* 標準にするバッジ（標準以外かつ有効なプロファイルのみ表示）
            背景なしの枠線で、状態表示のデフォルトバッジと区別する */}
        {!profile.isDefault && isEnabled && (
          <button
            onClick={() => onSetDefault(profile.id)}
            aria-label={t('profile.set_default_action')}
            title={t('profile.set_default_action')}
            className="shrink-0 px-2 py-0.5 text-gray-500 dark:text-[#A0A0A0] border border-gray-200 dark:border-gray-700 text-xs rounded-full hover:bg-gray-100 dark:hover:bg-[#2A2A2A] hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            {t('profile.set_default_action')}
          </button>
        )}
        {/* 編集ボタン */}
        <button
          onClick={() => onEdit(profile)}
          disabled={!isEnabled}
          className={`p-2 rounded-lg transition-colors ${
            isEnabled
              ? 'text-gray-500 dark:text-[#A0A0A0] hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2A2A2A]'
              : 'text-gray-300 dark:text-[#707070] cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
        {/* 削除ボタン（デフォルトプロファイル以外のみ表示） */}
        {!profile.isDefault && (
          <button
            onClick={() => onDelete(profile.id)}
            className="p-2 text-gray-500 dark:text-[#A0A0A0] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

