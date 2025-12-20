package com.sikakou.cliptap.database

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.util.Log

/**
 * データベース管理クラス
 *
 * 【目的】
 * SQLiteデータベースへのアクセスを管理するクラス。
 * 3層アーキテクチャのデータアクセス層（最下層）を担当します。
 *
 * 【役割】
 * - データベースファイルのオープン/クローズ
 * - SQLクエリの実行
 * - 結果の取得とKotlinオブジェクトへの変換
 *
 * 【重要な仕組み: 共有ディレクトリ】
 * Androidでは、メインアプリとキーボード拡張（InputMethodService）は
 * 同じアプリパッケージ内で動作するため、ファイルを共有できます。
 * ただし、共通のディレクトリ(files/group.com.sikakou.cliptap/databases)を
 * 使用することで、iOS版と同じ構造でデータを管理します。
 *
 * 【データの流れ】
 * 1. メインアプリ: データベースファイル(cliptap.db)を共有ディレクトリに作成・更新
 * 2. キーボード拡張: 共有ディレクトリからデータベースファイルを読み取り専用で開く
 * 3. キーボード拡張: データを取得して画面に表示
 *
 * 【なぜ読み取り専用？】
 * キーボード拡張はセキュリティ上の制限があり、データの編集はメインアプリで行います。
 * キーボード拡張は表示と挿入のみを担当します。
 *
 * 【対応するTypeScriptファイル】
 * lib/database/database.ts と機能的に同等
 *
 * 【対応するiOSファイル】
 * ios/ClipTapKeyboard/Database/Database.swift と同等
 */
class Database private constructor(private val context: Context) {

    /** SQLiteデータベースのインスタンス */
    private var db: SQLiteDatabase? = null

    companion object {
        private const val TAG = "Database"
        private const val DB_NAME = "cliptap.db"
        private const val SHARED_DIR_NAME = "group.com.sikakou.cliptap"

        /** シングルトンインスタンス（スレッドセーフ） */
        @Volatile
        private var INSTANCE: Database? = null

        /**
         * Databaseインスタンスを取得（シングルトンパターン）
         *
         * 【目的】
         * アプリ全体で1つのDatabaseインスタンスを共有するため。
         *
         * 【理由】
         * データベース接続は重い処理なので、複数作成すると
         * パフォーマンスが低下します。1つのインスタンスを使い回します。
         *
         * @param context Androidのコンテキスト
         * @return Databaseの共有インスタンス
         */
        fun getInstance(context: Context): Database {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Database(context.applicationContext).also {
                    INSTANCE = it
                }
            }
        }

        /**
         * ManageDBのパスを取得（スキーマバージョン管理用）
         *
         * 【目的】
         * 旧バージョンのデータベースファイルパスを取得します。
         *
         * 【何をするか】
         * デフォルトのデータベースディレクトリにある cliptap.db のパスを返します。
         *
         * 【理由】
         * Version 4へのマイグレーション時に、旧DBからデータを読み取るために使用します。
         */
        fun getManageDatabasePath(context: Context): String {
            return context.getDatabasePath(DB_NAME).absolutePath
        }

        /**
         * SharedDBのパスを取得（アプリデータ用）
         *
         * 【目的】
         * メインアプリとキーボード拡張で共有するデータベースファイルのパスを取得します。
         *
         * 【何をするか】
         * 1. 共有ディレクトリ (files/group.com.sikakou.cliptap/databases) のパスを作成
         * 2. ディレクトリが存在しない場合は作成
         * 3. cliptap.db のフルパスを返す
         *
         * 【理由】
         * キーボード拡張とメインアプリが同じデータベースにアクセスするため、
         * 共通のディレクトリを使用する必要があります。
         *
         * 【iOS版との対応】
         * iOS: App Group共有コンテナ
         * Android: files/group.com.sikakou.cliptap/databases
         */
        fun getSharedDatabasePath(context: Context): String {
            val filesDir = context.filesDir
            val sharedDir = java.io.File(filesDir, "$SHARED_DIR_NAME/databases")

            // ディレクトリが存在しない場合は作成
            if (!sharedDir.exists()) {
                sharedDir.mkdirs()
                Log.d(TAG, "📁 Created shared database directory: ${sharedDir.absolutePath}")
            }

            return java.io.File(sharedDir, DB_NAME).absolutePath
        }
    }

    /**
     * SharedDBを初期化（読み書き可能モードで開く）
     *
     * 【目的】
     * メインアプリからデータベースを読み書きするために開きます。
     *
     * 【何をするか】
     * 1. 既に開いている場合は何もしない（二重初期化を防止）
     * 2. 共有ディレクトリのDBファイルを読み書きモードで開く
     * 3. ファイルが存在しない場合は自動作成
     *
     * 【理由】
     * メインアプリはデータの作成・更新・削除を行うため、
     * 読み書き可能モードで開く必要があります。
     *
     * 【呼び出し元】
     * - ClipTapKeyboardService.onCreateInputView()（キーボード初期化時）
     */
    @Throws(Exception::class)
    fun initialize() {
        if (db != null && db!!.isOpen) {
            Log.d(TAG, "✅ SharedDB already initialized")
            return
        }

        try {
            // SharedDB（アプリデータ用）のパスを使用
            val dbPath = getSharedDatabasePath(context)
            db = SQLiteDatabase.openDatabase(
                dbPath,
                null,
                SQLiteDatabase.OPEN_READWRITE or SQLiteDatabase.CREATE_IF_NECESSARY
            )
            Log.d(TAG, "✅ SharedDB initialized successfully: $dbPath")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to initialize SharedDB", e)
            throw e
        }
    }

    /**
     * SharedDBを読み取り専用で開く
     *
     * 【目的】
     * キーボード拡張からデータベースを読み取り専用で開きます。
     *
     * 【何をするか】
     * 1. 既に開いている場合は何もしない
     * 2. 共有ディレクトリのDBファイルを読み取り専用モードで開く
     *
     * 【理由】
     * キーボード拡張はセキュリティ上の制限があり、
     * データの編集はメインアプリで行います。
     * キーボード拡張は表示と挿入のみを担当します。
     *
     * 【呼び出し元】
     * - ClipTapKeyboardService（キーボード拡張）
     */
    @Throws(Exception::class)
    fun openReadOnly() {
        if (db != null && db!!.isOpen) {
            return
        }

        try {
            // SharedDB（アプリデータ用）のパスを使用
            val dbPath = getSharedDatabasePath(context)
            db = SQLiteDatabase.openDatabase(
                dbPath,
                null,
                SQLiteDatabase.OPEN_READONLY
            )
            Log.d(TAG, "✅ SharedDB opened (read-only): $dbPath")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to open SharedDB", e)
            throw e
        }
    }

    /**
     * データベースインスタンスを取得
     */
    fun getDatabase(): SQLiteDatabase {
        if (db == null || !db!!.isOpen) {
            throw IllegalStateException("Database is not initialized")
        }
        return db!!
    }

    /**
     * データベースを閉じる
     */
    fun close() {
        db?.close()
        db = null
        Log.d(TAG, "Database closed")
    }

    /**
     * データベースが開いているか確認
     */
    fun isOpen(): Boolean {
        return db?.isOpen == true
    }

    /**
     * データベース内のテーブル名を取得
     */
    fun getTableNames(): List<String> {
        val tables = mutableListOf<String>()
        if (db == null || !db!!.isOpen) {
            return tables
        }

        val cursor = db!!.rawQuery(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'android_%'",
            null
        )

        cursor.use {
            while (it.moveToNext()) {
                tables.add(it.getString(0))
            }
        }

        return tables
    }
}
