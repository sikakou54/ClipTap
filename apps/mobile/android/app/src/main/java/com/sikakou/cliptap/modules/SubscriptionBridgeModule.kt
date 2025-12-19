package com.sikakou.cliptap.modules

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * SubscriptionBridgeModule
 *
 * React NativeからサブスクリプションステータスをSharedPreferencesに保存するネイティブモジュール
 * iOS版のSubscriptionBridge.swiftと同じ役割を果たします
 */
class SubscriptionBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "SubscriptionBridge"
        private const val SHARED_PREFS_NAME = "group.com.sikakou.cliptap"
        private const val KEY_IS_PREMIUM = "is_premium_subscriber"
        private const val KEY_EXPIRY_DATE = "subscription_expiry_date"
        private const val KEY_LAST_UPDATED = "subscription_last_updated"
    }

    override fun getName(): String {
        return "SubscriptionBridge"
    }

    /**
     * サブスクリプションステータスをSharedPreferencesに保存
     *
     * @param isPremium Pro版かどうか
     * @param expiryDateString 有効期限（ISO8601形式）
     */
    @ReactMethod
    fun saveSubscriptionStatus(isPremium: Boolean, expiryDateString: String?) {
        try {
            val sharedPrefs = reactApplicationContext.getSharedPreferences(
                SHARED_PREFS_NAME,
                Context.MODE_PRIVATE
            )

            val editor = sharedPrefs.edit()
            editor.putBoolean(KEY_IS_PREMIUM, isPremium)
            editor.putString(KEY_EXPIRY_DATE, expiryDateString)
            editor.putLong(KEY_LAST_UPDATED, System.currentTimeMillis())
            editor.apply()

            Log.d(TAG, "📤 Saved subscription status: isPremium=$isPremium, expiryDate=$expiryDateString")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to save subscription status", e)
        }
    }

    /**
     * サブスクリプションデータをクリア（テスト用）
     */
    @ReactMethod
    fun clearSubscriptionData() {
        try {
            val sharedPrefs = reactApplicationContext.getSharedPreferences(
                SHARED_PREFS_NAME,
                Context.MODE_PRIVATE
            )

            val editor = sharedPrefs.edit()
            editor.remove(KEY_IS_PREMIUM)
            editor.remove(KEY_EXPIRY_DATE)
            editor.remove(KEY_LAST_UPDATED)
            editor.apply()

            Log.d(TAG, "✅ Subscription data cleared")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to clear subscription data", e)
        }
    }
}
