/**
 * ファイルアップロード画面（初回セットアップ）
 *
 * モバイルアプリからエクスポートした.cliptapファイルを読み込み、
 * Webアプリを初期化するセットアップ画面。
 * モバイルアプリを持たない利用者向けに、サンプルデータ入りのベースファイルも配布する。
 *
 * フロー:
 * 1. ファイルをドラッグ&ドロップまたは選択（未所持の場合はベースファイルをダウンロード）
 * 2. エクスポート時に設定したパスワードを入力
 * 3. 利用規約・プライバシーポリシーに同意
 * 4. 「読み込む」ボタンでデータを復元
 *
 * セキュリティ:
 * - パスワード検証
 * - チェックサム検証
 * - スキーマバージョン互換性チェック
 */
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SubscriptionService as SharedSubscriptionService,
  ImportParserService as ImportParserServiceClass,
  ClipTapError,
  migrateImportTempDb,
  SystemVariableFormatMapper,
  SCHEMA_VERSION,
} from '@cliptap/shared';
import { SQLiteWasm } from '@src/mappers/sqliteWasm';
import { useDatabase } from '@cliptap/shared';
import { subscriptionService } from '@services/SubscriptionService';
import { webDbCacheManager } from '@adapters/WebDbCacheManager';

import { useAuth, useTranslation } from '@cliptap/shared';
import { WebPageModal } from '@components/common/WebPageModal';
import {
  FileUploadArea,
  StarterFileSection,
  PasswordInput,
  ErrorDisplay,
  AgreementSection,
  LoadButton,
  HomeHeader,
  HowToUseSection,
} from '@components/home';
import { STARTER_FILE_PASSWORD } from '@constants/starterFile';
import { database } from '@database/database';

const importParserService = new ImportParserServiceClass();

export function Home() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hasAgreedTerms, setHasAgreedTerms] = useState(false);
  const [hasAgreedPrivacy, setHasAgreedPrivacy] = useState(false);
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | null>(null);

  const navigate = useNavigate();
  const { isLoaded, setLoaded } = useDatabase();
  const { user } = useAuth();
  const { t } = useTranslation();


  /* 既にデータがロードされている場合はダッシュボードへ */
  useEffect(() => {
    if (isLoaded) {
      navigate('/dashboard');
    }
  }, [isLoaded, navigate]);

  const handleFileSelect = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;

    if (!importParserService.isClipTapFile(file.name)) {
      setError(t('backup.select_cliptap_file'));
      return;
    }

    setSelectedFile(file);
    setError('');
  }, [t]);

  /* ベースファイルのダウンロード時、パスワード未入力ならベースファイル用の値を補完する */
  const handleStarterFileDownload = useCallback(() => {
    setPassword((current) => (current === '' ? STARTER_FILE_PASSWORD : current));
  }, []);

  const handleLoadFile = useCallback(async () => {
    if (!selectedFile) {
      setError(t('settings.web_specific.error_no_file'));
      return;
    }

    if (!password.trim()) {
      setError(t('settings.web_specific.error_no_password'));
      return;
    }

    if (!hasAgreedTerms) {
      setError(t('settings.web_specific.error_terms'));
      return;
    }

    if (!hasAgreedPrivacy) {
      setError(t('settings.web_specific.error_privacy'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await SQLiteWasm.init();

      const arrayBuffer = await selectedFile.arrayBuffer();
      const jsonText = new TextDecoder().decode(arrayBuffer);

      const { dbBytes, exportData } = await importParserService.parseAndValidate(jsonText, password);

      /* mainDB・systemDBの両方を開き直す（「ファイルを閉じる」後の再読み込みに対応） */
      const mainDbAdapter = await database.openImportedDatabase(dbBytes);

      if (exportData.s < SCHEMA_VERSION) {
        await migrateImportTempDb(mainDbAdapter, exportData.s);
      }
      SystemVariableFormatMapper.loadRegistry();
      await database.finalizeInitialLoad();

      /* サブスクリプション状態を確認（ログイン済みの場合のみ） */
      if (user) {
        await subscriptionService.checkSubscription(user.uid);
      }

      SharedSubscriptionService.updateValidFlags();

      setLoaded(true);

      await webDbCacheManager.flush();

      navigate('/dashboard');

    } catch (err) {
      /* ClipTapErrorのcodeは翻訳キーを兼ねるため、これを画面固有の文言へ対応付ける */
      const errorCode = err instanceof ClipTapError ? err.code : null;

      switch (errorCode) {
        case 'error.incorrect_password':
          setError(t('settings.web_specific.error_password'));
          break;
        case 'error.checksum_mismatch':
          setError(t('settings.web_specific.error_checksum'));
          break;
        case 'error.newer_version':
          setError(t('settings.web_specific.error_version'));
          break;
        case 'error.invalid_file_format':
          setError(t('settings.web_specific.error_invalid'));
          break;
        default:
          setError(
            t('settings.web_specific.error_generic', {
              message: err instanceof Error ? err.message : t('error.generic'),
            })
          );
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, password, hasAgreedTerms, hasAgreedPrivacy, user, t, setLoaded, navigate]);

  if (isLoaded) {
    return <div className="min-h-screen bg-gray-50 dark:bg-black" />;
  }


  /* ホーム画面（ファイルアップロード・初期セットアップ） */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
      {/* メインコンテンツカード */}
      <div className="max-w-md w-full bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-lg p-8">
        {/* ヘッダー（タイトル・説明） */}
        <HomeHeader />

        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          {t('settings.web_specific.shared_device_warning')}
        </p>

        {/* ファイルアップロードエリア（ドラッグ&ドロップ / ファイル選択） */}
        <FileUploadArea selectedFile={selectedFile} onFileSelect={handleFileSelect} />

        {/* ベースファイル案内（モバイルアプリ未所持でも開始できるようにする） */}
        <StarterFileSection onDownload={handleStarterFileDownload} />

        {/* パスワード入力 */}
        <PasswordInput
          password={password}
          onChange={setPassword}
          onEnter={handleLoadFile}
          selectedFile={selectedFile}
        />

        {/* エラー表示 */}
        <ErrorDisplay error={error} />

        {/* 利用規約・プライバシーポリシー同意 */}
        <AgreementSection
          hasAgreedTerms={hasAgreedTerms}
          hasAgreedPrivacy={hasAgreedPrivacy}
          onAgreeTerms={setHasAgreedTerms}
          onAgreePrivacy={setHasAgreedPrivacy}
          onOpenTerms={() => setActiveModal('terms')}
          onOpenPrivacy={() => setActiveModal('privacy')}
        />

        {/* 読み込みボタン */}
        <LoadButton
          onClick={handleLoadFile}
          disabled={!selectedFile || !password.trim() || isLoading || !hasAgreedTerms || !hasAgreedPrivacy}
          isLoading={isLoading}
        />

        {/* 使い方 */}
        <HowToUseSection />
      </div>

      {/* 利用規約・プライバシーポリシー表示モーダル */}
      {/* 利用規約モーダル（iFrame表示） */}
      <WebPageModal
        isOpen={activeModal === 'terms'}
        onClose={() => setActiveModal(null)}
        title={`ClipTap Web ${t('settings.terms')}`}
        url="terms.html"
      />
      {/* プライバシーポリシーモーダル（iFrame表示） */}
      <WebPageModal
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
        title={`ClipTap Web ${t('settings.privacy')}`}
        url="privacy.html"
      />
    </div>
  );
}
