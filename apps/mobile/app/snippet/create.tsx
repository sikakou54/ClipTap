/**
 * @module CreateSnippetScreen
 * @description 定型文新規作成画面
 *
 * 新しい定型文を作成するためのモーダル画面。
 *
 * @features
 * - タイトル（任意）
 * - 本文（必須）
 * - カテゴリ（任意）
 * - 対象プロファイル（複数選択可、空=全プロファイル）
 * - タイトル付きコピー設定
 *
 * @navigation
 * - メイン画面の追加ボタン → /snippet/create
 *
 * @see components/snippet/SnippetFormScreen.tsx - 共通フォームコンポーネント
 * @see app/snippet/edit.tsx - 編集画面
 */
import React from 'react';
import { SnippetFormScreen } from '@components/snippet/SnippetFormScreen';

export default function CreateSnippetScreen() {
  /* 定型文新規作成フォーム（共通フォームコンポーネントを使用） */
  return (
    <SnippetFormScreen mode="create" />
  );
}
