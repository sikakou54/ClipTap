package com.sikakou.cliptap.mappers

import android.content.Context
import com.sikakou.cliptap.models.Category
import android.util.Log

/**
 * カテゴリのMapper
 * iOS版のCategoryMapper.swiftと同等の機能を提供
 */
class CategoryMapper private constructor(context: Context) : BaseMapper(context) {

    companion object {
        private const val TAG = "CategoryMapper"

        @Volatile
        private var INSTANCE: CategoryMapper? = null

        fun getInstance(context: Context): CategoryMapper {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: CategoryMapper(context.applicationContext).also {
                    INSTANCE = it
                }
            }
        }
    }

    /**
     * 全カテゴリを取得
     */
    fun getAll(): List<Category> {
        val categories = mutableListOf<Category>()

        val query = """
            SELECT id, name, color, sortOrder, createdAt
            FROM categories
            ORDER BY sortOrder ASC
        """

        val cursor = executeQuery(query)
        cursor.use {
            while (it.moveToNext()) {
                categories.add(
                    Category(
                        id = it.getString(0),
                        name = it.getString(1),
                        color = it.getStringOrNull(2),
                        sortOrder = it.getInt(3),
                        createdAt = it.getString(4)
                    )
                )
            }
        }

        Log.d(TAG, "Loaded ${categories.size} categories")
        return categories
    }

    /**
     * IDでカテゴリを取得
     */
    fun getById(id: String): Category? {
        val query = """
            SELECT id, name, color, sortOrder, createdAt
            FROM categories
            WHERE id = ?
        """

        val cursor = executeQuery(query, arrayOf(id))
        cursor.use {
            if (it.moveToFirst()) {
                return Category(
                    id = it.getString(0),
                    name = it.getString(1),
                    color = it.getStringOrNull(2),
                    sortOrder = it.getInt(3),
                    createdAt = it.getString(4)
                )
            }
        }

        return null
    }
}
