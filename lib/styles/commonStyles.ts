import { StyleSheet } from 'react-native';
import { getResponsiveDimensions } from '../themeSystem';

/**
 * 共通のスタイル定義
 * アプリ全体で再利用されるスタイルパターン
 */

const responsiveDimensions = getResponsiveDimensions();
export const commonStyles = StyleSheet.create({
  // ヘッダー関連
  backButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },

  // コンテナ関連
  container: {
    flex: 1,
  },

  // アクションボタン
  actionButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },

  // ヘッダー用プレースホルダー
  placeholder: {
    width: 32,
  },

  // 中央揃え
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

/**
 * 共通のヘッダースタイル
 */
export const headerStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});

/**
 * 共通のリストスタイル
 */
export const listStyles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  separator: {
    height: 1,
    marginLeft: 16,
  },
});

/**
 * スニペット編集/作成画面の共通スタイル
 */
export const snippetFormStyles = StyleSheet.create({
  content: {
    paddingTop: 16,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  saveButton: {
    padding: 4,
  },
  saveText: {
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  titleButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    padding: 12,
    minHeight: 48,
  },
  titleText: {
    flex: 1,
  },
  contentButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
  },
  contentText: {
    flex: 1,
  },
  chevron: {
    marginTop: 2,
  },
  categoryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    padding: 12,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  editIconContainer: {
    marginTop: 2,
  },
  sectionLabel: {
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  profileContainer: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  profileOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  profileOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
