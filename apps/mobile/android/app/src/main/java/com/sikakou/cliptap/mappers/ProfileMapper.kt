package com.sikakou.cliptap.mappers

import android.content.Context
import com.sikakou.cliptap.models.Profile
import android.util.Log

/**
 * プロファイル（環境）のMapper
 * iOS版のProfileMapper.swiftと同等の機能を提供
 */
class ProfileMapper private constructor(context: Context) : BaseMapper(context) {

    companion object {
        private const val TAG = "ProfileMapper"

        @Volatile
        private var INSTANCE: ProfileMapper? = null

        fun getInstance(context: Context): ProfileMapper {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: ProfileMapper(context.applicationContext).also {
                    INSTANCE = it
                }
            }
        }
    }

    /**
     * 全プロファイルを取得（valid=1のみ）
     */
    fun getAll(): List<Profile> {
        val profiles = mutableListOf<Profile>()

        val query = """
            SELECT id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt
            FROM profiles
            WHERE valid = 1
            ORDER BY sortOrder ASC
        """

        val cursor = executeQuery(query)
        cursor.use {
            while (it.moveToNext()) {
                profiles.add(
                    Profile(
                        id = it.getString(0),
                        name = it.getString(1),
                        isActive = it.getBoolean(2),
                        isDefault = it.getBoolean(3),
                        valid = it.getBoolean(4),
                        sortOrder = it.getInt(5),
                        createdAt = it.getString(6),
                        updatedAt = it.getString(7)
                    )
                )
            }
        }

        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "Loaded ${profiles.size} profiles")
        return profiles
    }

    /**
     * IDでプロファイルを取得
     */
    fun getById(id: String): Profile? {
        val query = """
            SELECT id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt
            FROM profiles
            WHERE id = ? AND valid = 1
        """

        val cursor = executeQuery(query, arrayOf(id))
        cursor.use {
            if (it.moveToFirst()) {
                return Profile(
                    id = it.getString(0),
                    name = it.getString(1),
                    isActive = it.getBoolean(2),
                    isDefault = it.getBoolean(3),
                    valid = it.getBoolean(4),
                    sortOrder = it.getInt(5),
                    createdAt = it.getString(6),
                    updatedAt = it.getString(7)
                )
            }
        }

        return null
    }

    /**
     * アクティブなプロファイルを取得
     */
    fun getActive(): Profile? {
        val query = """
            SELECT id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt
            FROM profiles
            WHERE isActive = 1 AND valid = 1
            LIMIT 1
        """

        val cursor = executeQuery(query)
        cursor.use {
            if (it.moveToFirst()) {
                return Profile(
                    id = it.getString(0),
                    name = it.getString(1),
                    isActive = it.getBoolean(2),
                    isDefault = it.getBoolean(3),
                    valid = it.getBoolean(4),
                    sortOrder = it.getInt(5),
                    createdAt = it.getString(6),
                    updatedAt = it.getString(7)
                )
            }
        }

        return null
    }

    /**
     * デフォルトプロファイルを取得
     */
    fun getDefault(): Profile? {
        val query = """
            SELECT id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt
            FROM profiles
            WHERE isDefault = 1
            LIMIT 1
        """

        val cursor = executeQuery(query)
        cursor.use {
            if (it.moveToFirst()) {
                return Profile(
                    id = it.getString(0),
                    name = it.getString(1),
                    isActive = it.getBoolean(2),
                    isDefault = it.getBoolean(3),
                    valid = it.getBoolean(4),
                    sortOrder = it.getInt(5),
                    createdAt = it.getString(6),
                    updatedAt = it.getString(7)
                )
            }
        }

        return null
    }

    /**
     * アクティブなプロファイルを設定
     */
    fun setActive(id: String) {
        val db = getDb()

        // まず全てのプロファイルのisActiveを0にする
        db.execSQL("UPDATE profiles SET isActive = 0")

        // 指定されたプロファイルをアクティブにする
        db.execSQL("UPDATE profiles SET isActive = 1 WHERE id = ?", arrayOf(id))

        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "Set profile $id as active")
    }

}
