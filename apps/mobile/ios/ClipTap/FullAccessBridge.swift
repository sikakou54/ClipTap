//
//  FullAccessBridge.swift
//  ClipTap
//
//  キーボード拡張のフルアクセス状態をReact Nativeから取得するブリッジ。
//  キーボード拡張がApp Group UserDefaultsに保存したフルアクセス状態を読み取る。
//

import Foundation
import React

@objc(FullAccessBridge)
class FullAccessBridge: NSObject {

    // MARK: - Properties

    private let appGroupIdentifier = "group.com.sikakou.cliptap"
    private let fullAccessStateKey = "keyboardHasFullAccess"
    private let usageTrackingKey = "usageTrackingEnabled"
    private let usageTrackingEnabledSetKey = "usageTrackingEnabledSet"

    // MARK: - React Native Bridge Methods

    /**
     * キーボード拡張のフルアクセス状態を取得
     * キーボード拡張が一度も起動されていない場合はfalseを返す
     */
    @objc
    func getKeyboardFullAccessStatus(_ resolve: @escaping RCTPromiseResolveBlock,
                                      reject: @escaping RCTPromiseRejectBlock) {
        guard let userDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
            NSLog("⚠️ [FullAccessBridge] Failed to get App Group UserDefaults")
            resolve(false)
            return
        }

        let hasFullAccess = userDefaults.bool(forKey: fullAccessStateKey)
        NSLog("📤 [FullAccessBridge] Retrieved full access status: %@", hasFullAccess ? "true" : "false")
        resolve(hasFullAccess)
    }

    /**
     * 使用頻度追跡が有効かどうかを取得
     * フルアクセス許可かつ使用頻度追跡設定がONの場合にtrueを返す
     */
    @objc
    func isUsageTrackingEnabled(_ resolve: @escaping RCTPromiseResolveBlock,
                                 reject: @escaping RCTPromiseRejectBlock) {
        guard let userDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
            NSLog("⚠️ [FullAccessBridge] Failed to get App Group UserDefaults")
            resolve(false)
            return
        }

        let hasFullAccess = userDefaults.bool(forKey: fullAccessStateKey)

        /* フルアクセスがない場合はfalse */
        if !hasFullAccess {
            NSLog("📤 [FullAccessBridge] Usage tracking disabled (no full access)")
            resolve(false)
            return
        }

        let usageEnabledSet = userDefaults.bool(forKey: usageTrackingEnabledSetKey)

        /* 設定されていない場合はデフォルトtrue */
        if !usageEnabledSet {
            NSLog("📤 [FullAccessBridge] Usage tracking enabled (default)")
            resolve(true)
            return
        }

        let usageEnabled = userDefaults.bool(forKey: usageTrackingKey)
        NSLog("📤 [FullAccessBridge] Usage tracking: %@", usageEnabled ? "enabled" : "disabled")
        resolve(usageEnabled)
    }

    // MARK: - React Native Requirements

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
