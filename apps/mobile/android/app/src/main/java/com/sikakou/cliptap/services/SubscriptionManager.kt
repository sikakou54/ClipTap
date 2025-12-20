package com.sikakou.cliptap.services

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * サブスクリプション状態の管理
 *
 * 【目的】
 * サブスクリプション（有料機能）の状態管理を行うクラス。
 * SharedPreferencesから最新のサブスクリプション状態を取得します。
 *
 * 【役割】
 * - getSubscriptionStatus(): 有効期限を含めたサブスクリプション状態を取得
 * - isPremiumSubscriber(): Pro版かどうかをチェック
 * - invalidateCache(): キャッシュを無効化
 *
 * 【iOS版との共通実装】
 * iOS版（ios/ClipTapKeyboard/SubscriptionManager.swift）と同じアプローチで、
 * SharedPreferencesから直接最新のサブスクリプション状態を取得します。
 */

/**
 * サブスクリプション状態
 */
enum class SubscriptionStatus {
    ACTIVE,      // アクティブなサブスクリプション
    EXPIRED,     // 有効期限切れ（メインアプリで確認が必要）
    FREE,        // 無料プラン
    NO_DATA      // データなし（アプリ未起動の可能性）
}

class SubscriptionManager private constructor(private val context: Context) {

    companion object {
        private const val TAG = "SubscriptionManager"
        private const val SHARED_PREFS_NAME = "group.com.sikakou.cliptap"
        private const val KEY_IS_PREMIUM = "is_premium_subscriber"
        private const val KEY_EXPIRY_DATE = "subscription_expiry_date"
        private const val KEY_LAST_UPDATED = "subscription_last_updated"

        @Volatile
        private var INSTANCE: SubscriptionManager? = null

        fun getInstance(context: Context): SubscriptionManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: SubscriptionManager(context.applicationContext).also {
                    INSTANCE = it
                }
            }
        }
    }

    private var cachedStatus: Boolean? = null
    private var lastChecked: Long = 0

    /**
     * SharedPreferencesを取得
     */
    private fun getSharedPreferences(): SharedPreferences? {
        return try {
            context.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE)
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to get SharedPreferences", e)
            null
        }
    }

    /**
     * キャッシュを無効化
     */
    fun invalidateCache() {
        cachedStatus = null
        lastChecked = 0
        Log.d(TAG, "Cache invalidated")
    }

    /**
     * Pro版かどうかをチェック
     *
     * SharedPreferencesから直接サブスクリプション状態を取得します。
     * キャッシュは5分有効です。
     *
     * @return Pro版ならtrue、Free版ならfalse
     */
    fun isPremiumSubscriber(): Boolean {
        // キャッシュチェック（5分有効）
        val now = System.currentTimeMillis()
        if (cachedStatus != null && (now - lastChecked) < 300000) {
            Log.d(TAG, "Using cached status: $cachedStatus")
            return cachedStatus!!
        }

        // SharedPreferencesから最新状態を取得
        val isPremium = checkSubscriptionStatus()
        cachedStatus = isPremium
        lastChecked = now

        return isPremium
    }

    /**
     * サブスクリプション状態の詳細を取得
     */
    fun getSubscriptionStatus(): SubscriptionStatus {
        val sharedPrefs = getSharedPreferences()
        if (sharedPrefs == null) {
            Log.e(TAG, "❌ Failed to access SharedPreferences")
            return SubscriptionStatus.NO_DATA
        }

        val lastUpdated = sharedPrefs.getLong(KEY_LAST_UPDATED, 0)

        // データが存在しない場合
        if (lastUpdated == 0L) {
            Log.w(TAG, "⚠️ No subscription data found")
            return SubscriptionStatus.NO_DATA
        }

        val isPremium = sharedPrefs.getBoolean(KEY_IS_PREMIUM, false)
        val expiryDateString = sharedPrefs.getString(KEY_EXPIRY_DATE, null)

        Log.d(TAG, "📖 Read from SharedPreferences: isPremium=$isPremium, expiryDate=$expiryDateString, lastUpdated=$lastUpdated")

        // 無料プランの場合
        if (!isPremium) {
            return SubscriptionStatus.FREE
        }

        // 有効期限チェック
        if (expiryDateString != null) {
            try {
                // ISO8601形式をパース（複数のフォーマットを試行）
                val dateFormats = listOf(
                    SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US),  // ミリ秒あり
                    SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US),      // ミリ秒なし
                    SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'", Locale.US), // マイクロ秒
                    SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ", Locale.US)         // タイムゾーンあり
                )

                var expiryDate: Date? = null
                for (dateFormat in dateFormats) {
                    try {
                        expiryDate = dateFormat.parse(expiryDateString)
                        if (expiryDate != null) break
                    } catch (e: Exception) {
                        // 次のフォーマットを試行
                        continue
                    }
                }

                if (expiryDate != null) {
                    val isExpired = Date().after(expiryDate)
                    if (isExpired) {
                        Log.w(TAG, "⚠️ Subscription expired: $expiryDateString")
                        return SubscriptionStatus.EXPIRED
                    } else {
                        Log.d(TAG, "✅ Subscription active until: $expiryDateString")
                        return SubscriptionStatus.ACTIVE
                    }
                } else {
                    Log.e(TAG, "❌ Failed to parse expiry date with all formats: $expiryDateString")
                }
            } catch (e: Exception) {
                Log.e(TAG, "❌ Failed to parse expiry date: $expiryDateString", e)
            }
        }

        // isPremium=trueだが有効期限がない場合は、念のためアクティブとして扱う
        Log.d(TAG, "✅ Subscription active (no expiry date)")
        return SubscriptionStatus.ACTIVE
    }

    /**
     * SharedPreferencesからサブスクリプション状態を確認
     */
    private fun checkSubscriptionStatus(): Boolean {
        val status = getSubscriptionStatus()
        return status == SubscriptionStatus.ACTIVE
    }
}
