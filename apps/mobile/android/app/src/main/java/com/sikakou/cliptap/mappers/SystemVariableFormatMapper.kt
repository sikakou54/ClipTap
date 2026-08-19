package com.sikakou.cliptap.mappers

import android.content.Context

class SystemVariableFormatMapper private constructor(context: Context) : BaseMapper(context) {
    companion object {
        @Volatile
        private var instance: SystemVariableFormatMapper? = null

        fun getInstance(context: Context): SystemVariableFormatMapper = instance ?: synchronized(this) {
            instance ?: SystemVariableFormatMapper(context.applicationContext).also { instance = it }
        }

        private val validPatterns = mapOf(
            "today" to setOf(
                "yyyy/MM/dd", "yyyy/M/d", "yy/MM/dd", "yy/M/d",
                "yyyy-MM-dd", "yyyy-M-d", "yy-MM-dd", "yy-M-d",
                "yyyy.MM.dd", "yyyy.M.d", "yy.MM.dd", "yy.M.d",
                "yyyy年MM月dd日", "yyyy年M月d日", "yy年MM月dd日", "yy年M月d日",
                "MM/dd", "M/d", "MM-dd", "M-d", "MM.dd", "M.d", "MM月dd日", "M月d日",
                "MM/dd/yyyy", "M/d/yyyy", "MM/dd/yy", "M/d/yy",
                "dd/MM/yyyy", "d/M/yyyy", "dd/MM/yy", "d/M/yy", "yyyyMMdd", "yyMMdd"
            ),
            "now" to setOf(
                "yyyy/MM/dd HH:mm:ss", "yyyy/MM/dd HH:mm", "yyyy/M/d H:mm:ss", "yyyy/M/d H:mm",
                "yy/MM/dd HH:mm:ss", "yy/MM/dd HH:mm", "yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd HH:mm",
                "yyyy-M-d H:mm:ss", "yyyy-M-d H:mm", "yy-MM-dd HH:mm:ss", "yy-MM-dd HH:mm",
                "yyyy.MM.dd HH:mm:ss", "yyyy.MM.dd HH:mm", "yyyy.M.d H:mm:ss", "yyyy.M.d H:mm",
                "yyyy年MM月dd日 HH時mm分ss秒", "yyyy年MM月dd日 HH時mm分",
                "yyyy年M月d日 H時mm分ss秒", "yyyy年M月d日 H時mm分",
                "yy年MM月dd日 HH時mm分ss秒", "yy年MM月dd日 HH時mm分",
                "MM/dd/yyyy HH:mm:ss", "MM/dd/yyyy HH:mm", "M/d/yyyy HH:mm:ss", "M/d/yyyy HH:mm",
                "d/M/yyyy HH:mm:ss", "d/M/yyyy HH:mm", "MM/dd HH:mm:ss", "MM/dd HH:mm",
                "M/d HH:mm:ss", "M/d HH:mm", "yyyyMMdd HHmmss", "yyyyMMdd HHmm"
            ),
            "time" to setOf(
                "HH:mm", "HH:mm:ss", "H:mm", "H:mm:ss", "HH時mm分", "HH時mm分ss秒",
                "H時mm分", "H時mm分ss秒", "HHmm", "HHmmss"
            ),
            "year" to setOf("yyyy", "yyyy年", "yy", "yy年"),
            "month" to setOf("MM", "MM月", "M", "M月"),
            "day" to setOf("dd", "dd日", "d", "d日"),
            "weekday" to setOf("EEE", "(EEE)", "EEEE", "(EEEE)")
        )
    }

    fun getAll(): Map<String, String> {
        val existsCursor = executeQuery(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
            arrayOf("system_variable_formats")
        )
        val tableExists = existsCursor.use { it.moveToFirst() }
        if (!tableExists) return emptyMap()

        val formats = mutableMapOf<String, String>()
        val cursor = executeQuery("SELECT variableKey, pattern FROM system_variable_formats")
        cursor.use {
            while (it.moveToNext()) {
                val key = it.getString(0)
                val pattern = it.getString(1)
                if (validPatterns[key]?.contains(pattern) == true) {
                    formats[key] = pattern
                }
            }
        }
        return formats
    }
}
