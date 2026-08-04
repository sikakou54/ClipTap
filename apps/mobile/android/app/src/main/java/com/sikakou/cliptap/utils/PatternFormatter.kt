package com.sikakou.cliptap.utils

import java.util.Calendar
import java.util.Date
import java.util.GregorianCalendar
import java.util.Locale

object PatternFormatter {
    private val japaneseWeekdaysShort = arrayOf("日", "月", "火", "水", "木", "金", "土")
    private val englishWeekdaysShort = arrayOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")
    private val japaneseWeekdaysLong = arrayOf("日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日")
    private val englishWeekdaysLong = arrayOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
    private val tokens = listOf("yyyy", "EEEE", "EEE", "yy", "MM", "dd", "HH", "mm", "ss", "M", "d", "H")

    fun format(date: Date, pattern: String, isJapanese: Boolean): String {
        val calendar = GregorianCalendar().apply { time = date }
        val year = calendar.get(Calendar.YEAR)
        val weekdayIndex = calendar.get(Calendar.DAY_OF_WEEK) - 1
        val shortWeekdays = if (isJapanese) japaneseWeekdaysShort else englishWeekdaysShort
        val longWeekdays = if (isJapanese) japaneseWeekdaysLong else englishWeekdaysLong
        val values = mapOf(
            "yyyy" to String.format(Locale.US, "%04d", year),
            "yy" to String.format(Locale.US, "%02d", year % 100),
            "MM" to String.format(Locale.US, "%02d", calendar.get(Calendar.MONTH) + 1),
            "M" to (calendar.get(Calendar.MONTH) + 1).toString(),
            "dd" to String.format(Locale.US, "%02d", calendar.get(Calendar.DAY_OF_MONTH)),
            "d" to calendar.get(Calendar.DAY_OF_MONTH).toString(),
            "HH" to String.format(Locale.US, "%02d", calendar.get(Calendar.HOUR_OF_DAY)),
            "H" to calendar.get(Calendar.HOUR_OF_DAY).toString(),
            "mm" to String.format(Locale.US, "%02d", calendar.get(Calendar.MINUTE)),
            "ss" to String.format(Locale.US, "%02d", calendar.get(Calendar.SECOND)),
            "EEE" to shortWeekdays[weekdayIndex],
            "EEEE" to longWeekdays[weekdayIndex]
        )

        val output = StringBuilder()
        var index = 0
        while (index < pattern.length) {
            val token = tokens.firstOrNull { pattern.startsWith(it, index) }
            if (token != null) {
                output.append(values[token] ?: token)
                index += token.length
            } else {
                output.append(pattern[index])
                index += 1
            }
        }
        return output.toString()
    }
}
