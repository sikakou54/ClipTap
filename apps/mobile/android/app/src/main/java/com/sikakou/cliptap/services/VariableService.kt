package com.sikakou.cliptap.services

import android.content.Context
import com.sikakou.cliptap.mappers.VariableMapper
import com.sikakou.cliptap.mappers.ProfileMapper

/**
 * 変数管理サービス
 *
 * 【目的】
 * 変数（{{name}}などの動的な値）の取得を管理するビジネスロジック層。
 * プロファイルごとの変数セットを管理します。
 *
 * 【役割】
 * - プロファイルに紐づく変数マップの取得
 * - VariableMapperとUI層の橋渡し
 *
 * 【変数とは】
 * スニペット本文内の{{変数名}}という部分を実際の値に置き換えるための仕組み。
 * 例: 「こんにちは、{{client_name}}さん」→「こんにちは、田中さん」
 *
 * 【変数の種類】
 * - システム変数: {{today}}, {{time}}など（VariableReplacerが自動生成）
 * - カスタム変数: ユーザーが定義した変数（データベースから取得）
 *
 * 【対応するiOSファイル】
 * ios/ClipTapKeyboard/Services/VariableService.swift と同等
 */
class VariableService private constructor(private val context: Context) {

    private val variableMapper = VariableMapper.getInstance(context)
    private val profileMapper = ProfileMapper.getInstance(context)

    companion object {
        @Volatile
        private var INSTANCE: VariableService? = null

        fun getInstance(context: Context): VariableService {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: VariableService(context.applicationContext).also {
                    INSTANCE = it
                }
            }
        }
    }

    /**
     * プロファイルIDに紐づく変数マップを取得
     *
     * 【目的】
     * 指定したプロファイルのカスタム変数をマップ形式で取得します。
     *
     * 【何をするか】
     * 1. VariableMapperを使ってデータベースから取得
     * 2. 変数名をキー、変数値をバリューとしたMapを返す
     *
     * 【引数】
     * @param profileId プロファイルID
     *
     * 【戻り値】
     * 変数名 → 変数値のマップ
     * 例: {"client_name": "田中", "company_name": "株式会社○○"}
     *
     * 【使用例】
     * val variables = variableService.getVariablesMap("profile123")
     * // スニペットの変数置換時に使用
     */
    fun getVariablesMap(profileId: String): Map<String, String> {
        val merged = mutableMapOf<String, String>()
        profileMapper.getDefault()?.let { defaultProfile ->
            variableMapper.getVariablesMap(defaultProfile.id)
                .filterValues { it.isNotEmpty() }
                .forEach { (name, value) -> merged[name] = value }
        }
        variableMapper.getVariablesMap(profileId)
            .filterValues { it.isNotEmpty() }
            .forEach { (name, value) -> merged[name] = value }
        return merged
    }
}
