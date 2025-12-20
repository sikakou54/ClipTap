/**
 * 変数管理画面
 *
 * スニペット内で使用する変数を管理するページ。
 * システム変数の一覧表示と、カスタム変数の作成・編集・削除が可能。
 *
 * 変数の種類:
 * - システム変数: today, time, weekdayなど（編集不可）
 * - カスタム変数: ユーザー定義の変数（環境ごとに異なる値を設定可能）
 *
 * 制限:
 * - Freeプラン: 最大5カスタム変数
 * - Proプラン: 無制限
 *
 * @see hooks/screens/useVariablesScreen.ts - ビジネスロジック
 */
import { useTranslation } from '@cliptap/shared';
import { FREE_VARIABLES_LIMIT } from '@cliptap/shared';
import { PageLayout } from '@components/layout/PageLayout';
import {
  VariableEditModal,
  ProfileFilter,
  CustomVariableSection,
  SystemVariableSection,
} from '@components/variable';
import { useVariablesScreen } from '@hooks/screens';

export function VariableManage() {
  const { t } = useTranslation();

  const {
    profiles,
    customVariables,
    systemVariables,
    isSubscribed,
    canAddVariable,

    error,
    selectedProfileId,
    isEditModalOpen,
    editingVariableId,

    setSelectedProfileId,

    getVariableValue,
    handleAdd,
    handleEdit,
    handleDelete,
    handleCloseModal,
  } = useVariablesScreen();

  return (
    <PageLayout
      title={t('settings.variables')}
      icon="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
      rightAction={
        /* 新規変数作成ボタン（制限に達している場合は無効化）
            Freeプランで最大変数数に達している場合、ボタンは無効化されクリック不可。 */
        <button
          onClick={handleAdd}
          className={`p-2 rounded-lg transition-colors ${
            canAddVariable
              ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
              : 'text-gray-400 dark:text-[#707070] cursor-not-allowed'
          }`}
          disabled={!canAddVariable}
          aria-label={t('settings.add_variable')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      }
    >
      {/* 制限メッセージ（Freeプラン、最大変数数制限の通知）
          Freeプランで最大変数数（FREE_VARIABLES_LIMIT）に達している場合に表示。
          黄色の警告スタイルで、ユーザーに制限を通知。 */}
      {!isSubscribed && (
        <div className="mb-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              {t('settings.variable_limit_message', { limit: FREE_VARIABLES_LIMIT })}
            </p>
          </div>
        </div>
      )}

      {/* エラーメッセージ（バリデーションエラー等）
          バリデーションエラーや保存エラーが発生した場合に表示。
          変数名の重複、無効な変数名などのエラーを表示。 */}
      {error && (
        <div className="mb-4">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* メインコンテンツ（変数一覧とフィルター） */}
      <div className="space-y-6">
        {/* プロファイルフィルター（カスタム変数の環境別値表示切り替え）
            プロファイルとカスタム変数が存在する場合のみ表示。
            選択したプロファイルに応じて、カスタム変数の値を切り替えて表示。 */}
        {profiles.length > 0 && customVariables.length > 0 && (
          <ProfileFilter
            profiles={profiles}
            selectedProfileId={selectedProfileId}
            onSelectProfile={setSelectedProfileId}
          />
        )}

        {/* カスタム変数セクション（ユーザー定義変数の一覧・編集・削除）
            カスタム変数の一覧を表示し、各変数の編集・削除が可能。
            環境ごとに異なる値を設定できる。
            空の場合は空状態メッセージを表示。 */}
        <CustomVariableSection
          variables={customVariables}
          getVariableValue={getVariableValue}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
        />

        {/* システム変数セクション（today, time, weekday等の読み取り専用変数）
            システム変数は編集不可で、説明と使用例のみを表示。
            スニペット内で使用可能な組み込み変数の一覧。 */}
        <SystemVariableSection systemVariables={systemVariables} />
      </div>

      {/* 変数編集モーダル（カスタム変数の作成・編集）
          variableIdがnullなら新規作成モード、値があれば編集モード。
          変数名と各環境ごとの値を入力・保存できる。 */}
      <VariableEditModal
        isOpen={isEditModalOpen}
        variableId={editingVariableId}
        onClose={handleCloseModal}
      />
    </PageLayout>
  );
}
