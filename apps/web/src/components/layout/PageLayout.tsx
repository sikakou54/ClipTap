/**
 * 共通ページレイアウト（固定サイドメニュー付き）
 *
 * @description
 * 設定画面などで使用する共通レイアウトコンポーネント。
 * サイドメニュー、ヘッダー、メインコンテンツエリアを提供する。
 * モバイル時はハンバーガーメニューでサイドメニューを表示。
 *
 * レスポンシブ対応:
 * - デスクトップ（md以上）: サイドメニュー固定表示、メインコンテンツは左マージン72（18rem）
 * - モバイル: サイドメニューはオーバーレイ表示、ヘッダーにハンバーガーメニューボタン
 */
import type { ReactNode } from 'react';
import { useState, useCallback } from 'react';
import {
  useAuth,
  useDatabase,
  useSnippets,
  useProfiles,
  useVariables,
  useCategories,
  translateError,
  ExportService,
} from '@cliptap/shared';
import { SideMenu } from '@components/settings/SideMenu';
import { showErrorAlert, showConfirm } from '@utils/alerts';
import { ExportSelectionModal } from '@components/export/ExportSelectionModal';
import { ImportFileModal } from '@components/import/ImportFileModal';
import { ImportSelectionModal } from '@components/import/ImportSelectionModal';
import { ImportModeSelectModal } from '@components/import/ImportModeSelectModal';
import { AccountLinkModal } from '@components/auth/AccountLinkModal';
import { useBodyScrollLock } from '@hooks/useBodyScrollLock';
import { useMobileMenu } from '@hooks/useMobileMenu';
import { useWebImport } from '@hooks/useWebImport';
import { PageHeader } from './PageHeader';

interface PageLayoutProps {
  /** ページタイトル */
  title: string;
  /** タイトル横に表示するアイコン（SVG path） */
  icon?: string;
  /** メインコンテンツ */
  children: ReactNode;
  /** ヘッダー右側に配置するアクション要素 */
  rightAction?: ReactNode;
}

export function PageLayout({ title, icon, children, rightAction }: PageLayoutProps) {
  const { setLoaded } = useDatabase();
  const { user, signInWithGoogle, signInWithApple, loading: authLoading, error: authError } = useAuth();

  /* Provider refresh関数を取得 */
  const { refresh: refreshSnippets } = useSnippets();
  const { refresh: refreshProfiles } = useProfiles();
  const { refresh: refreshVariables } = useVariables();
  const { refresh: refreshCategories } = useCategories();

  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showAccountLinkModal, setShowAccountLinkModal] = useState(false);

  const openAccountLinkModal = useCallback(() => {
    setShowAccountLinkModal(true);
  }, []);

  const closeAccountLinkModal = useCallback(() => {
    setShowAccountLinkModal(false);
  }, []);

  const { isOpen: isMobileMenuOpen, toggle: toggleMobileMenu, close: closeMobileMenu } = useMobileMenu();

  const handleError = useCallback(
    (error: Error) => {
      console.error('Export/Import error:', error);
      const translatedMessage = translateError(error);
      showErrorAlert(translatedMessage);
    },
    []
  );

  /* インポート完了時にすべてのProviderをリフレッシュ */
  const handleImportComplete = useCallback(() => {
    refreshSnippets();
    refreshProfiles();
    refreshVariables();
    refreshCategories();
  }, [refreshSnippets, refreshProfiles, refreshVariables, refreshCategories]);

  const webImport = useWebImport({
    user,
    setLoaded,
    onError: handleError,
    onImportComplete: handleImportComplete,
  });

  const handleRestoreBackupWithConfirm = useCallback(async () => {
    showConfirm('backup.restore_confirm', () => {
      void webImport.handleRestoreBackup();
    });
  }, [webImport]);

  const isModalOpen = showExportModal || isMobileMenuOpen || webImport.showFileSelect || webImport.showItemSelect || webImport.showModeSelect || showAccountLinkModal;
  useBodyScrollLock(isModalOpen);

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleImport = () => {
    webImport.setShowFileSelect(true);
  };

  const handleExportSelected = useCallback(
    async (
      password: string,
      snippetIds: string[],
      profileIds: string[],
      variableIds: string[],
      categoryIds: string[]
    ) => {
      setIsExporting(true);
      try {
        await ExportService.exportSelectedData(password, {
          snippetIds,
          profileIds,
          variableIds,
          categoryIds,
        });
      } catch (err) {
        console.error('Failed to export:', err);
        const translatedMessage = translateError(err);
        showErrorAlert(translatedMessage);
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  /* ページレイアウト（サイドメニュー、ヘッダー、メインコンテンツ、モーダル群） */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* サイドメニュー（レスポンシブ対応、モバイルではオーバーレイ表示） */}
      <SideMenu
        onExport={handleExport}
        onImport={handleImport}
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        onAccountLink={openAccountLinkModal}
      />

      {/* メインコンテンツエリア（デスクトップではサイドメニュー分の左マージンを確保） */}
      <div className="md:ml-72 transition-all duration-300">
        {/* ページヘッダー（固定表示、モバイルではハンバーガーメニューボタン付き） */}
        <PageHeader
          title={title}
          icon={icon}
          rightAction={rightAction}
          onToggleMobileMenu={toggleMobileMenu}
        />

        {/* メインコンテンツ（ページ固有の内容） */}
        <main className="px-6 py-6 pt-24">
          {children}
        </main>
      </div>

      {/* エクスポート選択モーダル（部分エクスポート用） */}
      <ExportSelectionModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportSelected}
        isProcessing={isExporting}
      />

      {/* インポートファイル選択モーダル（.cliptapファイル選択） */}
      <ImportFileModal
        isOpen={webImport.showFileSelect}
        onClose={() => webImport.setShowFileSelect(false)}
        onFileSelected={webImport.handleFileSelected}
        isLoading={webImport.isLoading}
      />

      {/* インポートモード選択モーダル（復元/マージ選択） */}
      <ImportModeSelectModal
        isOpen={webImport.showModeSelect}
        onClose={() => webImport.setShowModeSelect(false)}
        onSelectMode={(mode) => {
          if (mode === 'restore') {
            handleRestoreBackupWithConfirm();
          } else {
            webImport.handleSelectMergeMode();
          }
        }}
      />

      {/* インポート選択モーダル（部分インポート用、アイテム選択） */}
      <ImportSelectionModal
        isOpen={webImport.showItemSelect}
        onClose={() => webImport.setShowItemSelect(false)}
        candidates={webImport.importCandidates}
        onImport={webImport.handleExecutePartialImport}
        isProcessing={webImport.isProcessing}
      />

      {/* アカウント連携モーダル（Google/Apple認証） */}
      <AccountLinkModal
        isOpen={showAccountLinkModal}
        onClose={closeAccountLinkModal}
        onSignInWithGoogle={signInWithGoogle}
        onSignInWithApple={signInWithApple}
        isLoading={authLoading}
        error={authError}
      />
    </div>
  );
}
