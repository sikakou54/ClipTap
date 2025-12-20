package com.sikakou.cliptap.utils

import java.text.SimpleDateFormat
import java.util.*

/**
 * 変数置換ユーティリティ
 * iOS版のVariableReplacer.swiftと同等の機能を提供
 */
class VariableReplacer {

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
        val dateFormat = SimpleDateFormat("yyyy/MM/dd", Locale.getDefault())
        val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
        val nowFormat = SimpleDateFormat("yyyy/MM/dd HH:mm:ss", Locale.getDefault())  // iOS: "now"
        val yearFormat = SimpleDateFormat("yyyy", Locale.getDefault())
        val monthFormat = SimpleDateFormat("MM", Locale.getDefault())
        val dayFormat = SimpleDateFormat("dd", Locale.getDefault())
        val weekdayFormat = SimpleDateFormat("E", Locale.getDefault())  // iOS: "weekday"

        // システム変数を置換（iOS版と同じ変数名）
        result = result.replace("{{today}}", dateFormat.format(now))
        result = result.replace("{{now}}", nowFormat.format(now))  // iOS互換: datetime → now
        result = result.replace("{{time}}", timeFormat.format(now))
        result = result.replace("{{year}}", yearFormat.format(now))
        result = result.replace("{{month}}", monthFormat.format(now))
        result = result.replace("{{day}}", dayFormat.format(now))

        // 曜日の処理（iOS版と同じ動作）
        val weekdayStr = weekdayFormat.format(now)
        val weekday = if (Locale.getDefault().language == "ja") {
            // 日本語: 最初の1文字だけ取得（「月曜日」→「月」）
            weekdayStr.take(1)
        } else {
            // 英語など: そのまま使用（"Mon"など）
            weekdayStr
        }
        result = result.replace("{{weekday}}", weekday)

        // 後方互換性: 古い変数名もサポート
        result = result.replace("{{datetime}}", nowFormat.format(now))

        return result
    }
}
