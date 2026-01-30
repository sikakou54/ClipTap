package com.sikakou.cliptap.mappers

import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import com.sikakou.cliptap.database.Database

/**
 * Mapper基底クラス
 * iOS版のBaseMapper.swiftと同等の機能を提供
 */
abstract class BaseMapper(protected val context: Context) {

    protected val database: Database by lazy {
        Database.getInstance(context)
    }

    /**
     * データベースインスタンスを取得
     */
    protected fun getDb(): SQLiteDatabase {
        if (!database.isOpen()) {
            database.initialize()
        }
        return database.getDatabase()
    }

    /**
     * クエリを実行してCursorを返す
     */
    protected fun executeQuery(query: String, args: Array<String>? = null): Cursor {
        return getDb().rawQuery(query, args)
    }

    /**
     * 更新クエリを実行（INSERT/UPDATE/DELETE用）
     */
    protected fun executeUpdate(query: String, args: Array<String>? = null) {
        getDb().execSQL(query, args ?: emptyArray())
    }

    /**
     * Cursorから文字列を取得（null許容）
     */
    protected fun Cursor.getStringOrNull(columnIndex: Int): String? {
        return if (isNull(columnIndex)) null else getString(columnIndex)
    }

    /**
     * Cursorからbooleanを取得
     */
    protected fun Cursor.getBoolean(columnIndex: Int): Boolean {
        return getInt(columnIndex) == 1
    }
}
