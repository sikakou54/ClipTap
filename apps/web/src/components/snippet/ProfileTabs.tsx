/**
 * プロファイルタブコンポーネント
 *
 * @description
 * プロファイルを切り替えるタブ
 */
import type { Profile } from '@cliptap/shared';

interface ProfileTabsProps {
  profiles: Profile[];
  selectedProfileId: string | null;
  onSelectProfile: (profileId: string) => void;
}

export function ProfileTabs({ profiles, selectedProfileId, onSelectProfile }: ProfileTabsProps) {
  if (profiles.length === 0) return null;

  /* プロファイルタブ（環境切り替え、選択状態に応じてスタイル変更） */
  return (
    <div className="flex flex-wrap gap-2">
      {profiles.map((profile) => {
        const isSelected = profile.id === selectedProfileId;
        return (
          <button
            key={profile.id}
            type="button"
            onClick={() => onSelectProfile(profile.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              isSelected
                ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500 text-white'
                : 'bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[#333333] text-gray-600 dark:text-[#A0A0A0] hover:bg-gray-50 dark:hover:bg-[#2A2A2A]'
            }`}
          >
            {profile.name}
          </button>
        );
      })}
    </div>
  );
}

