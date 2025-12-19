/**
 * ファイルアップロード画面（初回セットアップ）
 *
 * モバイルアプリからエクスポートした.cliptapファイルを読み込み、
 * Webアプリを初期化するセットアップ画面。
 *
 * フロー:
 * 1. ファイルをドラッグ&ドロップまたは選択
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
  getMainDbAdapter,
  getFileIOAdapter,
  toOpfsPath,
} from '@cliptap/shared';
import { SQLiteWasm } from '@src/mappers/sqliteWasm';
import { useDatabase } from '@cliptap/shared';
import { subscriptionService } from '@services/SubscriptionService';
import { webDbCacheManager } from '@adapters/WebDbCacheManager';
import type { WebDatabaseAdapter } from '@adapters/WebDatabaseAdapter';
import type { WebFileIOAdapter } from '@adapters/WebFileIOAdapter';

import { useAuth, useTranslation } from '@cliptap/shared';
import { WebPageModal } from '@components/common/WebPageModal';
import {
  FileUploadArea,
  PasswordInput,
  ErrorDisplay,
  AgreementSection,
  LoadButton,
  HomeHeader,
  HowToUseSection,
} from '@components/home';

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

  const handleLoadFile = useCallback(async () => {
    if (!selectedFile) {
      setError(t('settings.web_specific.error_no_file'));
      return;
    }

    if (!password) {
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

      const { dbBytes } = await importParserService.parseAndValidate(jsonText, password);

      const mainDbPath = toOpfsPath('main.db');
      const fileIO = getFileIOAdapter() as WebFileIOAdapter;
      await fileIO.writeBytes(mainDbPath, dbBytes);

      const mainDbAdapter = getMainDbAdapter() as WebDatabaseAdapter;
      await mainDbAdapter.open(mainDbPath);

      /* サブスクリプション状態を確認（ログイン済みの場合のみ） */
      if (user) {
        await subscriptionService.checkSubscription(user.uid);
      }

      SharedSubscriptionService.updateValidFlags();

      setLoaded(true);

      await webDbCacheManager.flush();

      navigate('/dashboard');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';

      switch (errorMessage) {
        case 'PASSWORD_INCORRECT':
          setError(t('settings.web_specific.error_password'));
          break;
        case 'CHECKSUM_MISMATCH':
          setError(t('settings.web_specific.error_checksum'));
          break;
        case 'SCHEMA_VERSION_MISMATCH':
          setError(t('settings.web_specific.error_version'));
          break;
        case 'INVALID_FILE':
          setError(t('settings.web_specific.error_invalid'));
          break;
        default:
          setError(t('settings.web_specific.error_generic', { message: errorMessage }));
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

        {/* ファイルアップロードエリア（ドラッグ&ドロップ / ファイル選択） */}
        <FileUploadArea selectedFile={selectedFile} onFileSelect={handleFileSelect} />

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
          disabled={!selectedFile || !password || isLoading || !hasAgreedTerms || !hasAgreedPrivacy}
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
