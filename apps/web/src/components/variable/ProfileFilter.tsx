/**
 * プロファイルフィルターコンポーネント
 *
 * @description
 * 変数値を表示する対象プロファイル（環境）を切り替えるフィルター。
 * プロファイルごとに異なる値を持つカスタム変数の値を確認できる。
 */
import type { Profile } from '@cliptap/shared';

interface ProfileFilterProps {
  profiles: Profile[];
  selectedProfileId: string | null;
  onSelectProfile: (profileId: string) => void;
}

export function ProfileFilter({ profiles, selectedProfileId, onSelectProfile }: ProfileFilterProps) {
  if (profiles.length === 0) return null;

  /* プロファイルフィルター（環境切り替え、選択状態に応じてスタイル変更） */
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {profiles.map((profile) => {
        const isSelected = selectedProfileId === profile.id;
        /* プロファイルフィルターボタン */
        return (
          <button
            key={profile.id}
            onClick={() => onSelectProfile(profile.id)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              isSelected
                ? 'bg-blue-600 dark:bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-[#2A2A2A] text-gray-700 dark:text-[#A0A0A0] hover:bg-gray-200 dark:hover:bg-[#333333]'
            }`}
          >
            {profile.name}
          </button>
        );
      })}
    </div>
  );
}

