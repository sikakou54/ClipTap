package com.sikakou.cliptap.utils

import java.text.SimpleDateFormat
import java.util.*

/**
 * 変数置換ユーティリティ
 * iOS版のVariableReplacer.swiftと同等の機能を提供
 */
class VariableReplacer {

    companion object {
        /**
         * 曜日の表示名（日本語）
         * Calendar.DAY_OF_WEEK は 1=日曜 〜 7=土曜 を返すため、-1 した値をインデックスに使う
         */
        private val JAPANESE_WEEKDAYS = arrayOf("日", "月", "火", "水", "木", "金", "土")

        /**
         * 曜日の表示名（英語）
         */
        private val ENGLISH_WEEKDAYS = arrayOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")

        /**
         * 固定フォーマット文字列の出力に使用するロケール
         *
         * 端末のロケールに左右されないよう Locale.US を使用する。
         * Locale.getDefault() を使うと、アラビア数字以外の数字体系を持つロケールで
         * 「٢٠٢٦/٠٧/٠٩」のような出力になってしまう。
         */
        private val FIXED_FORMAT_LOCALE = Locale.US
    }

    /**
     * テキスト内の変数を置換
     * @param text 置換対象のテキスト
     * @param variablesMap カスタム変数のマップ
     * @return 置換後のテキスト
     */
    fun replace(text: String, variablesMap: Map<String, String> = emptyMap()): String {
        var result = text

        // システム変数の置換
        result = replaceSystemVariables(result)

        // カスタム変数の置換
        variablesMap.forEach { (name, value) ->
            result = result.replace("{{$name}}", value)
        }

        return result
    }

    /**
     * システム変数を置換
     * iOS版と同じ変数名をサポート: today, now, time, year, month, day, weekday
     */
    private fun replaceSystemVariables(text: String): String {
        var result = text
        val now = Date()
        val calendar = Calendar.getInstance()

        // 日付・時刻フォーマット（iOS版と統一）
        // 端末のロケールに左右されないよう、固定パターンには Locale.US を使用する
        val dateFormat = SimpleDateFormat("yyyy/MM/dd", FIXED_FORMAT_LOCALE)
        val timeFormat = SimpleDateFormat("HH:mm", FIXED_FORMAT_LOCALE)
        val nowFormat = SimpleDateFormat("yyyy/MM/dd HH:mm:ss", FIXED_FORMAT_LOCALE)  // iOS: "now"
        val yearFormat = SimpleDateFormat("yyyy", FIXED_FORMAT_LOCALE)
        val monthFormat = SimpleDateFormat("MM", FIXED_FORMAT_LOCALE)
        val dayFormat = SimpleDateFormat("dd", FIXED_FORMAT_LOCALE)

        // システム変数を置換（iOS版と同じ変数名）
        result = result.replace("{{today}}", dateFormat.format(now))
        result = result.replace("{{now}}", nowFormat.format(now))  // iOS互換: datetime → now
        result = result.replace("{{time}}", timeFormat.format(now))
        result = result.replace("{{year}}", yearFormat.format(now))
        result = result.replace("{{month}}", monthFormat.format(now))
        result = result.replace("{{day}}", dayFormat.format(now))

        // 曜日の処理（iOS版と同じ動作）
        // ICUの曜日シンボルではなく固定の配列を使うことで、
        // アプリ本体・Web（packages/shared/src/variables/systemVariables.ts）と
        // 完全に同じ表記になることを保証する
        //
        // 言語判定は拡張キーボード内で唯一の実装であるLocalizationHelper.isJapaneseを使用する
        // （Locale.getDefault()はAPKのリソースロケールで絞り込まれるため使用不可）
        val weekdays = if (LocalizationHelper.isJapanese) {
            JAPANESE_WEEKDAYS
        } else {
            ENGLISH_WEEKDAYS
        }
        // Calendar.DAY_OF_WEEK は 1=日曜 を返すため、0始まりに変換する
        val weekday = weekdays[calendar.get(Calendar.DAY_OF_WEEK) - 1]
        result = result.replace("{{weekday}}", weekday)

        // 後方互換性: 古い変数名もサポート
        result = result.replace("{{datetime}}", nowFormat.format(now))

        return result
    }
}
