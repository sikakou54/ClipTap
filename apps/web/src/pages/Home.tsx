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
import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SubscriptionService as SharedSubscriptionService,
  ImportParserService as ImportParserServiceClass,
  ImportService,
  ClipTapError,
  Logger,
  SystemVariableFormatMapper,
  getFileIOAdapter,
  toOpfsPath,
} from '@cliptap/shared';
import { SQLiteWasm } from '@src/mappers/sqliteWasm';
import { useDatabase } from '@cliptap/shared';
import { webDbCacheManager } from '@adapters/WebDbCacheManager';
import type { WebFileIOAdapter } from '@adapters/WebFileIOAdapter';
import { loadInitialImportDatabase } from '@services/InitialImportService';

import { useTranslation } from '@cliptap/shared';
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

/**
 * 初回読込の失敗を画面表示用の文言へ対応付ける
 *
 * @param error - 読込処理が送出したエラー
 * @param t - 翻訳関数
 * @returns 利用者へ表示する文言
 *
 * @remarks
 * ClipTapErrorのcodeは翻訳キーを兼ねる。画面固有の言い回しがあるものはそれを使い、
 * 残りはcodeの翻訳へ委ねる。内部Errorの英語メッセージは画面へ出さずログにだけ残す。
 */
function resolveLoadErrorMessage(
  error: unknown,
  t: (key: string, options?: Record<string, string>) => string
): string {
  if (!(error instanceof ClipTapError)) {
    Logger.error('[Home] Failed to load file:', error);
    return t('error.generic');
  }

  switch (error.code) {
    case 'error.incorrect_password':
      return t('settings.web_specific.error_password');
    case 'error.checksum_mismatch':
      return t('settings.web_specific.error_checksum');
    case 'error.newer_version':
      return t('settings.web_specific.error_version');
    case 'error.invalid_file_format':
      return t('settings.web_specific.error_invalid');
    default:
      /* 画面固有の言い回しが無いcodeは、その翻訳を読込失敗の文脈へ埋め込む */
      Logger.error('[Home] Failed to load file:', error);
      return t('settings.web_specific.error_generic', { message: t(error.code) });
  }
}

export function Home() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hasAgreedTerms, setHasAgreedTerms] = useState(false);
  const [hasAgreedPrivacy, setHasAgreedPrivacy] = useState(false);
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | null>(null);
  /* 初回読込の実行中フラグ（多重読込の防止） */
  const isImportingRef = useRef(false);

  const navigate = useNavigate();
  const { isLoaded, setLoaded } = useDatabase();
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

    /* 連打やEnterキーによる多重読込を防ぐ（描画前に判定するためstateではなくrefで持つ） */
    if (isImportingRef.current) return;
    isImportingRef.current = true;

    setIsLoading(true);
    setError('');

    const fileIO = getFileIOAdapter() as WebFileIOAdapter;
    let sourcePath: string | null = null;

    try {
      await SQLiteWasm.init();

      /* 通常インポートと同じ経路で、検証と一時DB上の移行を先に完了する */
      sourcePath = toOpfsPath(`temp_initial_import_${crypto.randomUUID()}.json`);
      await fileIO.writeFile(sourcePath, await selectedFile.text());
      await loadInitialImportDatabase(password, sourcePath, {
        prepareDatabase: (importPassword, importSourcePath) =>
          ImportService.prepareImportDatabase(importPassword, importSourcePath),
        readPreparedDatabase: (tempDbPath) => fileIO.readBytes(tempDbPath),
        suspendAutoSave: () => webDbCacheManager.suspendAutoSave(),
        openDatabase: async (dbBytes) => {
          /* mainDB・systemDBの両方を開き直す（「ファイルを閉じる」後の再読み込みに対応） */
          await database.openImportedDatabase(dbBytes);
        },
        finalizeDatabase: async () => {
          await database.finalizeInitialLoad();
          SystemVariableFormatMapper.loadRegistry();
          /* 通常インポートと同じく、プラン上限に応じた有効フラグを反映する */
          SharedSubscriptionService.updateValidFlags();
        },
        persistDatabase: () => webDbCacheManager.flushOrThrow(),
        resetDatabase: () => database.reset(),
        cleanupDatabase: (tempDbPath) => fileIO.deleteFile(tempDbPath),
      });

      setLoaded(true);

      navigate('/dashboard');

    } catch (err) {
      setError(resolveLoadErrorMessage(err, t));
    } finally {
      if (sourcePath) {
        try {
          await fileIO.deleteFile(sourcePath);
        } catch {
          /* 入力用一時ファイルの削除失敗は読込結果へ影響させない */
        }
      }
      setIsLoading(false);
      isImportingRef.current = false;
    }
  }, [selectedFile, password, hasAgreedTerms, hasAgreedPrivacy, t, setLoaded, navigate]);

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
          disabled={isLoading}
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
