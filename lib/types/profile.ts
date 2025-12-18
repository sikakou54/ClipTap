/**
 * 環境（プロファイル）の型定義
 * カスタム変数を環境ごとにグループ化して管理
 */

export interface Profile {
  id: string;
  name: string;                  // 環境名（例：株式会社A、株式会社B）
  isActive: boolean;             // 現在アクティブな環境かどうか
  isDefault: boolean;            // 標準環境かどうか（削除不可）
  valid: boolean;                // 有効データフラグ（プランに応じて設定）
  createdAt: string;
  updatedAt: string;
}

export interface ProfileVariable {
  id: string;
  profileId: string;             // 所属するプロファイルID
  variableId: string;            // 参照する変数ID (variables.id)
  value: string;                 // プロファイル固有の値
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfileInput {
  name: string;
}

export interface UpdateProfileInput {
  name?: string;
  isActive?: boolean;
}

export interface CreateProfileVariableInput {
  profileId: string;
  variableId: string;
  value: string;
}

export interface UpdateProfileVariableInput {
  value?: string;
}

/**
 * プロファイルと変数をまとめた型
 */
export interface ProfileWithVariables extends Profile {
  variables: ProfileVariable[];
}
