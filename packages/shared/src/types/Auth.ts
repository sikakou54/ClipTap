/**
 * 認証関連の型定義
 *
 * Firebase Authenticationのユーザー情報などを抽象化した型。
 */

/**
 * 共有ユーザーインターフェース
 *
 * @remarks
 * - Firebase Userオブジェクトから必要な情報のみを抽出
 * - Mobile/Webで共通して使用
 * - email, displayName, photoURLはnull許容（認証方法により未設定の場合あり）
 */
export interface SharedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  emailVerified: boolean;
  /** Firebase IDトークン取得関数（バックエンドAPI認証に使用） */
  getIdToken?: (forceRefresh?: boolean) => Promise<string>;
}


