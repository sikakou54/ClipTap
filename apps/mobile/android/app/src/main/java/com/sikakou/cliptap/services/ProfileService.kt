package com.sikakou.cliptap.services

import android.content.Context
import com.sikakou.cliptap.mappers.ProfileMapper
import com.sikakou.cliptap.models.Profile

/**
 * プロファイル管理サービス
 *
 * 【目的】
 * プロファイル（環境）の取得を管理するビジネスロジック層。
 * キーボード拡張の環境切り替え機能を担います。
 *
 * 【役割】
 * - プロファイルの取得（全て、アクティブ、ID指定）
 * - ProfileMapperとUI層の橋渡し
 *
 * 【プロファイルとは】
 * 例: 「会社用」「個人用」などの環境設定の塊。
 * 各プロファイルは独自の変数セットを持ち、スニペットをフィルタリングできます。
 *
 * 【対応するiOSファイル】
 * ios/ClipTapKeyboard/Services/ProfileService.swift と同等
 */
class ProfileService private constructor(private val context: Context) {

    private val profileMapper = ProfileMapper.getInstance(context)

    companion object {
        @Volatile
        private var INSTANCE: ProfileService? = null

        fun getInstance(context: Context): ProfileService {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: ProfileService(context.applicationContext).also {
                    INSTANCE = it
                }
            }
        }
    }

    /**
     * 全プロファイルを取得
     *
     * 【目的】
     * データベースに登録されている全てのプロファイルを取得します。
     *
     * 【何をするか】
     * ProfileMapperのgetAll()を呼んでデータベースから取得します。
     *
     * 【戻り値】
     * プロファイルのリスト（valid=1のものが先、作成日時順）
     */
    fun getAllProfiles(): List<Profile> {
        return profileMapper.getAll()
    }

    /**
     * アクティブなプロファイルを取得
     *
     * 【目的】
     * 現在アクティブに設定されているプロファイルを取得します。
     *
     * 【何をするか】
     * ProfileMapperのgetActive()を呼んで、isActive=1のプロファイルを取得します。
     *
     * 【戻り値】
     * アクティブなプロファイル（存在しない場合はnull）
     *
     * 【理由】
     * キーボード起動時に、最後に選択されていたプロファイルを
     * 自動的に表示するために使用します。
     */
    fun getActiveProfile(): Profile? {
        return profileMapper.getActive()
    }

    /**
     * IDでプロファイルを取得
     */
    fun getProfile(id: String): Profile? {
        return profileMapper.getById(id)
    }
}
