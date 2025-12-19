package com.sikakou.cliptap.mappers

import android.content.Context
import com.sikakou.cliptap.models.Snippet
import android.util.Log

/**
 * スニペットのMapper
 * iOS版のSnippetMapper.swiftと同等の機能を提供
 */
class SnippetMapper private constructor(context: Context) : BaseMapper(context) {

    companion object {
        private const val TAG = "SnippetMapper"

        @Volatile
        private var INSTANCE: SnippetMapper? = null

        fun getInstance(context: Context): SnippetMapper {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: SnippetMapper(context.applicationContext).also {
                    INSTANCE = it
                }
            }
        }
    }

    /**
     * 全スニペットを取得
     * プロファイルIDでフィルタリング可能
     */
    fun getAll(filterByProfileId: String? = null): List<Snippet> {
        val snippets = mutableListOf<Snippet>()

        val query = if (filterByProfileId != null) {
            """
            SELECT DISTINCT s.id, s.title, s.content, s.categoryId, s.copyWithTitle, s.createdAt, s.updatedAt
            FROM snippets s
            WHERE s.id NOT IN (SELECT snippetId FROM snippet_profiles)
               OR s.id IN (SELECT snippetId FROM snippet_profiles WHERE profileId = ?)
            ORDER BY s.createdAt ASC
            """
        } else {
            """
            SELECT id, title, content, categoryId, copyWithTitle, createdAt, updatedAt
            FROM snippets
            ORDER BY createdAt ASC
            """
        }

        val cursor = if (filterByProfileId != null) {
            executeQuery(query, arrayOf(filterByProfileId))
        } else {
            executeQuery(query)
        }

        cursor.use {
            while (it.moveToNext()) {
                snippets.add(
                    Snippet(
                        id = it.getString(0),
                        title = it.getStringOrNull(1),
                        content = it.getString(2),
                        categoryId = it.getStringOrNull(3),
                        copyWithTitle = it.getBoolean(4),
                        createdAt = it.getString(5),
                        updatedAt = it.getString(6)
                    )
                )
            }
        }

        Log.d(TAG, "Loaded ${snippets.size} snippets (profileId: $filterByProfileId)")
        return snippets
    }

    /**
     * カテゴリIDでスニペットを取得
     * プロファイルIDでフィルタリング可能
     */
    fun getByCategoryId(categoryId: String, filterByProfileId: String? = null): List<Snippet> {
        val snippets = mutableListOf<Snippet>()

        val query = if (filterByProfileId != null) {
            """
            SELECT DISTINCT s.id, s.title, s.content, s.categoryId, s.copyWithTitle, s.createdAt, s.updatedAt
            FROM snippets s
            WHERE s.categoryId = ?
              AND (s.id NOT IN (SELECT snippetId FROM snippet_profiles)
                   OR s.id IN (SELECT snippetId FROM snippet_profiles WHERE profileId = ?))
            ORDER BY s.createdAt ASC
            """
        } else {
            """
            SELECT id, title, content, categoryId, copyWithTitle, createdAt, updatedAt
            FROM snippets
            WHERE categoryId = ?
            ORDER BY createdAt ASC
            """
        }

        val cursor = if (filterByProfileId != null) {
            executeQuery(query, arrayOf(categoryId, filterByProfileId))
        } else {
            executeQuery(query, arrayOf(categoryId))
        }

        cursor.use {
            while (it.moveToNext()) {
                snippets.add(
                    Snippet(
                        id = it.getString(0),
                        title = it.getStringOrNull(1),
                        content = it.getString(2),
                        categoryId = it.getStringOrNull(3),
                        copyWithTitle = it.getBoolean(4),
                        createdAt = it.getString(5),
                        updatedAt = it.getString(6)
                    )
                )
            }
        }

        Log.d(TAG, "Loaded ${snippets.size} snippets (categoryId: $categoryId, profileId: $filterByProfileId)")
        return snippets
    }

    /**
     * IDでスニペットを取得
     */
    fun getById(id: String): Snippet? {
        val query = """
            SELECT id, title, content, categoryId, copyWithTitle, createdAt, updatedAt
            FROM snippets
            WHERE id = ?
        """

        val cursor = executeQuery(query, arrayOf(id))
        cursor.use {
            if (it.moveToFirst()) {
                return Snippet(
                    id = it.getString(0),
                    title = it.getStringOrNull(1),
                    content = it.getString(2),
                    categoryId = it.getStringOrNull(3),
                    copyWithTitle = it.getBoolean(4),
                    createdAt = it.getString(5),
                    updatedAt = it.getString(6)
                )
            }
        }

        return null
    }
}
