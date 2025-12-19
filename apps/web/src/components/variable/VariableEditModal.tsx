/**
 * 変数編集モーダルコンポーネント
 *
 * @description
 * カスタム変数の新規作成・編集を行うモーダル。
 * 変数名、表示ラベル、各プロファイル（環境）ごとの値を設定できる。
 *
 * バリデーション:
 * - 変数名: 英数字とアンダースコアのみ、先頭は英字またはアンダースコア
 * - システム変数名との重複チェック
 * - 既存変数名との重複チェック（編集時は自分自身を除く）
 * - 少なくとも1つのプロファイルに値が必要
 */
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@cliptap/shared';
import { useProfiles, useVariables, UI_SYSTEM_VARIABLES, INPUT_LIMITS } from '@cliptap/shared';
import { useUnsavedChangesWarning } from '@hooks/useUnsavedChangesWarning';
import { useBodyScrollLock } from '@hooks/useBodyScrollLock';

interface VariableEditModalProps {
  isOpen: boolean;
  variableId?: string | null;
  onClose: () => void;
}

export function VariableEditModal({ isOpen, variableId, onClose }: VariableEditModalProps) {
  const { t } = useTranslation();
  const isEdit = !!variableId;
  const { profiles, profileVariables, refresh: refreshProfiles } = useProfiles();
  const { variables, createVariable, updateVariable, setVariableValuesForVariable } = useVariables();

  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileValues, setProfileValues] = useState<Record<string, string>>({});
  const [initialValues, setInitialValues] = useState<{ name: string; label: string; profileValues: Record<string, string> } | null>(null);

  const editingVariable = variables.find(v => v.id === variableId);

  /**
   * 変更検知
   * 未保存の変更があるかどうかを判定（閉じる時の警告表示に使用）
   */
  const hasChanges = useMemo(() => {
    if (!isOpen || !initialValues) return false;
    const nameChanged = name !== initialValues.name;
    const labelChanged = label !== initialValues.label;
    const profileValuesChanged = Object.keys(profileValues).some(
      key => profileValues[key] !== (initialValues.profileValues[key] || '')
    );
    return nameChanged || labelChanged || profileValuesChanged;
  }, [isOpen, initialValues, name, label, profileValues]);

  const { confirmClose } = useUnsavedChangesWarning({
    hasChanges,
    isActive: isOpen,
  });

  const handleClose = () => confirmClose(onClose);

  useBodyScrollLock(isOpen);

  /**
   * モーダル表示時の初期化処理
   * 編集モードの場合は既存データを読み込み、新規作成の場合は空の値を設定
   */
  useEffect(() => {
    if (isOpen) {
      setError('');
      if (isEdit && editingVariable) {
        setName(editingVariable.name);
        setLabel(editingVariable.label || '');
        const values: Record<string, string> = {};
        profiles.forEach(profile => {
          const pv = profileVariables.find(
            pv => pv.profileId === profile.id && pv.variableId === editingVariable.id
          );
          values[profile.id] = pv?.value || '';
        });
        setProfileValues(values);
        setInitialValues({ name: editingVariable.name, label: editingVariable.label || '', profileValues: values });
      } else {
        setName('');
        setLabel('');
        const values: Record<string, string> = {};
        profiles.forEach(profile => {
          values[profile.id] = '';
        });
        setProfileValues(values);
        setInitialValues({ name: '', label: '', profileValues: values });
      }
    }
  }, [isOpen, variableId, editingVariable, profiles, profileVariables, isEdit]);

  /**
   * 変数名バリデーション
   *
   * チェック項目:
   * - 必須チェック
   * - システム変数名との重複
   * - 既存変数名との重複（編集時は自分自身を除く）
   * - フォーマット（英数字とアンダースコアのみ、先頭は英字またはアンダースコア）
   */
  const validateName = (): string => {
    if (!name.trim()) return t('error.variable_name_required');

    if (UI_SYSTEM_VARIABLES.some(sv => sv.name === name.trim())) {
      return t('error.variable_name_reserved', { name: name.trim() });
    }

    const existingVariable = variables.find(v =>
      v.name === name.trim() && v.type === 'custom' && v.id !== variableId
    );
    if (existingVariable) {
      return t('error.variable_name_exists', { name: name.trim() });
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name.trim())) {
      return t('error.variable_name_invalid');
    }

    return '';
  };

  /**
   * 保存可能チェック
   * 少なくとも1つのプロファイルに値が設定されている必要がある
   */
  const canSave = () => {
    if (!name.trim()) return false;
    if (validateName()) return false;
    return Object.values(profileValues).some(val => val.trim() !== '');
  };

  const nameValidationMsg = validateName();
  const showNameError = name.trim() !== '' && nameValidationMsg !== '';

  /**
   * 変数保存処理
   *
   * 処理フロー:
   * 1. バリデーション実行
   * 2. 変数本体の作成/更新
   * 3. 各プロファイルの変数値を保存
   */
  const handleSubmit = async () => {
    const validationError = validateName();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!canSave()) {
      setError(t('error.value_required'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let savedVariable;

      if (isEdit && editingVariable) {
        savedVariable = await updateVariable(editingVariable.id, {
          name: name.trim(),
          label: label.trim() || null,
        });
      } else {
        savedVariable = await createVariable({
          name: name.trim(),
          label: label.trim() || undefined,
        });
      }

      const valuesToSave = profiles.map(profile => ({
        profileId: profile.id,
        variableId: savedVariable.id,
        value: profileValues[profile.id] || '',
      }));

      /* 変数値を設定 */
      setVariableValuesForVariable(savedVariable.id, valuesToSave);
      /* ProfileProviderを更新（profileVariablesが変更されるため） */
      refreshProfiles();

      onClose();
    } catch (err) {
      if (err instanceof Error && err.message.includes('already exists')) {
        setError(t('error.variable_name_exists', { name: name.trim() }));
      } else {
        setError(t('error.generic'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  /* 変数編集モーダル（オーバーレイ + コンテナ） */
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center p-4 z-50" onClick={handleClose}>
      {/* モーダルコンテナ（最大幅制限、クリックイベントの伝播を停止） */}
      <div
        className="bg-white dark:bg-[#1A1A1A] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー（タイトルと閉じるボタン） */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2A2A2A] flex items-center justify-between">
          {/* タイトル（編集/作成モードに応じて切り替え） */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEdit ? t('settings.variable_edit') : t('settings.variable_add')}
          </h2>
          {/* 閉じるボタン */}
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 dark:text-[#707070] hover:text-gray-600 dark:hover:text-[#A0A0A0] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* スクロール可能なフォームコンテンツ */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* エラーメッセージ（エラーがある場合のみ表示） */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

            {/* 変数名入力 */}
            <div>
              {/* ラベルと文字数カウンター */}
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-[#A0A0A0]">
                  {t('settings.variable_name')} *
                </label>
                <span className={`text-xs ${showNameError ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-[#707070]'}`}>
                  {name.length}/{INPUT_LIMITS.VARIABLE_NAME_MAX}
                </span>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('settings.variable_name_placeholder')}
                maxLength={INPUT_LIMITS.VARIABLE_NAME_MAX}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#707070] ${showNameError
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-[#2A2A2A]'
                  }`}
              />
              {/* エラーメッセージまたは使用例ヒント */}
              {showNameError ? (
                <p className="mt-2 text-xs text-red-500 dark:text-red-400">
                  {nameValidationMsg}
                </p>
              ) : (
                <p className="mt-2 text-xs text-gray-500 dark:text-[#707070]">
                  {t('settings.variable_usage_hint', { name: name || t('settings.variable_name') })}
                </p>
              )}
            </div>

            {/* 表示ラベル入力（オプション） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#A0A0A0] mb-2">
                {t('settings.variable_label')}
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={t('settings.variable_label_placeholder')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-[#2A2A2A] rounded-xl focus:outline-none bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#707070]"
              />
              {/* ラベルヒント */}
              <p className="mt-2 text-xs text-gray-500 dark:text-[#707070]">
                {t('settings.variable_label_hint')}
              </p>
            </div>

          {/* プロファイル（環境）ごとの値設定 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#A0A0A0] mb-2">
              {t('variables.environment_values')} *
            </label>
            {/* 説明文 */}
            <p className="text-xs text-gray-500 dark:text-[#707070] mb-4">
              {t('variables.environment_values_hint_1')} {t('variables.environment_values_hint_2')}
            </p>

            {/* プロファイル値入力テーブル */}
            <div className="border border-gray-200 dark:border-[#2A2A2A] rounded-xl overflow-hidden">
              {/* テーブルヘッダー */}
              <div className="bg-gray-50 dark:bg-[#2A2A2A] border-b border-gray-200 dark:border-[#2A2A2A] px-4 py-3 grid grid-cols-2 gap-4">
                <div className="text-sm font-medium text-gray-700 dark:text-[#A0A0A0]">{t('variables.environment_header')}</div>
                <div className="text-sm font-medium text-gray-700 dark:text-[#A0A0A0]">{t('variables.value_header')}</div>
              </div>

              {/* プロファイル値入力行 */}
              {profiles.map((profile, index) => (
                /* プロファイル値入力行（プロファイル名・デフォルトバッジ、値入力フィールド） */
                <div
                  key={profile.id}
                  className={`px-4 py-3 grid grid-cols-2 gap-4 items-center ${
                    index < profiles.length - 1 ? 'border-b border-gray-200 dark:border-[#2A2A2A]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {/* プロファイル名 */}
                    <span className="font-medium text-gray-900 dark:text-white">{profile.name}</span>
                    {/* デフォルトバッジ（デフォルトプロファイルの場合のみ表示） */}
                    {profile.isDefault && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 text-xs rounded-full">
                        {t('profile.default_badge')}
                      </span>
                    )}
                  </div>
                  {/* プロファイル値入力フィールド */}
                  <input
                    type="text"
                    value={profileValues[profile.id] || ''}
                    onChange={(e) => setProfileValues({
                      ...profileValues,
                      [profile.id]: e.target.value,
                    })}
                    placeholder={t('variables.enter_value_placeholder')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2A2A2A] rounded-lg focus:outline-none text-sm bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#707070]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* フッター（キャンセル・保存ボタン） */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-[#2A2A2A] flex items-center justify-end gap-3">
          {/* キャンセルボタン */}
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 dark:border-[#2A2A2A] text-gray-700 dark:text-[#A0A0A0] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors"
          >
            {t('common.cancel')}
          </button>
          {/* 保存ボタン（バリデーション通過時のみ有効） */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !canSave()}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isSubmitting || !canSave()
                ? 'bg-gray-300 dark:bg-[#2A2A2A] text-gray-500 dark:text-[#707070] cursor-not-allowed'
                : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
            }`}
          >
            {isSubmitting ? t('common.processing') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
