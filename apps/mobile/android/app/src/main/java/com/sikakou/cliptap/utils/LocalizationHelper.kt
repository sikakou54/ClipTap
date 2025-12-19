package com.sikakou.cliptap.utils

import android.content.Context
import com.sikakou.cliptap.R

/**
 * 翻訳ヘルパークラス
 *
 * 【目的】
 * キーボード拡張で使用する翻訳キーを管理します。
 * iOSのLocalizable.stringsに対応するAndroid版です。
 *
 * 【役割】
 * - 翻訳キーをリソースIDに変換
 * - 現在のロケールに応じた翻訳テキストを取得
 *
 * 【使用方法】
 * ```kotlin
 * val helper = LocalizationHelper(context)
 * val text = helper.getString("snippet.empty")
 * // → 日本語環境: "スニペットがありません"
 * // → 英語環境: "No snippets available"
 * ```
 *
 * 【対応するiOSファイル】
 * ios/ClipTapKeyboard/LocalizationHelper.swift と同等
 */
class LocalizationHelper(private val context: Context) {

    /**
     * 翻訳キーから翻訳済みテキストを取得
     *
     * 【目的】
     * iOS風の"snippet.empty"のようなキーをAndroidのリソースIDに変換して翻訳を取得します。
     *
     * 【何をするか】
     * 1. 翻訳キーをAndroidのリソース名に変換（"."を"_"に置換）
     * 2. リソースIDを取得
     * 3. Contextから翻訳済みテキストを取得
     *
     * @param key 翻訳キー（例: "snippet.empty"）
     * @return 翻訳済みテキスト（見つからない場合はキーをそのまま返す）
     */
    fun getString(key: String): String {
        // "snippet.empty" → "snippet_empty" に変換
        val resourceName = key.replace(".", "_")

        // リソースIDを取得
        val resourceId = context.resources.getIdentifier(
            resourceName,
            "string",
            context.packageName
        )

        // リソースIDが見つからない場合はキーをそのまま返す
        if (resourceId == 0) {
            return key
        }

        // 翻訳済みテキストを返す
        return context.getString(resourceId)
    }

    /**
     * 複数の翻訳キーを一括取得
     *
     * @param keys 翻訳キーのリスト
     * @return キー → 翻訳済みテキストのマップ
     */
    fun getStrings(keys: List<String>): Map<String, String> {
        return keys.associateWith { getString(it) }
    }

    /**
     * よく使う翻訳をまとめて取得（パフォーマンス最適化）
     */
    object CommonStrings {
        fun getSnippetStrings(context: Context): Map<String, String> {
            val helper = LocalizationHelper(context)
            return mapOf(
                "empty" to helper.getString("snippet.empty"),
                "no_results" to helper.getString("snippet.no_results"),
                "copy" to helper.getString("snippet.copy"),
                "insert" to helper.getString("snippet.insert"),
                "close" to helper.getString("snippet.close")
            )
        }

        fun getCategoryStrings(context: Context): Map<String, String> {
            val helper = LocalizationHelper(context)
            return mapOf(
                "all" to helper.getString("category.all"),
                "select" to helper.getString("category.select"),
                "none" to helper.getString("category.none"),
                "uncategorized" to helper.getString("category.uncategorized")
            )
        }

        fun getProfileStrings(context: Context): Map<String, String> {
            val helper = LocalizationHelper(context)
            return mapOf(
                "all" to helper.getString("profile.all"),
                "select" to helper.getString("profile.select"),
                "none" to helper.getString("profile.none")
            )
        }
    }
}
