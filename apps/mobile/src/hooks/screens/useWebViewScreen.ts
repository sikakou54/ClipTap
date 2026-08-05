/**
 * WebView画面カスタムフック
 *
 * 利用規約やプライバシーポリシーなどの静的HTMLコンテンツを読み込む処理を管理するフック。
 * UI層からファイル読み込みロジックを分離する。
 *
 * 主な責務:
 * - URLパラメータからファイル名とタイトルを取得
 * - HTMLファイルの読み込み
 * - ローディング状態の管理
 *
 * @see app/webview.tsx - WebView画面UI
 */

import { useState, useEffect } from 'react';
import { File } from 'expo-file-system';
import { Asset } from 'expo-asset';
import { Logger } from '@cliptap/shared';
import termsHtml from '../../../assets/web/terms.html';
import privacyHtml from '../../../assets/web/privacy.html';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/** useWebViewScreen フックのパラメータ */
export interface UseWebViewScreenParams {
  /** 表示するHTMLファイル名（'terms' | 'privacy'） */
  file: string;
  /** 表示タイトル */
  title: string;
}

/** useWebViewScreen フックの返却値 */
export interface UseWebViewScreenReturn {
  /** 読み込んだHTMLコンテンツ */
  htmlContent: string;
  /** ファイル読み込み中フラグ */
  loading: boolean;
  /** 表示タイトル */
  title: string;
}

/* ======================================== */
/* フック実装 */
/* ======================================== */

export function useWebViewScreen(params: UseWebViewScreenParams): UseWebViewScreenReturn {
  /* ======================================== */
  /* パラメータ取得 */
  /* ======================================== */
  const { file, title: paramTitle } = params;

  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  /* ======================================== */
  /* 初期化処理 */
  /* ======================================== */

  useEffect(() => {
    const loadHtmlFile = async () => {
      try {
        /* ファイル名に応じてアセットモジュールを選択 */
        let assetModule: number | undefined;

        if (file === 'terms') {
          assetModule = termsHtml;
        } else if (file === 'privacy') {
          assetModule = privacyHtml;
        }

        if (assetModule === undefined) {
          setLoading(false);
          return;
        }

        const asset = Asset.fromModule(assetModule);
        await asset.downloadAsync();

        if (asset.localUri) {
          const fileHandle = new File(asset.localUri);
          const content = await fileHandle.text();
          setHtmlContent(content);
        }
      } catch (error) {
        Logger.error('Failed to load HTML file:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadHtmlFile();
  }, [file]);

  /* ======================================== */
  /* 戻り値 */
  /* ======================================== */

  return {
    htmlContent,
    loading,
    title: paramTitle,
  };
}
