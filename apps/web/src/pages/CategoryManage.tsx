/**
 * カテゴリ管理画面
 *
 * スニペットのカテゴリを管理するページ。
 * カテゴリの作成、編集、削除が可能。
 *
 * 機能:
 * - カテゴリ一覧表示
 * - 新規カテゴリ作成
 * - カテゴリ名・色の編集
 * - カテゴリ削除
 *
 * カラー選択:
 * - プリセットカラー（12色）
 * - カスタムRGB入力
 *
 * @see hooks/screens/useCategoriesScreen.ts - ビジネスロジック
 */
import { useTranslation } from '@cliptap/shared';
import { PageLayout } from '@components/layout/PageLayout';
import { useCategoriesScreen } from '@hooks/screens';
import { CategoryList, CategoryModal } from '@components/category';

export function CategoryManage() {
  const { t } = useTranslation();

  const {
    categories,
    presetColors,

    showModal,
    editingId,
    isSubmitting,
    error,

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

    setName,
    setCustomR,
    setCustomG,
    setCustomB,

    openCreateModal,
    openEditModal,
    handleCloseModal,
    handleSubmit,
    handleDelete,
    handlePresetColorSelect,
    handleSwitchToPreset,
    handleSwitchToCustom,
  } = useCategoriesScreen();

  return (
    <PageLayout
      title={t('category.title')}
      icon="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
      rightAction={
        /* 新規カテゴリ作成ボタン（ヘッダー右側に配置、クリックで作成モーダルを開く） */
        <button
          onClick={openCreateModal}
          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          aria-label={t('category.create')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      }
    >
      {/* カテゴリリスト（一覧表示、編集・削除・作成操作を提供）
          各カテゴリの名前・色を表示し、編集・削除ボタンで操作可能。
          空の場合は空状態メッセージを表示。 */}
      <CategoryList categories={categories} onEdit={openEditModal} onDelete={handleDelete} onCreate={openCreateModal} />

      {/* 作成・編集モーダル（カテゴリ名・色の入力・保存）
          editingIdがnullなら新規作成モード、値があれば編集モード。
          カテゴリ名（最大文字数制限あり）とカラー選択（プリセット/カスタムRGB）を提供。 */}
      <CategoryModal
        isOpen={showModal}
        editingId={editingId}
        name={name}
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
        error={error}
        isSubmitting={isSubmitting}
        onClose={handleCloseModal}
        onNameChange={setName}
        onPresetColorSelect={handlePresetColorSelect}
        onSwitchToPreset={handleSwitchToPreset}
        onSwitchToCustom={handleSwitchToCustom}
        onCustomRChange={setCustomR}
        onCustomGChange={setCustomG}
        onCustomBChange={setCustomB}
        onSubmit={handleSubmit}
      />
    </PageLayout>
  );
}
