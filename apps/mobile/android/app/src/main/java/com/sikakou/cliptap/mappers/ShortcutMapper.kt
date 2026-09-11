package com.sikakou.cliptap.mappers

import android.content.Context
import com.sikakou.cliptap.models.Shortcut
import com.sikakou.cliptap.models.ShortcutValue
import android.util.Log
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * ショートカットのMapper
 * iOS版のShortcutMapper.swift、TypeScript版のShortcutMapper.tsと同等の機能を提供
 */
class ShortcutMapper private constructor(context: Context) : BaseMapper(context) {

    companion object {
        private const val TAG = "ShortcutMapper"

        @Volatile
        private var INSTANCE: ShortcutMapper? = null

        fun getInstance(context: Context): ShortcutMapper {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: ShortcutMapper(context.applicationContext).also {
                    INSTANCE = it
                }
            }
        }

        /**
         * 更新日時の書式（例: 2026-09-10T01:23:45.678Z）
         *
         * 【この書式にする理由】
         * メインアプリはJavaScriptのDate.toISOString()で日時を保存している。
         * 拡張キーボードだけ別書式で書き込むと、同じ列に2種類の表記が混在し、
         * 文字列比較で行っている更新日時順の並べ替えが壊れる。
         *
         * 【java.timeを使わない理由】
         * minSdkは24のため、Instant等（API 26以降）はそのままでは使えない。
         */
        private const val ISO_8601_UTC = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
    }

    /**
     * 指定プロファイルのショートカットを値付きで取得
     *
     * 【何をするか】
     * 1. shortcut_valuesを親のprofileIdで絞り、1回のクエリでまとめて取得
     * 2. shortcutsを同じprofileIdで絞り、sortOrder昇順で取得
     * 3. shortcutIdごとに値を振り分けて組み立てる
     *
     * 【値をショートカットごとに引かない理由】
     * ショートカットの件数だけクエリを発行すると、行の描画前にSQLiteへ何度も往復することになる。
     * 拡張キーボードは表示までの速さが体験に直結するため、2回のクエリに固定する。
     *
     * 【値の絞り込みをJOINで行う理由】
     * shortcut_valuesはprofileIdを持たず、所属プロファイルは親のshortcutsにしかない。
     * 別プロファイルの値まで読み込むと、同じidのショートカットが無いまま捨てられる無駄が出るうえ、
     * 将来の実装変更で他プロファイルの値が紛れ込む余地を残すため、SQLの時点で親と突き合わせる。
     *
     * 【全件取得の口を残さない理由】
     * ショートカットはプロファイルに属するため、プロファイルを指定しない取得は
     * 「どの環境のものか分からない一覧」になり、拡張キーボードでは使い道がない。
     *
     * @param profileId 対象プロファイルのID
     * @return ショートカット一覧（sortOrder順、値もsortOrder順）
     */
    fun getAll(profileId: String): List<Shortcut> {
        /* 値を先に読み、shortcutIdごとにまとめておく */
        val valuesByShortcut = mutableMapOf<String, MutableList<ShortcutValue>>()

        val valueQuery = """
            SELECT v.id, v.shortcutId, v.name, v.value, v.useCount, v.sortOrder, v.createdAt, v.updatedAt
            FROM shortcut_values v
            INNER JOIN shortcuts s ON s.id = v.shortcutId
            WHERE s.profileId = ?
            ORDER BY v.shortcutId ASC, v.sortOrder ASC
        """

        val valueCursor = executeQuery(valueQuery, arrayOf(profileId))
        valueCursor.use {
            while (it.moveToNext()) {
                val value = ShortcutValue(
                    id = it.getString(0),
                    shortcutId = it.getString(1),
                    name = it.getString(2),
                    value = it.getString(3),
                    useCount = it.getInt(4),
                    sortOrder = it.getInt(5),
                    createdAt = it.getString(6),
                    updatedAt = it.getString(7)
                )
                valuesByShortcut.getOrPut(value.shortcutId) { mutableListOf() }.add(value)
            }
        }

        val shortcuts = mutableListOf<Shortcut>()

        val query = """
            SELECT id, profileId, name, sortOrder, createdAt, updatedAt
            FROM shortcuts
            WHERE profileId = ?
            ORDER BY sortOrder ASC
        """

        val cursor = executeQuery(query, arrayOf(profileId))
        cursor.use {
            while (it.moveToNext()) {
                val id = it.getString(0)
                shortcuts.add(
                    Shortcut(
                        id = id,
                        profileId = it.getString(1),
                        name = it.getString(2),
                        /* 値を持たないショートカットでも一覧の取得は落とさない */
                        values = valuesByShortcut[id] ?: emptyList(),
                        sortOrder = it.getInt(3),
                        createdAt = it.getString(4),
                        updatedAt = it.getString(5)
                    )
                )
            }
        }

        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "Loaded ${shortcuts.size} shortcuts")
        return shortcuts
    }

    /**
     * ショートカット値の使用回数を1加算し、親ショートカットの更新日時を進める
     *
     * 【目的】
     * 拡張キーボードから値を挿入したことを記録し、値単位の候補推測（useCount降順）へ反映します。
     *
     * 【親の更新日時も進める理由】
     * メインアプリの一覧は更新日時で並べ替えられるため、使われたショートカットが
     * 古いままにならないようにする。TypeScript版 ShortcutMapper.incrementUseCount() と同じ動作。
     *
     * @param valueId 挿入したショートカット値のID
     * @param shortcutId 所属するショートカットのID
     */
    fun incrementUseCount(valueId: String, shortcutId: String) {
        val incrementQuery = """
            UPDATE shortcut_values
            SET useCount = useCount + 1
            WHERE id = ?
        """

        val touchQuery = """
            UPDATE shortcuts
            SET updatedAt = ?
            WHERE id = ?
        """

        executeUpdate(incrementQuery, arrayOf(valueId))
        executeUpdate(touchQuery, arrayOf(currentTimestamp(), shortcutId))

        if (com.sikakou.cliptap.BuildConfig.DEBUG) Log.d(TAG, "✅ Incremented useCount for shortcut value: $valueId")
    }

    /**
     * 現在時刻をメインアプリと同じ書式（UTCのISO 8601）で取得
     *
     * 【Locale.USを指定する理由】
     * 端末の暦がグレゴリオ暦以外（タイ仏暦など）の場合、既定ロケールでは年が変わってしまい、
     * メインアプリが保存した日時と比較できなくなる。
     */
    private fun currentTimestamp(): String {
        val formatter = SimpleDateFormat(ISO_8601_UTC, Locale.US)
        formatter.timeZone = TimeZone.getTimeZone("UTC")
        return formatter.format(Date())
    }
}
