/**
 * プロファイルリストコンポーネント
 *
 * @description
 * プロファイル一覧を表示するコンポーネント
 * プロファイルが空の場合はEmptyProfileListを表示
 */
import type { Profile } from '@cliptap/shared';
import { ProfileItem } from './ProfileItem';
import { EmptyProfileList } from './EmptyProfileList';

/**
 * ProfileListコンポーネントのProps
 */
interface ProfileListProps {
  /** 表示するプロファイルの配列 */
  profiles: Profile[];
  /** 編集ボタンクリック時のコールバック（プロファイルデータを渡す） */
  onEdit: (profile: Profile) => void;
  /** 削除ボタンクリック時のコールバック（プロファイルIDを渡す） */
  onDelete: (id: string) => void;
  /** 標準にするボタンクリック時のコールバック（プロファイルIDを渡す） */
  onSetDefault: (id: string) => void;
  /** 新規作成ボタンクリック時のコールバック（空状態時に使用、省略可） */
  onCreate?: () => void;
}

export function ProfileList({ profiles, onEdit, onDelete, onSetDefault, onCreate }: ProfileListProps) {
  {/* プロファイルが0件の場合は空状態を表示 */}
  if (profiles.length === 0) {
    return <EmptyProfileList onCreate={onCreate || (() => {})} />;
  }

  /* プロファイル一覧コンテナ（各プロファイルアイテムを表示） */
  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-gray-200 dark:border-[#2A2A2A] overflow-hidden">
      {profiles.map((profile, index) => (
        <ProfileItem
          key={profile.id}
          profile={profile}
          isLast={index === profiles.length - 1}
          onEdit={onEdit}
          onDelete={onDelete}
          onSetDefault={onSetDefault}
        />
      ))}
    </div>
  );
}

