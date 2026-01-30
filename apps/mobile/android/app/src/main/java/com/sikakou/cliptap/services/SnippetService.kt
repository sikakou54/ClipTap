package com.sikakou.cliptap.services

import android.content.Context
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log
import android.view.inputmethod.InputConnection
import com.sikakou.cliptap.mappers.SnippetMapper
import com.sikakou.cliptap.models.Snippet
import com.sikakou.cliptap.utils.VariableReplacer

/**
 * スニペット管理サービス
 *
 * 【目的】
 * スニペット（定型文）の取得、表示、挿入を管理するビジネスロジック層。
 * キーボード拡張のスニペット機能の中核を担います。
 *
 * 【役割】
 * - スニペットの取得（全て、カテゴリ別、ID指定）
 * - 変数置換処理（{{name}}などを実際の値に変換）
 * - テキストフィールドへの挿入
 * - 振動フィードバック
 *
 * 【重要な仕組み: 3層アーキテクチャ】
 * UI層（KeyboardService） → ビジネスロジック層（このService） → データアクセス層（Mapper）
 * この分離により、コードの保守性とテスタビリティが向上します。
 *
 * 【対応するiOSファイル】
 * ios/ClipTapKeyboard/Services/SnippetService.swift と同等
 */
class SnippetService private constructor(private val context: Context) {

    private val snippetMapper = SnippetMapper.getInstance(context)
    private val variableReplacer = VariableReplacer()

    companion object {
        private const val TAG = "SnippetService"

        @Volatile
        private var INSTANCE: SnippetService? = null

        fun getInstance(context: Context): SnippetService {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: SnippetService(context.applicationContext).also {
                    INSTANCE = it
                }
            }
        }
    }

    /**
     * 全スニペットを取得
     *
     * 【目的】
     * 指定したプロファイルに属する全てのスニペットを取得します。
     *
     * 【何をするか】
     * SnippetMapperのgetAll()を呼んでデータベースから取得します。
     *
     * 【引数】
     * @param profileId プロファイルID（nullの場合はプロファイルフィルタなし）
     * @param sortBy ソート条件（"created", "updated", "title", "usage"）
     *
     * 【戻り値】
     * スニペットのリスト（ソート条件に従って並び替え済み）
     */
    fun getAllSnippets(profileId: String? = null, sortBy: String = "created"): List<Snippet> {
        return snippetMapper.getAll(profileId, sortBy)
    }

    /**
     * カテゴリIDでスニペットを取得
     *
     * 【目的】
     * 指定したカテゴリに属するスニペットのみを取得します。
     *
     * 【何をするか】
     * SnippetMapperのgetByCategoryId()を呼んでカテゴリでフィルタリングします。
     *
     * 【引数】
     * @param categoryId カテゴリID
     * @param profileId プロファイルID（nullの場合はプロファイルフィルタなし）
     * @param sortBy ソート条件（"created", "updated", "title", "usage"）
     *
     * 【戻り値】
     * 指定カテゴリのスニペットリスト（ソート条件に従って並び替え済み）
     */
    fun getSnippetsByCategory(categoryId: String, profileId: String? = null, sortBy: String = "created"): List<Snippet> {
        return snippetMapper.getByCategoryId(categoryId, profileId, sortBy)
    }

    /**
     * IDでスニペットを取得
     */
    fun getSnippet(id: String): Snippet? {
        return snippetMapper.getById(id)
    }

    /**
     * 変数を置換（詳細画面のプレビュー用）
     *
     * 【目的】
     * スニペット本文の変数（{{name}}など）を実際の値に置き換えます。
     *
     * 【何をするか】
     * 1. VariableReplacerを使って変数を置換
     * 2. システム変数（{{today}}など）とカスタム変数の両方を処理
     *
     * 【引数】
     * @param text 置換対象のテキスト
     * @param variablesMap カスタム変数のマップ（変数名 → 値）
     *
     * 【戻り値】
     * 変数が置換されたテキスト
     *
     * 【使用例】
     * replaceVariables("こんにちは、{{name}}さん", mapOf("name" to "田中"))
     * → "こんにちは、田中さん"
     */
    fun replaceVariables(text: String, variablesMap: Map<String, String> = emptyMap()): String {
        return variableReplacer.replace(text, variablesMap)
    }

    /**
     * スニペットをテキスト入力欄に挿入
     *
     * 【目的】
     * ユーザーが選択したスニペットをテキストフィールドに挿入します。
     *
     * 【何をするか】
     * 1. タイトルの処理（copyWithTitle=trueの場合、タイトルも挿入）
     * 2. タイトルと本文の変数を置換
     * 3. InputConnectionを使ってテキストを挿入
     * 4. 振動フィードバックを実行
     *
     * 【引数】
     * @param snippet 挿入するスニペット
     * @param inputConnection テキストフィールドへの接続
     * @param variablesMap カスタム変数のマップ
     *
     * 【理由】
     * InputConnectionはAndroidのIMEがテキストを挿入するための標準的な方法です。
     * commitText()を使うことで、Undo/Redo履歴にも正しく記録されます。
     */
    fun insertSnippet(
        snippet: Snippet,
        inputConnection: InputConnection,
        variablesMap: Map<String, String> = emptyMap()
    ) {
        // タイトルの処理
        val title = if (snippet.copyWithTitle && snippet.title != null) {
            variableReplacer.replace(snippet.title, variablesMap) + "\n"
        } else {
            ""
        }

        // 本文の変数置換
        val content = variableReplacer.replace(snippet.content, variablesMap)

        /* テキストを挿入 */
        val textToInsert = title + content
        inputConnection.commitText(textToInsert, 1)

        Log.d(TAG, "✅ Snippet inserted: ${snippet.id}")

        /* 振動フィードバック */
        performHapticFeedback()

        /* 使用頻度（copyCount）をインクリメント
           使用頻度順ソートに反映するため、挿入時にカウントを加算 */
        snippetMapper.incrementCopyCount(snippet.id)
    }

    /**
     * 振動フィードバック
     *
     * 【目的】
     * スニペット挿入時に触覚フィードバックを提供します。
     *
     * 【何をするか】
     * 1. Vibratorサービスを取得
     * 2. 振動機能が利用可能か確認
     * 3. 50ms間の短い振動を実行
     *
     * 【理由】
     * 触覚フィードバックにより、ユーザーは操作が成功したことを
     * 視覚以外でも認識でき、UXが向上します。
     */
    private fun performHapticFeedback() {
        try {
            val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            if (vibrator?.hasVibrator() == true) {
                vibrator.vibrate(
                    VibrationEffect.createOneShot(
                        50,
                        VibrationEffect.DEFAULT_AMPLITUDE
                    )
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to perform haptic feedback", e)
        }
    }
}
