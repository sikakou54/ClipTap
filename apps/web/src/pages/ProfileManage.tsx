/**
 * 環境（プロファイル）管理画面
 *
 * 変数の値セットを切り替えるための「環境」を管理するページ。
 * 例: 開発環境、本番環境、個人用、仕事用など
 *
 * 機能:
 * - 環境一覧表示
 * - 新規環境作成
 * - 環境名の編集
 * - 環境削除（デフォルト環境は削除不可）
 *
 * 制限:
 * - Freeプラン: 最大3環境
 * - Proプラン: 無制限
 *
 * @see hooks/screens/useProfilesScreen.ts - ビジネスロジック
 */
import { useTranslation } from '@cliptap/shared';
import { FREE_PROFILES_LIMIT } from '@cliptap/shared';
import { PageLayout } from '@components/layout/PageLayout';
import { useProfilesScreen } from '@hooks/screens';
import { ProfileList, ProfileModal } from '@components/profile';

export function ProfileManage() {
  const { t } = useTranslation();

  const {
    profiles,
    isSubscribed,
    canAddProfile,

    showModal,
    editingId,
    isSubmitting,
    error,

    name,

    setName,

    openCreateModal,
    openEditModal,
    handleCloseModal,
    handleSubmit,
    handleDelete,
    handleSetDefault,
  } = useProfilesScreen();

  return (
    <PageLayout
      title={t('profile.title')}
      icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      rightAction={
        /* 新規プロファイル作成ボタン（制限に達している場合は無効化）
            Freeプランで最大環境数に達している場合、ボタンは無効化されクリック不可。 */
        <button
          onClick={openCreateModal}
          className={`p-2 rounded-lg transition-colors ${canAddProfile
              ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
              : 'text-gray-400 dark:text-[#707070] cursor-not-allowed'
            }`}
          disabled={!canAddProfile}
          aria-label={t('profile.create')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      }
    >
      {/* 制限メッセージ（Freeプラン、最大環境数制限の通知）
          Freeプランで最大環境数（FREE_PROFILES_LIMIT）に達している場合に表示。
          黄色の警告スタイルで、ユーザーに制限を通知。 */}
      {!isSubscribed && (
        <div className="mb-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              {t('profile.limit_message', { limit: FREE_PROFILES_LIMIT })}
            </p>
          </div>
        </div>
      )}

      {/* エラーメッセージ（バリデーションエラー等、モーダル表示中は非表示）
          バリデーションエラーや保存エラーが発生した場合に表示。
          モーダルが開いている時は非表示（モーダル内でエラーを表示するため）。 */}
      {error && !showModal && (
        <div className="mb-4">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* プロファイルリスト（環境一覧、編集・削除・作成操作を提供）
          各プロファイルの名前を表示し、編集・削除ボタンで操作可能。
          空の場合は空状態メッセージを表示。
          デフォルトプロファイルは削除不可（削除ボタンが無効化される）。 */}
      <ProfileList profiles={profiles} onEdit={openEditModal} onDelete={handleDelete} onSetDefault={handleSetDefault} onCreate={openCreateModal} />

      {/* 作成・編集モーダル（環境名の入力・保存）
          editingIdがnullなら新規作成モード、値があれば編集モード。
          プロファイル名（最大文字数制限あり）の入力と保存を提供。 */}
      <ProfileModal
        isOpen={showModal}
        editingId={editingId}
        name={name}
        error={error}
        isSubmitting={isSubmitting}
        onClose={handleCloseModal}
        onNameChange={setName}
        onSubmit={handleSubmit}
      />
    </PageLayout>
  );
}
