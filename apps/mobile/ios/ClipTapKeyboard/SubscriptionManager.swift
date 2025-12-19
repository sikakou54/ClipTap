//
//  SubscriptionManager.swift
//  ClipTapKeyboard
//
//  サブスクリプション状態の管理
//  App Group UserDefaultsから読み取り専用でサブスクリプション状態を取得
//

import Foundation

// App Group ID（メインアプリと一致させる）
private let APP_GROUP_ID = "group.com.sikakou.cliptap"

// UserDefaultsキー（メインアプリのAppGroupStorageと一致させる）
private struct Keys {
    static let isPremiumSubscriber = "is_premium_subscriber"
    static let subscriptionExpiryDate = "subscription_expiry_date"
    static let lastUpdated = "subscription_last_updated"
}

// MARK: - Subscription Status Result

enum SubscriptionStatus {
    case active              // アクティブなサブスクリプション
    case expired             // 有効期限切れ（メインアプリで確認が必要）
    case free                // 無料プラン
    case noData              // データなし（アプリ未起動の可能性）
}

// MARK: - Subscription Limits

struct SubscriptionLimits {
    static let freeMaxSnippets = 10
    static let freeMaxVariables = 5
    static let freeMaxProfiles = 3  // アプリ側のFREE_PROFILES_LIMITと一致させる
}

// MARK: - Subscription Manager

class SubscriptionManager {

    static let shared = SubscriptionManager()

    private var cachedStatus: Bool?
    private var lastChecked: Date?

    private init() {}

    /// App Group UserDefaultsを取得
    private func getAppGroupUserDefaults() -> UserDefaults? {
        guard let defaults = UserDefaults(suiteName: APP_GROUP_ID) else {
            print("[SubscriptionManager] ❌ Failed to create UserDefaults with suite name: \(APP_GROUP_ID)")
            return nil
        }

        // 明示的にデフォルトを登録（キーが存在しない場合の初期値）
        defaults.register(defaults: [
            Keys.isPremiumSubscriber: false,
            Keys.lastUpdated: 0.0
        ])

        return defaults
    }

    /// プレミアムサブスクリプション状態を取得
    ///
    /// App Group UserDefaultsから読み取ります
    /// キャッシュは5分間有効です
    func isPremiumSubscriber() -> Bool {
        // キャッシュチェック（5分有効）
        if let lastChecked = lastChecked,
           let cachedStatus = cachedStatus,
           Date().timeIntervalSince(lastChecked) < 300 {
            print("[SubscriptionManager] Using cached status: \(cachedStatus)")
            return cachedStatus
        }

        // App Groupから最新状態を取得
        let isPremium = checkSubscriptionStatus()
        cachedStatus = isPremium
        lastChecked = Date()

        return isPremium
    }

    /// キャッシュを無効化
    func invalidateCache() {
        cachedStatus = nil
        lastChecked = nil
        print("[SubscriptionManager] Cache invalidated")
    }

    /// サブスクリプション状態の詳細を取得
    func getSubscriptionStatus() -> SubscriptionStatus {
        guard let defaults = getAppGroupUserDefaults() else {
            print("[SubscriptionManager] ❌ Failed to access App Group UserDefaults")
            return .noData
        }

        let lastUpdated = defaults.double(forKey: Keys.lastUpdated)

        // データが存在しない場合
        if lastUpdated == 0 {
            print("[SubscriptionManager] ⚠️ No subscription data found")
            return .noData
        }

        let isPremium = defaults.bool(forKey: Keys.isPremiumSubscriber)
        let expiryDateString = defaults.string(forKey: Keys.subscriptionExpiryDate)

        print("[SubscriptionManager] 📖 Read from App Group: isPremium=\(isPremium), expiryDate=\(expiryDateString ?? "nil"), lastUpdated=\(lastUpdated)")

        // 無料プランの場合
        if !isPremium {
            return .free
        }

        // 有効期限チェック
        if let expiryDateString = expiryDateString {
            let dateFormatter = ISO8601DateFormatter()

            // ISO8601の複数のフォーマットオプションを試行
            dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

            var expiryDate = dateFormatter.date(from: expiryDateString)

            // フラクショナル秒なしでも試行
            if expiryDate == nil {
                dateFormatter.formatOptions = [.withInternetDateTime]
                expiryDate = dateFormatter.date(from: expiryDateString)
            }

            if let expiryDate = expiryDate {
                let isExpired = Date() > expiryDate
                let now = Date()
                print("[SubscriptionManager] 📅 Current time: \(now)")
                print("[SubscriptionManager] 📅 Expiry date: \(expiryDate)")
                print("[SubscriptionManager] 📅 Time difference: \(now.timeIntervalSince(expiryDate)) seconds")

                if isExpired {
                    print("[SubscriptionManager] ⚠️ Subscription expired: \(expiryDateString)")
                    return .expired
                } else {
                    print("[SubscriptionManager] ✅ Subscription active until: \(expiryDateString)")
                    return .active
                }
            } else {
                print("[SubscriptionManager] ❌ Failed to parse expiry date: \(expiryDateString)")
            }
        }

        // isPremium=trueだが有効期限がない場合は、念のためアクティブとして扱う
        print("[SubscriptionManager] ✅ Subscription active (no expiry date)")
        return .active
    }

    /// App Groupからサブスクリプション状態を確認
    private func checkSubscriptionStatus() -> Bool {
        let status = getSubscriptionStatus()
        return status == .active
    }
}
