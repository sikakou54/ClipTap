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
            "today" to setOf("yyyy/MM/dd", "yyyy-MM-dd", "yyyy年M月d日", "yyyy年MM月dd日", "M/d", "MM/dd", "M/d/yyyy", "yyyy/MM/dd(EEE)", "M月d日(EEE)"),
            "now" to setOf("yyyy/MM/dd HH:mm:ss", "yyyy/MM/dd HH:mm", "yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd HH:mm", "yyyy年M月d日 HH時mm分", "M/d HH:mm"),
            "time" to setOf("HH:mm", "HH:mm:ss", "H:mm", "HH時mm分"),
            "year" to setOf("yyyy", "yy", "yyyy年"),
            "month" to setOf("MM", "M", "M月", "MM月"),
            "day" to setOf("dd", "d", "d日", "dd日"),
            "weekday" to setOf("EEE", "EEEE", "(EEE)")
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
