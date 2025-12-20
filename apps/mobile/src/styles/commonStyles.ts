/**
 * @module commonStyles
 * @description
 * アプリ全体で再利用される共通スタイル定義
 *
 * このモジュールは複数の画面・コンポーネントで使用される
 * 汎用的なスタイルパターンを提供します。
 * テーマに依存しない構造的なスタイルのみを定義しています。
 *
 * スタイルカテゴリ:
 * - commonStyles: 汎用スタイル（ボタン、コンテナなど）
 * - headerStyles: ヘッダー関連スタイル
 * - listStyles: リスト関連スタイル
 * - snippetFormStyles: スニペット作成・編集画面用スタイル
 *
 * 使用箇所:
 * - 全画面のヘッダー
 * - リスト表示コンポーネント
 * - スニペット作成・編集画面
 * - カテゴリ・プロファイル編集画面
 *
 * @remarks
 * 色やフォントサイズなどテーマ依存のスタイルは
 * themeSystem.tsxまたは各コンポーネントで設定してください。
 *
 * @see themeSystem - テーマ依存のスタイル
 * @see UI_CONSTANTS - 定数値
 */

import { StyleSheet } from 'react-native';

/* ======================================== */
/* 汎用共通スタイル */
/* ======================================== */

/**
 * 汎用共通スタイル
 *
 * アプリ全体で使用される基本的なスタイルパターン。
 * ボタン、コンテナ、レイアウトなどの構造的なスタイルを定義。
 */
export const commonStyles = StyleSheet.create({
  /* ---------------------------------------- */
  /* ヘッダー関連 */
  /* ---------------------------------------- */

  /** 戻るボタン: パディング4dp、中央揃え */
  backButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** 追加ボタン: パディング4dp、中央揃え */
  addButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** ヘッダータイトル: 太字、中央揃え */
  headerTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },

  /* ---------------------------------------- */
  /* コンテナ関連 */
  /* ---------------------------------------- */

  /** 基本コンテナ: flex: 1で親要素いっぱいに広がる */
  container: {
    flex: 1,
  },

  /* ---------------------------------------- */
  /* アクションボタン */
  /* ---------------------------------------- */

  /** アクションボタン: パディング4dp */
  actionButton: {
    padding: 4,
  },
  /** 削除ボタン: パディング4dp */
  deleteButton: {
    padding: 4,
  },

  /* ---------------------------------------- */
  /* レイアウトユーティリティ */
  /* ---------------------------------------- */

  /** ヘッダー用プレースホルダー: 幅32dp（左右バランス用） */
  placeholder: {
    width: 32,
  },
  /** 中央揃え: 縦横中央配置 */
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

/* ======================================== */
/* ヘッダースタイル */
/* ======================================== */

/**
 * 共通のヘッダースタイル
 *
 * カスタムヘッダーで使用するスタイル。
 * 左右ボタン・中央タイトルの3分割レイアウト。
 */
export const headerStyles = StyleSheet.create({
  /** ヘッダー本体: 横並び、両端揃え、パディング */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  /** ヘッダー中央部: flex:1で残りスペースを使用、中央揃え */
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});

/* ======================================== */
/* リストスタイル */
/* ======================================== */

/**
 * 共通のリストスタイル
 *
 * FlashListやFlatListで使用するスタイル。
 * リストアイテムとセパレーターのスタイルを定義。
 */
export const listStyles = StyleSheet.create({
  /** リストコンテナ: flex:1で親要素いっぱいに広がる */
  listContainer: {
    flex: 1,
  },
  /** リストアイテム: 横並び、両端揃え、パディング */
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  /** セパレーター: 高さ1px、左マージン16dp（アイコン分） */
  separator: {
    height: 1,
    marginLeft: 16,
  },
});

/* ======================================== */
/* スニペットフォームスタイル */
/* ======================================== */

/**
 * スニペット編集/作成画面の共通スタイル
 *
 * スニペットの作成・編集画面で使用するスタイル。
 * タイトル入力、本文入力、カテゴリ選択などのフォーム要素。
 */
export const snippetFormStyles = StyleSheet.create({
  /** コンテンツエリア: 上16dp、左右8dp、下8dpのパディング */
  content: {
    paddingTop: 16,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  /** 保存ボタン: パディング4dp */
  saveButton: {
    padding: 4,
  },
  /** 保存ボタンテキスト: 太字 */
  saveText: {
    fontWeight: '600',
  },
  /** セクション: 下マージン16dp */
  section: {
    marginBottom: 16,
  },
  /** タイトル入力ボタン: 横並び、角丸10、高さ48dp以上 */
  titleButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    padding: 12,
    minHeight: 48,
  },
  /** タイトルテキスト: flex:1で残りスペースを使用 */
  titleText: {
    flex: 1,
  },
  /** 本文入力ボタン: 横並び、角丸10、高さ80dp以上 */
  contentButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
  },
  /** 本文テキスト: flex:1で残りスペースを使用 */
  contentText: {
    flex: 1,
  },
  /** シェブロンアイコン: 上マージン2dp（テキストとの揃え調整） */
  chevron: {
    marginTop: 2,
  },
  /** カテゴリ選択ボタン: 横並び、角丸10 */
  categoryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    padding: 12,
  },
  /** ラベル: 太字、下マージン8dp */
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  /** 編集アイコンコンテナ: 上マージン2dp */
  editIconContainer: {
    marginTop: 2,
  },
  /** セクションラベル: 太字、大文字、フォントサイズ12 */
  sectionLabel: {
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  /** プロファイルコンテナ: ボーダー1px、角丸10 */
  profileContainer: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  /** プロファイル選択オプション: 横並び、下ボーダー付き */
  profileOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  /** プロファイルオプション左側: 横並び */
  profileOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
