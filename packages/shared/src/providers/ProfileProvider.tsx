/**
 * プロファイル管理Provider
 *
 * @description
 * プロファイルとプロファイル変数のグローバル状態を管理するProvider。
 * すべての画面で同じデータを参照でき、一箇所で更新すると全画面に即座に反映される。
 *
 * @module ProfileProvider
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { ProfileService } from '../services/ProfileService';
import { SubscriptionService } from '../services/SubscriptionService';
import { Logger } from '../utils/logger';
import { useDatabase } from './DatabaseProvider';
import type { Profile, ProfileVariable, CreateProfileInput, UpdateProfileInput } from '../schema';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/**
 * ProfileContextの型定義
 */
export interface ProfileContextValue {
  /** プロファイル一覧（無効なものも含む。管理画面のように無効を明示する画面で使用する） */
  profiles: Profile[];
  /** 有効なプロファイル一覧（切替・選択・展開など通常利用の選択肢はこちらを使用する） */
  validProfiles: Profile[];
  /** プロファイル変数一覧 */
  profileVariables: ProfileVariable[];
  /** アクティブなプロファイル */
  activeProfile: Profile | null;
  /** デフォルトプロファイル */
  defaultProfile: Profile | null;
  /** データ読み込み中フラグ */
  loading: boolean;
  /** エラー情報 */
  error: Error | null;
  /** データ再読み込み */
  refresh: () => void;
  /** プロファイル作成 */
  createProfile: (input: CreateProfileInput) => Profile;
  /** プロファイル更新 */
  updateProfile: (id: string, data: UpdateProfileInput) => Profile;
  /** プロファイル削除 */
  deleteProfile: (id: string) => void;
  /** アクティブプロファイルを設定 */
  setActiveProfile: (id: string) => void;
  /** 変数値を一括設定 */
  setVariableValuesForVariable: (
    variableId: string,
    values: { profileId: string; variableId: string; value: string }[]
  ) => void;
}

/**
 * ProfileProviderのProps
 */
interface ProfileProviderProps {
  /** 子コンポーネント */
  children: ReactNode;
}

/* ======================================== */
/* Context */
/* ======================================== */

const ProfileContext = createContext<ProfileContextValue | null>(null);

/* ======================================== */
/* Provider */
/* ======================================== */

/**
 * プロファイル管理Provider
 *
 * @param props - ProfileProviderProps
 */
export function ProfileProvider({ children }: ProfileProviderProps) {
  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileVariables, setProfileVariables] = useState<ProfileVariable[]>([]);
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [defaultProfile, setDefaultProfileState] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /* データベース初期化状態（DatabaseProviderが必須） */
  const { isLoaded: isDatabaseLoaded } = useDatabase();

  /* ======================================== */
  /* データ読み込み */
  /* ======================================== */
  const loadProfiles = useCallback(() => {
    try {
      setLoading(true);
      Logger.info('[ProfileProvider] loadProfiles called');

      const allProfiles = ProfileService.getAllIncludingInvalid();
      Logger.info('[ProfileProvider] Loaded profiles count:', allProfiles.length);
      setProfiles(allProfiles);

      const allVars = ProfileService.getAllProfileVariables();
      Logger.info('[ProfileProvider] Loaded profile variables count:', allVars.length);
      setProfileVariables(allVars);

      const defaultProf = ProfileService.getDefault();
      Logger.info('[ProfileProvider] Default profile:', defaultProf?.name ?? 'none');
      setDefaultProfileState(defaultProf);

      let active = ProfileService.getActive();
      Logger.info('[ProfileProvider] Active profile:', active?.name ?? 'none');

      /* アクティブなプロファイルがない場合、デフォルトプロファイルを自動的にアクティブに設定 */
      if (!active && defaultProf) {
        ProfileService.setActive(defaultProf.id);
        active = defaultProf;
        Logger.info('[ProfileProvider] Auto-activated default profile:', defaultProf.id);
      }

      setActiveProfileState(active);
      setError(null);
    } catch (err) {
      Logger.error('[ProfileProvider] Failed to load profiles:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  /* データベースが初期化された後にデータを読み込む */
  useEffect(() => {
    if (!isDatabaseLoaded) return;
    loadProfiles();
  }, [loadProfiles, isDatabaseLoaded]);

  /* ======================================== */
  /* CRUD操作 */
  /* ======================================== */

  /**
   * プロファイル作成
   */
  const createProfile = useCallback(
    (input: CreateProfileInput): Profile => {
      const profile = ProfileService.create(input);
      loadProfiles();
      return profile;
    },
    [loadProfiles]
  );

  /**
   * プロファイル更新
   */
  const updateProfile = useCallback(
    (id: string, data: UpdateProfileInput): Profile => {
      const profile = ProfileService.update(id, data);
      loadProfiles();
      return profile;
    },
    [loadProfiles]
  );

  /**
   * プロファイル削除
   */
  const deleteProfile = useCallback(
    (id: string): void => {
      ProfileService.delete(id);
      /* 削除後にvalidフラグを即時更新（無効→有効への昇格に対応） */
      SubscriptionService.updateValidFlags();
      loadProfiles();
    },
    [loadProfiles]
  );

  /**
   * アクティブプロファイルを設定
   */
  const setActiveProfile = useCallback(
    (id: string): void => {
      ProfileService.setActive(id);
      loadProfiles();
    },
    [loadProfiles]
  );

  /**
   * 変数の全プロファイル値を一括設定
   */
  const setVariableValuesForVariable = useCallback(
    (variableId: string, values: { profileId: string; variableId: string; value: string }[]): void => {
      ProfileService.setVariableValuesForVariable(variableId, values);
      loadProfiles();
    },
    [loadProfiles]
  );

  /**
   * 有効なプロファイル一覧
   *
   * プラン上限を超えて無効になったプロファイルは、通常利用の選択肢・展開対象から
   * 除外する。無効なものを明示的に扱う画面（プロファイル管理）だけがprofilesを使う。
   */
  const validProfiles = useMemo(() => profiles.filter((profile) => profile.valid), [profiles]);

  /* ======================================== */
  /* Context Value */
  /* ======================================== */
  const value = useMemo<ProfileContextValue>(
    () => ({
      profiles,
      validProfiles,
      profileVariables,
      activeProfile,
      defaultProfile,
      loading,
      error,
      refresh: loadProfiles,
      createProfile,
      updateProfile,
      deleteProfile,
      setActiveProfile,
      setVariableValuesForVariable,
    }),
    [
      profiles,
      validProfiles,
      profileVariables,
      activeProfile,
      defaultProfile,
      loading,
      error,
      loadProfiles,
      createProfile,
      updateProfile,
      deleteProfile,
      setActiveProfile,
      setVariableValuesForVariable,
    ]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

/* ======================================== */
/* Hook */
/* ======================================== */

/**
 * プロファイル状態を取得するフック
 *
 * @returns プロファイル状態とアクション
 * @throws Provider外で使用された場合にエラー
 */
export function useProfiles(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfiles must be used within ProfileProvider');
  }
  return context;
}
