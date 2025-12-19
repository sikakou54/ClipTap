package com.sikakou.cliptap.services

import android.content.Context
import com.sikakou.cliptap.mappers.CategoryMapper
import com.sikakou.cliptap.models.Category

/**
 * カテゴリ管理サービス
 *
 * 【目的】
 * カテゴリ（スニペットの分類）の取得を管理するビジネスロジック層。
 * キーボード拡張のカテゴリフィルター機能を担います。
 *
 * 【役割】
 * - カテゴリの取得（全て、ID指定）
 * - カテゴリMapperとUI層の橋渡し
 *
 * 【重要な仕組み: シングルトンパターン】
 * アプリ全体で1つのインスタンスを共有し、パフォーマンスを最適化します。
 *
 * 【対応するiOSファイル】
 * ios/ClipTapKeyboard/Services/CategoryService.swift と同等
 */
class CategoryService private constructor(private val context: Context) {

    private val categoryMapper = CategoryMapper.getInstance(context)

    companion object {
        @Volatile
        private var INSTANCE: CategoryService? = null

        fun getInstance(context: Context): CategoryService {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: CategoryService(context.applicationContext).also {
                    INSTANCE = it
                }
            }
        }
    }

    /**
     * 全カテゴリを取得
     *
     * 【目的】
     * データベースに登録されている全てのカテゴリを取得します。
     *
     * 【何をするか】
     * CategoryMapperのgetAll()を呼んでデータベースから取得します。
     *
     * 【戻り値】
     * カテゴリのリスト（sortOrder順）
     */
    fun getAll(): List<Category> {
        return categoryMapper.getAll()
    }

    /**
     * IDでカテゴリを取得
     */
    fun getCategory(id: String): Category? {
        return categoryMapper.getById(id)
    }
}
