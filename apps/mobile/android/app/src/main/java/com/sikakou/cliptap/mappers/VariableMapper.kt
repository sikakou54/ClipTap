package com.sikakou.cliptap.mappers

import android.content.Context
import android.util.Log

/**
 * 変数のMapper
 * iOS版のVariableMapper.swiftと同等の機能を提供
 */
class VariableMapper private constructor(context: Context) : BaseMapper(context) {

    companion object {
        private const val TAG = "VariableMapper"

        @Volatile
        private var INSTANCE: VariableMapper? = null

        fun getInstance(context: Context): VariableMapper {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: VariableMapper(context.applicationContext).also {
                    INSTANCE = it
                }
            }
        }
    }

    /**
     * プロファイルIDに紐づく変数マップを取得
     */
    fun getVariablesMap(profileId: String): Map<String, String> {
        val variablesMap = mutableMapOf<String, String>()

        val query = """
            SELECT pv.value, v.name
            FROM profile_variables pv
            INNER JOIN variables v ON pv.variableId = v.id
            WHERE pv.profileId = ? AND v.type = 'custom' AND v.valid = 1
            ORDER BY v.sortOrder ASC
        """

        val cursor = executeQuery(query, arrayOf(profileId))
        cursor.use {
            while (it.moveToNext()) {
                val value = it.getString(0)
                val name = it.getString(1)
                variablesMap[name] = value
            }
        }

        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "Loaded ${variablesMap.size} variables for profile: $profileId")
        return variablesMap
    }

}
