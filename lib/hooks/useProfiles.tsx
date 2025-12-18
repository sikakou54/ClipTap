/**
 * useProfiles - プロファイル管理カスタムフック
 * Context + Custom Hook パターン
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { profileService } from '../services/ProfileService';
import { purchaseService, FREE_PROFILES_LIMIT } from '../services/PurchaseService';
import { useSubscription } from './useSubscription';
import {
  Profile,
  ProfileVariable,
  ProfileWithVariables,
  CreateProfileInput,
  UpdateProfileInput,
  CreateProfileVariableInput,
  UpdateProfileVariableInput,
} from '../types/profile';
import { Logger } from '../logger';

interface ProfileContextType {
  profiles: Profile[];
  activeProfile: Profile | null;
  defaultProfile: Profile | null;
  activeProfileVariables: ProfileVariable[];
  refresh: () => void;
  createProfile: (input: CreateProfileInput) => Promise<Profile>;
  updateProfile: (id: string, input: UpdateProfileInput) => Promise<Profile | null>;
  deleteProfile: (id: string) => Promise<boolean>;
  setActiveProfile: (id: string) => Promise<boolean>;
  getProfileWithVariables: (id: string) => ProfileWithVariables | null;
  upsertProfileVariable: (input: CreateProfileVariableInput) => Promise<ProfileVariable>;
  deleteProfileVariable: (id: string) => Promise<boolean>;
  getAllProfilesIncludingInvalid: () => Profile[];
  getProfileVariablesMap: (profileId: string) => Record<string, string>;
  getActiveProfileVariablesMap: () => Record<string, string>;
  getDefaultProfileVariablesMap: () => Record<string, string>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

interface Props {
  children: ReactNode;
}

export function ProfileProvider({ children }: Props) {
  // useSubscriptionからサブスクリプション状態を取得（validフラグ更新監視用）
  const { isSubscribed, isLoading: isSubscriptionLoading } = useSubscription();

  // 初期値は空にして、useEffectで読み込む（updateValidFlags完了後に読み込むため）
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [defaultProfile, setDefaultProfile] = useState<Profile | null>(null);
  const [activeProfileVariables, setActiveProfileVariables] = useState<ProfileVariable[]>([]);

  // プロファイル一覧と アクティブプロファイルを再読み込み
  const refresh = React.useCallback(() => {
    try {
      // valid=1のプロファイルのみ取得される
      const allProfiles = profileService.getAllProfiles();
      setProfiles(allProfiles);

      const active = profileService.getActiveProfile();
      setActiveProfileState(active);

      const def = profileService.getDefaultProfile();
      setDefaultProfile(def);

      if (active) {
        const variables = profileService.getProfileVariables(active.id);
        setActiveProfileVariables(variables);
      } else {
        setActiveProfileVariables([]);
      }
    } catch (error) {
      Logger.error('[useProfiles] Failed to refresh:', error);
    }
  }, []);

  // サブスクリプションの初期化が完了したら、またはサブスクリプション状態が変更されたら再読み込み
  React.useEffect(() => {
    // サブスクリプションの初期化が完了するまで待つ
    if (isSubscriptionLoading) {
      Logger.info('[ProfileProvider] Waiting for subscription to initialize...');
      return;
    }

    Logger.info('[ProfileProvider] Subscription ready, refreshing profiles');
    refresh();
  }, [isSubscribed, isSubscriptionLoading, refresh]);

  // プロファイルを作成
  const createProfile = React.useCallback(async (input: CreateProfileInput): Promise<Profile> => {
    try {
      const profile = profileService.createProfile(input);
      refresh();
      return profile;
    } catch (error) {
      Logger.error('[useProfiles] Failed to create profile:', error);
      throw error;
    }
  }, [refresh]);

  // プロファイルを更新
  const updateProfile = React.useCallback(async (id: string, input: UpdateProfileInput): Promise<Profile | null> => {
    try {
      const profile = profileService.updateProfile(id, input);
      refresh();
      return profile;
    } catch (error) {
      Logger.error('[useProfiles] Failed to update profile:', error);
      throw error;
    }
  }, [refresh]);

  // プロファイルを削除
  const deleteProfile = React.useCallback(async (id: string): Promise<boolean> => {
    try {
      const result = profileService.deleteProfile(id);
      refresh();
      return result;
    } catch (error) {
      Logger.error('[useProfiles] Failed to delete profile:', error);
      throw error;
    }
  }, [refresh]);

  // アクティブプロファイルを切り替え
  const setActiveProfile = React.useCallback(async (id: string): Promise<boolean> => {
    try {
      const result = profileService.setActiveProfile(id);
      refresh();
      return result;
    } catch (error) {
      Logger.error('[useProfiles] Failed to set active profile:', error);
      throw error;
    }
  }, [refresh]);

  // プロファイルと変数を取得
  const getProfileWithVariables = React.useCallback((id: string): ProfileWithVariables | null => {
    try {
      return profileService.getProfileWithVariables(id);
    } catch (error) {
      Logger.error('[useProfiles] Failed to get profile with variables:', error);
      return null;
    }
  }, []);

  // プロファイル変数を作成/更新（UPSERT）
  const upsertProfileVariable = React.useCallback(async (input: CreateProfileVariableInput): Promise<ProfileVariable> => {
    try {
      const variable = profileService.upsertProfileVariable(input);
      refresh();
      return variable;
    } catch (error) {
      Logger.error('[useProfiles] Failed to upsert profile variable:', error);
      throw error;
    }
  }, [refresh]);

  // プロファイル変数を削除
  const deleteProfileVariable = React.useCallback(async (id: string): Promise<boolean> => {
    try {
      const result = profileService.deleteProfileVariable(id);
      refresh();
      return result;
    } catch (error) {
      Logger.error('[useProfiles] Failed to delete profile variable:', error);
      throw error;
    }
  }, [refresh]);

  // すべてのプロファイル取得（無効なものを含む）
  const getAllProfilesIncludingInvalid = React.useCallback((): Profile[] => {
    try {
      return profileService.getAllProfilesIncludingInvalid();
    } catch (error) {
      Logger.error('[useProfiles] Failed to get all profiles including invalid:', error);
      return [];
    }
  }, []);

  // プロファイル別変数マップ取得
  const getProfileVariablesMap = React.useCallback((profileId: string): Record<string, string> => {
    try {
      return profileService.getProfileVariablesMap(profileId);
    } catch (error) {
      Logger.error('[useProfiles] Failed to get profile variables map:', error);
      return {};
    }
  }, []);

  // アクティブプロファイルの変数マップ取得
  const getActiveProfileVariablesMap = React.useCallback((): Record<string, string> => {
    try {
      return profileService.getActiveProfileVariablesMap();
    } catch (error) {
      Logger.error('[useProfiles] Failed to get active profile variables map:', error);
      return {};
    }
  }, []);

  // デフォルトプロファイルの変数マップ取得
  const getDefaultProfileVariablesMap = React.useCallback((): Record<string, string> => {
    try {
      return profileService.getDefaultProfileVariablesMap();
    } catch (error) {
      Logger.error('[useProfiles] Failed to get default profile variables map:', error);
      return {};
    }
  }, []);

  const value: ProfileContextType = {
    profiles,
    activeProfile,
    defaultProfile,
    activeProfileVariables,
    refresh,
    createProfile,
    updateProfile,
    deleteProfile,
    setActiveProfile,
    getProfileWithVariables,
    upsertProfileVariable,
    deleteProfileVariable,
    getAllProfilesIncludingInvalid,
    getProfileVariablesMap,
    getActiveProfileVariablesMap,
    getDefaultProfileVariablesMap,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfiles(): ProfileContextType {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error('useProfiles must be used within ProfileProvider');
  }

  return context;
}
