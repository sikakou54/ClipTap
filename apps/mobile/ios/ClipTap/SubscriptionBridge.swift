//
//  SubscriptionBridge.swift
//  ClipTap
//
//  React Native → AppDelegate への橋渡し
//  NotificationCenterを使ってApp Groupにサブスクリプション状態を保存
//

import Foundation
import React

// App Group ID
private let APP_GROUP_ID = "group.com.sikakou.cliptap"

@objc(SubscriptionBridge)
class SubscriptionBridge: NSObject {

    @objc
    func saveSubscriptionStatus(_ isPremium: Bool, expiryDateString: String?) {
        NSLog("[SubscriptionBridge] 🔵 Swift method called: isPremium=\(isPremium), expiryDate=\(expiryDateString ?? "nil")")

        // NotificationCenterで通知を送る
        NotificationCenter.default.post(
            name: NSNotification.Name("SubscriptionStatusUpdated"),
            object: nil,
            userInfo: [
                "isPremium": isPremium,
                "expiryDate": expiryDateString as Any
            ]
        )

        NSLog("[SubscriptionBridge] 📤 Sent notification: isPremium=\(isPremium), expiryDate=\(expiryDateString ?? "nil")")
    }

    /// サブスクリプションデータをクリア（テスト用）
    @objc
    func clearSubscriptionData() {
        guard let defaults = UserDefaults(suiteName: APP_GROUP_ID) else {
            NSLog("[SubscriptionBridge] Failed to access App Group: \(APP_GROUP_ID)")
            return
        }

        defaults.removeObject(forKey: "is_premium_subscriber")
        defaults.removeObject(forKey: "subscription_expiry_date")
        defaults.removeObject(forKey: "subscription_last_updated")
        defaults.synchronize()

        NSLog("[SubscriptionBridge] ✅ Subscription data cleared")
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true  // NotificationCenterはメインスレッドで実行
    }
}
