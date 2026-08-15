/**
 * サブスクリプション画面で扱うプラン種別
 *
 * @description
 * PurchaseService が RevenueCat の productIdentifier を 'monthly' / 'annual' へ正規化しているため、
 * モバイルの画面はこの2値と「未確定」を表す null だけを扱う。
 *
 * @module subscription
 */

/** 現在のプラン種別（未加入・未確定は null） */
export type CurrentPlanType = 'monthly' | 'annual' | null;

/**
 * SubscriptionStatus.activePlanId をプラン種別へ変換する
 *
 * @param activePlanId - サブスクリプション状態が持つプラン識別子
 * @returns 既知のプラン種別。想定外の識別子はプラン未確定として null に落とす
 *
 * @remarks
 * activePlanId の型は string | null のため、キャストでは想定外の識別子を弾けない。
 * 画面側（ペイウォールのハイライト・契約管理のバッジ）は null を「プラン未確定」として
 * 既に正しく扱うため、未知の値は null へ倒して黙って壊れないようにする。
 */
export function toCurrentPlanType(activePlanId: string | null | undefined): CurrentPlanType {
  return activePlanId === 'monthly' || activePlanId === 'annual' ? activePlanId : null;
}
