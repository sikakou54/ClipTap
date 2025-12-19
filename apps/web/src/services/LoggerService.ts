/**
 * @module LoggerService
 * @description
 * 構造化されたログシステム（Web版）
 *
 * 共通Loggerを使用し、Viteのimport.meta.env.DEVで環境判定を行う。
 * Web版ではエモジなしのシンプルなログ出力。
 */

import { initializeLogger, Logger } from '@cliptap/shared';

/* 環境判定: Viteの開発モードかどうかを判定（development環境 = true, production環境 = false） */
const isDevelopment = import.meta.env.DEV;

/* Loggerを初期化 */
initializeLogger({
  /* 開発モードかどうかを渡す（開発モードではより詳細なログを出力） */
  isDevelopment,
  /* エモジを使用しない（Web版はシンプルなログ出力のため） */
  useEmoji: false,
});

/* 共通Loggerをre-export（他のファイルからimportできるようにする） */
export { Logger };
