package com.sikakou.cliptap.utils

import java.util.Date

class VariableReplacer {
    private val variablePattern = Regex("\\{\\{([^}]+)\\}\\}")

    private val aliases = mapOf(
        "today" to "today",
        "今日" to "today",
        "now" to "now",
        "現在" to "now",
        "time" to "time",
        "時刻" to "time",
        "year" to "year",
        "年" to "year",
        "month" to "month",
        "月" to "month",
        "day" to "day",
        "日" to "day",
        "weekday" to "weekday",
        "曜日" to "weekday"
    )

    private val defaultPatterns = mapOf(
        "today" to "yyyy/MM/dd",
        "now" to "yyyy/MM/dd HH:mm:ss",
        "time" to "HH:mm",
        "year" to "yyyy",
        "month" to "MM",
        "day" to "dd",
        "weekday" to "EEE"
    )

    fun replace(
        text: String,
        variablesMap: Map<String, String> = emptyMap(),
        formats: Map<String, String> = emptyMap()
    ): String {
        var result = text
        val date = Date()

        variablePattern.findAll(text).toList().asReversed().forEach { match ->
            val rawName = match.groupValues[1].trim()
            val normalized = if (rawName.all { it.code <= 0x7f }) rawName.lowercase() else rawName
            val systemKey = aliases[normalized]
            val replacement = if (systemKey != null) {
                PatternFormatter.format(
                    date = date,
                    pattern = formats[systemKey] ?: defaultPatterns.getValue(systemKey),
                    isJapanese = LocalizationHelper.isJapanese
                )
            } else {
                variablesMap[rawName]
            }

            if (replacement != null) {
                result = result.replaceRange(match.range, replacement)
            }
        }

        return result
    }
}
