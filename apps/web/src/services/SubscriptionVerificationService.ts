/** ログイン中の利用者にだけ権利確認失敗を通知する。 */
export function shouldShowSubscriptionVerificationWarning(
  isAuthenticated: boolean,
  verificationFailed: boolean,
): boolean {
  return isAuthenticated && verificationFailed;
}
