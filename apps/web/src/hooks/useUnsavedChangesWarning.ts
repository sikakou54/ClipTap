/**
 * 未保存変更の警告フック
 *
 * @description
 * フォーム編集時に未保存の変更がある場合、
 * モーダルを閉じようとしたときやページ遷移時に警告を表示する。
 *
 * @module useUnsavedChangesWarning
 */
import { useCallback, useEffect } from 'react';
import { useTranslation } from '@cliptap/shared';

interface UseUnsavedChangesWarningOptions {
  /** 変更があるかどうか */
  hasChanges: boolean;
  /** モーダルが開いているか（ブラウザのbeforeunloadを有効にするため） */
  isActive?: boolean;
}

interface UseUnsavedChangesWarningReturn {
  /**
   * 閉じる操作をラップする関数
   * 変更がある場合は確認ダイアログを表示し、OKなら元のonCloseを実行
   */
  confirmClose: (onClose: () => void) => void;
}

/**
 * 未保存変更の警告を管理するフック
 */
export function useUnsavedChangesWarning({
  hasChanges,
  isActive = true,
}: UseUnsavedChangesWarningOptions): UseUnsavedChangesWarningReturn {
  const { t } = useTranslation();

  /* ブラウザのタブを閉じる・リロード時の警告 */
  useEffect(() => {
    /* 警告が無効、または変更がない場合は何もしない */
    if (!isActive || !hasChanges) return;

    /* beforeunloadイベントハンドラ */
    /* ユーザーがページを離れようとしたときにブラウザ標準の確認ダイアログを表示させる */
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      /* イベントのデフォルト動作をキャンセル（Chrome等で必要） */
      e.preventDefault();
      /* returnValueに空文字を設定することで、ブラウザ標準の離脱確認ダイアログが表示される */
      /* （※セキュリティ上の理由から、カスタムメッセージは表示されず標準メッセージになる） */
      e.returnValue = '';
    };

    /* イベントリスナーを登録 */
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    /* クリーンアップ: コンポーネントアンマウント時や条件変更時にリスナーを解除 */
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isActive, hasChanges]);

  /* 閉じる操作をラップする関数 */
  /* ボタンクリック等による明示的な「閉じる」アクションに対して使用 */
  const confirmClose = useCallback(
    (onClose: () => void) => {
      if (hasChanges) {
        /* 変更がある場合は確認ダイアログを表示 */
        /*
         * @utils/alerts を動的importしているため、確認ダイアログの表示は次のマイクロタスクになる。
         * Web版で動的importが残っているのは、ここと useHomeScreen.handleDeleteSnippet、
         * useExportScreen の ExportService 取得の3箇所
         */
        import('@utils/alerts').then(({ showConfirmMessage }) => {
          const message = t('common.unsaved_changes_warning');
          showConfirmMessage(message, () => {
            onClose();
          });
        });
      } else {
        /* 変更がない場合は確認なしで即座に閉じる */
        onClose();
      }
    },
    [hasChanges, t]
  );

  return { confirmClose };
}
