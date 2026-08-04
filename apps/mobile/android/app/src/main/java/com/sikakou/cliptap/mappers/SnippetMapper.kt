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
     * ソート条件に応じたORDER BY句を生成
     * メインアプリ（TypeScript版 SnippetMapper.ts）の getSorted() と同等のソート条件
     */
    private fun orderClause(sortBy: String): String {
        return when (sortBy) {
            "created" -> "ORDER BY createdAt DESC, title IS NULL, title ASC"
            "updated" -> "ORDER BY updatedAt DESC, title IS NULL, title ASC"
            "title" -> "ORDER BY title IS NULL, title ASC, createdAt DESC"
            "usage" -> "ORDER BY copyCount DESC, createdAt DESC"
            else -> "ORDER BY createdAt DESC, title IS NULL, title ASC"
        }
    }

    /**
     * 全スニペットを取得
     * プロファイルIDでフィルタリング可能、ソート条件を指定可能
     */
    fun getAll(filterByProfileId: String? = null, sortBy: String = "created"): List<Snippet> {
        val snippets = mutableListOf<Snippet>()
        val order = orderClause(sortBy)

        val query = if (filterByProfileId != null) {
            """
            SELECT DISTINCT s.id, s.title, s.content, s.categoryId, s.copyWithTitle, s.copyCount, s.createdAt, s.updatedAt
            FROM snippets s
            WHERE s.id NOT IN (SELECT snippetId FROM snippet_profiles)
               OR s.id IN (SELECT snippetId FROM snippet_profiles WHERE profileId = ?)
            $order
            """
        } else {
            """
            SELECT id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt
            FROM snippets
            $order
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
                        copyCount = it.getInt(5),
                        createdAt = it.getString(6),
                        updatedAt = it.getString(7)
                    )
                )
            }
        }

        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "Loaded ${snippets.size} snippets (profileId: $filterByProfileId, sortBy: $sortBy)")
        return snippets
    }

    /**
     * カテゴリIDでスニペットを取得
     * プロファイルIDでフィルタリング可能、ソート条件を指定可能
     */
    fun getByCategoryId(categoryId: String, filterByProfileId: String? = null, sortBy: String = "created"): List<Snippet> {
        val snippets = mutableListOf<Snippet>()
        val order = orderClause(sortBy)

        val query = if (filterByProfileId != null) {
            """
            SELECT DISTINCT s.id, s.title, s.content, s.categoryId, s.copyWithTitle, s.copyCount, s.createdAt, s.updatedAt
            FROM snippets s
            WHERE s.categoryId = ?
              AND (s.id NOT IN (SELECT snippetId FROM snippet_profiles)
                   OR s.id IN (SELECT snippetId FROM snippet_profiles WHERE profileId = ?))
            $order
            """
        } else {
            """
            SELECT id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt
            FROM snippets
            WHERE categoryId = ?
            $order
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
                        copyCount = it.getInt(5),
                        createdAt = it.getString(6),
                        updatedAt = it.getString(7)
                    )
                )
            }
        }

        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "Loaded ${snippets.size} snippets (categoryId: $categoryId, profileId: $filterByProfileId, sortBy: $sortBy)")
        return snippets
    }

    /**
     * IDでスニペットを取得
     */
    fun getById(id: String): Snippet? {
        val query = """
            SELECT id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt
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
                    copyCount = it.getInt(5),
                    createdAt = it.getString(6),
                    updatedAt = it.getString(7)
                )
            }
        }

        return null
    }

    /**
     * スニペットのコピー回数をインクリメント
     * 拡張キーボードでスニペットを使用した際に呼び出し、使用頻度を記録する
     * TypeScript版 SnippetMapper.incrementCopyCount() と同等
     */
    fun incrementCopyCount(snippetId: String) {
        val query = """
            UPDATE snippets
            SET copyCount = copyCount + 1
            WHERE id = ?
        """

        executeUpdate(query, arrayOf(snippetId))
        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ Incremented copyCount for snippet: $snippetId")
    }
}
