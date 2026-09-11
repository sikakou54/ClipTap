/**
 * 起動時App Open広告フック
 *
 * @description
 * 無料プランの利用者に対して、アプリのコールドスタート時に一度だけ
 * AdMobのApp Open広告（アプリの起動画面を収益化するための全画面フォーマット）を表示する。
 *
 * 【インタースティシャルではなくApp Open広告を使う理由】
 * Googleはアプリ起動時の全画面表示専用にApp Open広告を用意しており、
 * インタースティシャルを起動時に出すことは「許可されていない実装」としてポリシーで禁じている。
 * 起動時に表示してよい全画面広告はApp Open広告だけであり、両者を入れ替えてはならない。
 *
 * 【表示条件（すべて満たしたときだけ表示する）】
 * 1. 無料プランであることが確定している（未確定・権利確認失敗の間は表示しない）
 * 2. このプロセスでまだ一度も表示を試みていない（＝コールドスタート直後の1回だけ）
 * 3. 前回の表示から COOLDOWN_MS 以上経過している
 * 4. 上限時間内に広告のロードが完了した
 *
 * 【起動を止めない】
 * 判定・初期化・ロード・表示のどこで失敗しても、必ず settle() を通って onSettled を呼ぶ。
 * 外部サービスの失敗でローカル業務機能を止めないという方針に従う。
 *
 * @see docs/機能仕様書.md
 * @module useAppOpenAd
 */

import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mobileAds, { AppOpenAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { Logger, useSharedSubscription } from '@cliptap/shared';
import { useTracking } from '@hooks/useTracking';

/* ========================================
   定数定義
   ======================================== */

/**
 * 本番のApp Open広告ユニットID（プラットフォーム別）
 *
 * AdMob管理画面で広告フォーマット「アプリ起動」として作成したユニットIDを設定する。
 * バナー用のユニットID（AdBanner.tsx）は流用できない。フォーマットが違うと配信されない。
 * 未設定のまま本番ビルドへ入ると広告は表示されず、代わりにエラーログを出して起動を続行する。
 */
const AD_UNIT_IDS = {
  ios: '',
  android: '',
};

/**
 * 前回表示からこの時間が経過するまでは再表示しない
 *
 * 短時間に何度も起動し直す使い方で毎回全画面広告が出ると体験が壊れるため、
 * コールドスタート限定であることに加えて時間でも間隔を空ける。
 */
const COOLDOWN_MS = 4 * 60 * 60 * 1000;

/**
 * 起動を保留してよい上限時間
 *
 * 加入状態の確定・SDK初期化・広告ロードの合計がこの時間を超えたら広告を諦めて起動を進める。
 * スプラッシュ自体が保持1000ms＋フェード500msを持つため、体感で増える待ち時間は最大でも
 * この値からその1500msを引いた分に収まる。
 */
const SETTLE_TIMEOUT_MS = 3000;

/** 最終表示時刻（エポックミリ秒）の保存キー */
const LAST_SHOWN_AT_KEY = '@app_open_ad_last_shown_at';

/* ========================================
   プロセス単位の状態
   ======================================== */

/**
 * このプロセスで表示判定を開始したか
 *
 * JSコンテキストはコールドスタートでのみ作り直されるため、このモジュール変数が
 * そのまま「コールドスタート時のみ」という条件になる。バックグラウンドからの復帰では
 * モジュールが再評価されないので、復帰時に広告が出ることはない。
 */
let hasStartedThisProcess = false;

/**
 * 生成済みのAppOpenAdインスタンス
 *
 * createForAdRequest はインスタンスごとにネイティブイベントの購読を張るが、
 * それを解除するAPIがJS側に無い（removeAllListeners が消すのはJS側のリスナーだけ）。
 * 作り直すたびに購読が積み上がるため、プロセス内で1つだけ作って使い回す。
 */
let adInstance: AppOpenAd | null = null;

/* ========================================
   型定義
   ======================================== */

/** useAppOpenAd の引数 */
export interface UseAppOpenAdParams {
  /**
   * 表示判定が決着したときに呼ばれる
   *
   * 「表示した」「表示しないと決めた」「諦めた」のいずれでも必ず1回呼ばれる。
   * 呼び出し側はこれを合図にスプラッシュの保持を解除する。
   */
  onSettled: () => void;
}

/* ========================================
   フック実装
   ======================================== */

/**
 * 起動時のApp Open広告を表示するフック
 *
 * SubscriptionProviderの内側で使うこと。加入状態が確定するまで待つ必要があるため、
 * Providerの外側からは正しく判定できない。
 *
 * @param params - UseAppOpenAdParams
 */
export function useAppOpenAd({ onSettled }: UseAppOpenAdParams): void {
  const { isLoading, isSubscribed, verificationFailed, shouldShowAds } = useSharedSubscription();
  const { getTrackingStatus } = useTracking();

  /**
   * このマウントで onSettled を呼んだか
   *
   * プロセス単位ではなくマウント単位で持つ。プロセス単位にすると、万一このフックが
   * 貼り直されたときに「判定済みだから何もしない」と「保留が解除されない」が同時に成立し、
   * スプラッシュが永久に残る。
   */
  const hasSettledRef = useRef(false);

  /**
   * 表示判定の決着
   *
   * どの経路から来ても、このマウントでは1回しか onSettled を呼ばない。
   */
  const settle = useCallback(
    (reason: string) => {
      if (hasSettledRef.current) return;
      hasSettledRef.current = true;
      Logger.debug(`[useAppOpenAd] Settled: ${reason}`);
      onSettled();
    },
    [onSettled]
  );

  /**
   * 上限時間の打ち切り
   *
   * 加入状態が永久に確定しない、SDK初期化が返ってこない、といった場合でも
   * 起動が止まらないようにマウント時に1回だけ仕掛ける。
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      settle('Timed out before the ad could be shown');
    }, SETTLE_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [settle]);

  /**
   * 表示判定の開始
   *
   * 加入状態が確定してから1回だけ走る。未確定のまま進めるとPro利用者へ
   * 全画面広告を出す事故につながるため、isLoading の間は必ず待つ。
   */
  useEffect(() => {
    /* 同一プロセスで判定済みならもう出さない。ただし保留は必ず解除する */
    if (hasStartedThisProcess) {
      settle('Already attempted in this process');
      return;
    }

    if (isLoading) return;

    hasStartedThisProcess = true;

    /* Proが確定している、権利確認に失敗して判断できない、のどちらも表示しない。
       バナーと違い全画面広告は誤表示の被害が大きいため、確信が持てないときは出さない側へ倒す */
    if (isSubscribed || verificationFailed || !shouldShowAds()) {
      settle('Not eligible: subscribed, verification failed, or ads disabled');
      return;
    }

    void showAppOpenAd({
      settle,
      /* 上限時間で打ち切られたあとに遅れて表示しないための判定。
         ホームが見えたあとに全画面広告が降ってくるのが最悪の体験になる */
      isSettled: () => hasSettledRef.current,
      getTrackingStatus,
    });
  }, [isLoading, isSubscribed, verificationFailed, shouldShowAds, settle, getTrackingStatus]);
}

/* ========================================
   内部処理
   ======================================== */

/** showAppOpenAd の引数 */
interface ShowAppOpenAdParams {
  /** 表示判定の決着を通知する */
  settle: (reason: string) => void;
  /** すでに決着済みか（上限時間での打ち切りを含む） */
  isSettled: () => boolean;
  /** ATT許可状態を取得する */
  getTrackingStatus: () => Promise<string>;
}

/**
 * クールダウン判定・SDK初期化・ロード・表示をまとめて行う
 *
 * 例外は握りつぶして settle() へ倒す。広告の失敗で起動が止まってはならない。
 *
 * @param params - ShowAppOpenAdParams
 */
async function showAppOpenAd({
  settle,
  isSettled,
  getTrackingStatus,
}: ShowAppOpenAdParams): Promise<void> {
  try {
    /* 広告ユニットIDの決定（開発時はGoogleのテストID） */
    const adUnitId = __DEV__
      ? TestIds.APP_OPEN
      : Platform.select({
          ios: AD_UNIT_IDS.ios,
          android: AD_UNIT_IDS.android,
        });

    if (!adUnitId) {
      /* 静かに無効化されると設定漏れに気付けないため、本番でも残るerrorで知らせる */
      Logger.error('[useAppOpenAd] No App Open ad unit ID configured. Set AD_UNIT_IDS to enable it.');
      settle('No ad unit ID configured');
      return;
    }

    /* クールダウン判定。保存値が壊れていた場合は「未表示」とみなして先へ進む */
    if (await isWithinCooldown()) {
      settle('Within cooldown window');
      return;
    }

    /* ATT許可状態に応じてパーソナライズ広告の可否を決める。
       ATTダイアログ自体は useAdapterInitialization で解決済みのため、ここは確定値の読み出し。
       AndroidにはATTのgranted状態がないため常に非パーソナライズになる（バナーと同じ扱い） */
    const trackingStatus = await getTrackingStatus();

    /* SDKの初期化。広告をロードする前に1回だけ必要で、
       Pro利用者に無駄な外部通信をさせないよう無料プラン確定後のこの位置で呼ぶ */
    await mobileAds().initialize();

    /* ここまでの待ち時間で上限に達していたら、もう表示してはならない */
    if (isSettled()) return;

    const ad = getOrCreateAd(adUnitId, trackingStatus !== 'granted');

    /* すでにロード済みなら待たずに表示する（同一プロセスで再入した場合の保険） */
    if (ad.loaded) {
      presentAd(ad, settle);
      return;
    }

    const unsubscribe = ad.addAdEventsListener(({ type, payload }) => {
      if (type === AdEventType.LOADED) {
        unsubscribe();
        /* ロードが上限時間に間に合わなかった場合。すでにホームが見えているため表示しない */
        if (isSettled()) return;
        presentAd(ad, settle);
        return;
      }

      if (type === AdEventType.ERROR) {
        unsubscribe();
        Logger.error('[useAppOpenAd] Failed to load the App Open ad:', payload);
        settle('Ad failed to load');
      }
    });

    ad.load();
  } catch (error) {
    Logger.error('[useAppOpenAd] Unexpected failure while preparing the App Open ad:', error);
    settle('Unexpected failure');
  }
}

/**
 * AppOpenAdインスタンスを取得する（無ければ生成する）
 *
 * @param adUnitId - 広告ユニットID
 * @param requestNonPersonalizedAdsOnly - 非パーソナライズ広告のみを要求するか
 */
function getOrCreateAd(adUnitId: string, requestNonPersonalizedAdsOnly: boolean): AppOpenAd {
  if (!adInstance) {
    adInstance = AppOpenAd.createForAdRequest(adUnitId, { requestNonPersonalizedAdsOnly });
  }
  return adInstance;
}

/**
 * ロード済みの広告を表示し、最終表示時刻を記録する
 *
 * show() はロード未完了だと同期例外を投げるため、呼び出し前に loaded を確認する。
 * settle() は show() の解決を待たずに呼ぶ。広告はネイティブの全画面表示でスプラッシュより
 * 手前に出るため、裏でスプラッシュのフェードを終わらせておくと閉じた直後にホームが見える。
 *
 * @param ad - 表示するAppOpenAd
 * @param settle - 表示判定の決着を通知する
 */
function presentAd(ad: AppOpenAd, settle: (reason: string) => void): void {
  if (!ad.loaded) {
    settle('Ad reported loaded but is not showable');
    return;
  }

  try {
    const shown = ad.show();
    settle('Shown');

    /* 最終表示時刻は実際に提示できたときだけ記録する。
       提示前に失敗した分までクールダウンに数えると、出せるはずの広告を落としてしまう */
    void shown
      .then(() => recordShownAt())
      .catch((error: unknown) => {
        Logger.error('[useAppOpenAd] Failed to present the App Open ad:', error);
      });
  } catch (error) {
    Logger.error('[useAppOpenAd] show() rejected the App Open ad:', error);
    settle('show() threw');
  }
}

/**
 * 前回表示からクールダウン中かを判定する
 *
 * 読み出しや解析に失敗した場合は false（＝表示してよい）を返す。
 * 記録が無い初回起動と区別できないため、広告を出せる側へ倒すのが自然である。
 */
async function isWithinCooldown(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(LAST_SHOWN_AT_KEY);
    if (!raw) return false;

    const lastShownAt = Number(raw);
    if (!Number.isFinite(lastShownAt)) return false;

    /* 端末時計が巻き戻された場合も差が負になるだけでクールダウンは解ける */
    return Date.now() - lastShownAt < COOLDOWN_MS;
  } catch (error) {
    Logger.error('[useAppOpenAd] Failed to read the last shown timestamp:', error);
    return false;
  }
}

/**
 * 最終表示時刻を記録する
 *
 * 保存に失敗しても広告はすでに表示済みのため、次回のクールダウンが効かなくなるだけで
 * 起動そのものには影響しない。
 */
async function recordShownAt(): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SHOWN_AT_KEY, String(Date.now()));
  } catch (error) {
    Logger.error('[useAppOpenAd] Failed to record the last shown timestamp:', error);
  }
}
