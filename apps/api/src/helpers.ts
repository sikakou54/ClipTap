/**
 * ClipTap API 共通ヘルパー
 *
 * @description
 * Firebase IDトークンの検証と、RevenueCat REST API によるサブスクリプション状態の判定を提供する。
 * RevenueCat Secret API Key は本 Worker 内部でのみ使用し、クライアントへは一切公開しない。
 *
 * @module helpers
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';
import type {
  RevenueCatSubscriberResponse,
  SubscriptionStatusPayload,
} from './types';

/**
 * Firebase 認証用の JWKS（JSON Web Key Set）エンドポイント
 * Google の公開鍵を取得し、Firebase IDトークンの署名を検証する
 * モジュールスコープで生成することで Worker インスタンス内で鍵キャッシュを共有する
 */
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

/**
 * 無料プラン（未契約）を示す既定のサブスクリプション状態
 * RevenueCat への問い合わせが失敗した場合も安全側に倒してこの値を返す
 */
const FREE_STATUS: SubscriptionStatusPayload = {
  isSubscribed: false,
  expirationDate: null,
  activePlanId: null,
  willRenew: false,
  managementURL: null,
};

/**
 * Firebase IDトークンを検証してユーザー情報を取得する
 *
 * @param idToken - クライアントから送信された Firebase IDトークン
 * @param projectId - Firebase プロジェクトID
 * @returns 検証済みのユーザーID
 * @throws 署名・issuer・audience・有効期限のいずれかが不正な場合
 */
export async function verifyFirebaseToken(
  idToken: string,
  projectId: string,
): Promise<{ uid: string }> {
  /* JWKS を使って JWT を検証（issuer と audience をチェック） */
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  /* sub クレームが UID に相当する */
  const uid = payload.sub;
  if (!uid) {
    throw new Error('Token has no subject claim');
  }

  return { uid };
}

/**
 * Entitlement が現時点で有効かどうかを判定する
 *
 * @param expiresDate - 有効期限（ISO8601）。null は無期限購入
 * @returns 有効な場合はtrue
 */
function isEntitlementActive(expiresDate: string | null): boolean {
  /* expires_date が null の場合はライフタイム購入（常にアクティブ） */
  if (expiresDate === null) {
    return true;
  }

  /* 有効期限が未来日時ならアクティブと判定 */
  return new Date(expiresDate).getTime() > Date.now();
}

/**
 * RevenueCat REST API からサブスクリプション状態を取得する
 *
 * @description
 * v1 Subscribers API はストア横断で Entitlement を集約するため、
 * App Store / Google Play で購入された Proプランもこのエンドポイントで判定できる。
 * API エラー時は安全側に倒して無料プランとして扱う。
 *
 * @param uid - Firebase UID（RevenueCat の App User ID）
 * @param apiKey - RevenueCat Secret API Key
 * @param entitlementId - Proプランの Entitlement 識別子
 * @returns サブスクリプション状態
 */
export async function fetchSubscriptionStatus(
  uid: string,
  apiKey: string,
  entitlementId: string,
): Promise<SubscriptionStatusPayload> {
  try {
    /* RevenueCat の Subscribers API を呼び出して顧客情報を取得 */
    const response = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    /* レスポンスが正常でない場合は無料プランにフォールバック */
    if (!response.ok) {
      console.error('RevenueCat API error:', response.status);
      return FREE_STATUS;
    }

    /* Workers の Response.json は型引数で応答型を指定する（as での断言は冗長になる） */
    const data = await response.json<RevenueCatSubscriberResponse>();
    const subscriber = data.subscriber;

    /* 対象の Entitlement を取得（存在しなければ無料プラン） */
    const entitlement = subscriber?.entitlements?.[entitlementId];
    if (!entitlement || !isEntitlementActive(entitlement.expires_date)) {
      return FREE_STATUS;
    }

    /* 権限を付与している商品を特定し、解約検知の有無から自動更新可否を判定 */
    const activePlanId = entitlement.product_identifier ?? null;
    const subscription = activePlanId
      ? subscriber?.subscriptions?.[activePlanId]
      : undefined;
    /* 無期限購入は更新の概念がないため false、解約未検知なら true */
    const willRenew =
      entitlement.expires_date !== null &&
      subscription?.unsubscribe_detected_at == null;

    return {
      isSubscribed: true,
      expirationDate: entitlement.expires_date,
      activePlanId,
      willRenew,
      managementURL: subscriber?.management_url ?? null,
    };
  } catch (error) {
    /* ネットワークエラー等の場合は安全側に倒して無料プランを返す */
    console.error('RevenueCat API fetch failed:', error);
    return FREE_STATUS;
  }
}
