package com.sikakou.cliptap.mappers

import android.content.Context
import com.sikakou.cliptap.models.Variable
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

        Log.d(TAG, "Loaded ${variablesMap.size} variables for profile: $profileId")
        return variablesMap
    }

    /**
     * 全変数を取得
     */
    fun getAll(): List<Variable> {
        val variables = mutableListOf<Variable>()

        val query = """
            SELECT id, name, type, defaultValue, valid, sortOrder, createdAt, updatedAt
            FROM variables
            WHERE valid = 1
            ORDER BY sortOrder ASC
        """

        val cursor = executeQuery(query)
        cursor.use {
            while (it.moveToNext()) {
                variables.add(
                    Variable(
                        id = it.getString(0),
                        name = it.getString(1),
                        type = it.getString(2),
                        defaultValue = it.getStringOrNull(3),
                        valid = it.getBoolean(4),
                        sortOrder = it.getInt(5),
                        createdAt = it.getString(6),
                        updatedAt = it.getString(7)
                    )
                )
            }
        }

        Log.d(TAG, "Loaded ${variables.size} variables")
        return variables
    }

    /**
     * validフラグを更新（サブスクリプション状態に応じて）
     *
     * 処理内容：
     * 1. すべてのカスタム変数のvalidを0にする
     * 2. 作成日時の古い順にlimit件を有効化（valid=1）
     * 3. システム変数（type='system'）は常に有効
     *
     * @param limit 有効にする最大カスタム変数数
     */
    fun updateValidFlags(limit: Int) {
        Log.d(TAG, "🔄 updateValidFlags called with limit: $limit")

        val db = getDb()

        try {
            db.beginTransaction()

            // 1. すべてのカスタム変数を無効にする（システム変数は除く）
            db.execSQL("UPDATE variables SET valid = 0 WHERE type = 'custom'")
            Log.d(TAG, "✅ Set all custom variables to invalid")

            // 2. システム変数は常に有効
            db.execSQL("UPDATE variables SET valid = 1 WHERE type = 'system'")
            Log.d(TAG, "✅ Set system variables to valid")

            // 3. sortOrder順にlimit件のカスタム変数を有効化
            if (limit > 0) {
                db.execSQL(
                    """
                    UPDATE variables
                    SET valid = 1
                    WHERE id IN (
                        SELECT id FROM variables
                        WHERE type = 'custom'
                        ORDER BY sortOrder ASC
                        LIMIT ?
                    )
                    """,
                    arrayOf(limit)
                )
                Log.d(TAG, "✅ Set $limit custom variables to valid")
            }

            db.setTransactionSuccessful()
            Log.d(TAG, "✅ updateValidFlags completed successfully")

        } catch (e: Exception) {
            Log.e(TAG, "❌ updateValidFlags failed", e)
        } finally {
            db.endTransaction()
        }
    }
}
