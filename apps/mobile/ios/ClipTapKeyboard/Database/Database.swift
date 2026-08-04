//
//  Database.swift
//  ClipTapKeyboard
//
//  【目的】
//  SQLiteデータベースへのアクセスを管理するクラス
//  3層アーキテクチャのデータアクセス層（最下層）を担当します
//
//  【役割】
//  - データベースファイルのオープン/クローズ
//  - SQLクエリの実行
//  - 結果の取得とSwiftオブジェクトへの変換
//
//  【重要な仕組み: App Groups】
//  iOSでは、メインアプリとキーボード拡張は通常は別々のサンドボックス内で動作し、
//  互いにファイルを共有できません。しかし、App Groupsという機能を使うと、
//  共有コンテナ（共有フォルダ）を通じてファイルを共有できます。
//
//  【データの流れ】
//  1. メインアプリ: データベースファイル(cliptap.db)を共有コンテナに作成・更新
//  2. キーボード拡張: 共有コンテナからデータベースファイルを読み取り専用で開く
//  3. キーボード拡張: データを取得して画面に表示
//
//  【なぜ読み取り専用？】
//  キーボード拡張はセキュリティ上の制限があり、データの編集はメインアプリで行います。
//  キーボード拡張は表示と挿入のみを担当します。
//
//  【対応するTypeScriptファイル】
//  lib/database/database.ts と機能的に同等
//

import Foundation
import SQLite3

/// SQLiteデータベースを管理するクラス
/// シングルトンパターンで実装され、アプリ全体で1つのインスタンスを共有します
class Database {

    // MARK: - Singleton（シングルトンパターン）

    /// 共有インスタンス（アプリ全体でこのインスタンスを使用）
    /// 使用例: Database.shared.initialize()
    static let shared = Database()

    // MARK: - Properties（プロパティ）

    /// SQLiteデータベースのポインタ
    /// OpaquePointerは、C言語のポインタをSwiftで扱うための型です
    private var db: OpaquePointer?

    /// App Groupsの識別子
    /// メインアプリとキーボード拡張の間でファイルを共有するために使用
    /// この識別子は、Xcodeのプロジェクト設定で設定する必要があります
    private let appGroupIdentifier = "group.com.sikakou.cliptap"

    /// データベースが初期化済みかどうかのフラグ
    /// 二重初期化を防ぐために使用
    private var isInitialized = false

    /// データベースアクセス用のシリアルキュー
    /// SQLiteへの同時アクセスを防ぎ、スレッドセーフを保証します
    private let dbQueue = DispatchQueue(label: "com.sikakou.cliptap.database", qos: .userInitiated)

    // MARK: - Initialization（初期化）

    /// プライベートイニシャライザ（外部からのインスタンス生成を禁止）
    /// シングルトンパターンのため、Database.sharedのみ使用可能
    private init() {}

    /// デイニシャライザ（オブジェクトが破棄されるときに呼ばれる）
    /// データベース接続を確実にクローズするために使用
    deinit {
        close()
    }

    // MARK: - Database Operations（データベース操作）

    /// データベースを初期化（読み取り専用で開く）
    ///
    /// - Throws: DatabaseError（データベースファイルが見つからない、開けないなど）
    ///
    /// 【処理の流れ】
    /// 1. 既に初期化済みかチェック → 済みなら何もしない（二重初期化を防止）
    /// 2. データベースファイルを開く（open()メソッドを呼び出し）
    /// 3. 初期化フラグをtrueに設定
    ///
    /// 【呼び出しタイミング】
    /// - KeyboardViewControllerのviewDidLoad（画面の初回表示時）
    /// - KeyboardViewControllerのviewWillAppear（画面が表示される度）
    ///
    /// 【エラーハンドリング】
    /// データベースファイルが見つからない場合などはthrowsでエラーを投げます
    /// 呼び出し側でtry-catchで処理する必要があります
    ///
    /// 【スレッドセーフティ】
    /// dbQueue.syncでシリアルキューを使用し、複数スレッドからの同時アクセスを防ぎます
    func initialize() throws {
        try dbQueue.sync {
            if isInitialized {
                KeyboardLog.debug("[Database] Already initialized")
                return
            }

            try open()  // データベースファイルを開く
            isInitialized = true
            KeyboardLog.debug("[Database] ✅ Initialized successfully")
        }
    }

    /// データベースを開く（読み取り専用）
    ///
    /// - Throws: DatabaseError
    ///
    /// 【処理の流れ】
    /// 1. App Groupsの共有コンテナを取得
    /// 2. データベースファイルのパスを構築（共有コンテナ/databases/cliptap.db）
    /// 3. ファイルの存在を確認
    /// 4. SQLiteのAPIを使ってデータベースを読み取り専用で開く
    ///
    /// 【App Groupsとは】
    /// iOSでは、メインアプリとキーボード拡張は通常別々のサンドボックスで動作します。
    /// App Groupsを使うと、両者が同じフォルダ（共有コンテナ）を読み書きできます。
    ///
    /// 【読み取り専用で開く理由】
    /// キーボード拡張はセキュリティ上の制限があるため、データの編集はメインアプリで行います。
    /// キーボード拡張は表示のみを担当します（SQLITE_OPEN_READONLYフラグ）
    ///
    /// 【エラーケース】
    /// - containerNotFound: App Groupsが設定されていない
    /// - fileNotFound: データベースファイルが存在しない（メインアプリでまだ作成されていない）
    /// - openFailed: SQLiteのエラー（ファイルが壊れているなど）
    private func open() throws {
        // 既に開いている場合は何もしない
        if db != nil {
            KeyboardLog.debug("[Database] Already open")
            return
        }

        // App Groupsの共有コンテナを取得
        // FileManager.containerURL()は、指定されたApp Group識別子の共有フォルダのURLを返します
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupIdentifier
        ) else {
            // 共有コンテナが見つからない = App Groupsが正しく設定されていない
            KeyboardLog.debug("❌❌❌ [Database] Container not found for: \(appGroupIdentifier)")
            KeyboardLog.debug("❌ This means App Groups is not configured correctly!")
            throw DatabaseError.containerNotFound
        }


        // データベースファイルのパスを構築
        // 共有コンテナ/databases/cliptap.db
        let dbPath = containerURL
            .appendingPathComponent("databases")  // databasesフォルダ
            .appendingPathComponent("cliptap.db")  // データベースファイル名
            .path


        // databasesディレクトリの存在確認（デバッグ用）
        let databasesDir = containerURL.appendingPathComponent("databases").path
        let dirExists = FileManager.default.fileExists(atPath: databasesDir)
        KeyboardLog.debug("📂 [Database] databases/ directory exists: \(dirExists)")

        // データベースファイルが存在するか確認
        let fileExists = FileManager.default.fileExists(atPath: dbPath)
        KeyboardLog.debug("📂 [Database] cliptap.db exists: \(fileExists)")

        if !fileExists {
            // ファイルが存在しない = メインアプリでまだデータベースが作成されていない
            KeyboardLog.debug("❌❌❌ [Database] Database file does not exist")
            KeyboardLog.debug("❌ Please check if the app has created the database in the shared container!")
            throw DatabaseError.fileNotFound
        }

        // SQLiteのAPIを使ってデータベースを読み書き可能で開く
        // sqlite3_open_v2()は、SQLiteのデータベースを開く関数です
        // SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE フラグで読み書きモードで開きます
        // validフラグの更新処理を行うため、書き込み権限が必要です
        let result = sqlite3_open_v2(
            dbPath,  // データベースファイルのパス
            &db,  // データベースポインタの格納先（inoutパラメータ）
            SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE,  // 読み書き可能フラグ
            nil  // VFSモジュール（通常はnil）
        )

        if result != SQLITE_OK {
            // SQLITE_OK以外 = エラー
            let errorMsg = String(cString: sqlite3_errmsg(db))
            KeyboardLog.debug("[Database] ❌ Failed to open: \(errorMsg)")
            throw DatabaseError.openFailed(message: errorMsg)
        }

        KeyboardLog.debug("[Database] ✅ Opened successfully")
    }

    /// データベースを閉じる
    ///
    /// 【処理内容】
    /// SQLiteの接続を閉じて、リソースを解放します
    ///
    /// 【呼び出しタイミング】
    /// - デイニシャライザ（オブジェクト破棄時）
    /// - 明示的にクローズしたい場合（通常は不要）
    ///
    /// 【スレッドセーフティ】
    /// dbQueue.syncでシリアルキューを使用し、複数スレッドからの同時アクセスを防ぎます
    func close() {
        dbQueue.sync {
            if db != nil {
                sqlite3_close(db)  // SQLite接続を閉じる
                db = nil  // ポインタをnilに設定
                isInitialized = false  // 初期化フラグをリセット
                KeyboardLog.debug("[Database] Closed")
            }
        }
    }

    /// データベースインスタンスを取得
    ///
    /// - Returns: SQLiteのデータベースポインタ
    ///
    /// 【用途】
    /// Mapper層から直接SQLiteのAPIを使いたい場合に使用
    /// 通常はexecuteQuery()を使うことを推奨
    func getDB() -> OpaquePointer? {
        return db
    }

    /// クエリを実行して結果を取得
    ///
    /// - Parameters:
    ///   - query: SQL文（例: "SELECT * FROM snippets WHERE id = ?"）
    ///   - parameters: プレースホルダ（?）にバインドする値の配列
    ///   - transform: 各行を変換する関数（OpaquePointer → Swiftオブジェクト）
    /// - Returns: 変換後のオブジェクトの配列
    ///
    /// 【処理の流れ】
    /// 1. SQL文を準備（sqlite3_prepare_v2）
    /// 2. パラメータをバインド（sqlite3_bind_text など）
    /// 3. 各行を取得（sqlite3_step）
    /// 4. 各行を変換関数で変換（transform）
    /// 5. 結果を配列として返す
    ///
    /// 【使用例】
    /// ```swift
    /// let snippets = db.executeQuery(
    ///     "SELECT * FROM snippets WHERE category_id = ?",
    ///     parameters: ["work"],
    ///     transform: { statement in
    ///         return Snippet(
    ///             id: db.getString(statement, at: 0) ?? "",
    ///             title: db.getString(statement, at: 1),
    ///             content: db.getString(statement, at: 2) ?? ""
    ///         )
    ///     }
    /// ) as! [Snippet]
    /// ```
    ///
    /// 【プレースホルダとバインド】
    /// SQL文に直接値を埋め込むのではなく、?（プレースホルダ）を使い、
    /// parametersで値を渡すことで、SQLインジェクション攻撃を防ぎます
    ///
    /// 【スレッドセーフティ】
    /// dbQueue.syncでシリアルキューを使用し、複数スレッドからの同時アクセスを防ぎます
    func executeQuery(
        _ query: String,
        parameters: [Any] = [],
        transform: (OpaquePointer) -> Any?
    ) -> [Any] {
        return dbQueue.sync {
            // データベースが開いていない場合は空配列を返す
            guard let db = db else {
                KeyboardLog.debug("[Database] ❌ Database not opened")
                return []
            }

            var statement: OpaquePointer?  // SQL文のコンパイル済み表現
            var results: [Any] = []  // 結果を格納する配列

            // ステップ1: クエリの準備（SQL文をコンパイル）
            // sqlite3_prepare_v2()は、SQL文を解析してコンパイルします
            let prepareResult = sqlite3_prepare_v2(db, query, -1, &statement, nil)
            if prepareResult != SQLITE_OK {
                // コンパイルエラー（SQL文の文法エラーなど）
                let errorMsg = String(cString: sqlite3_errmsg(db))
                KeyboardLog.debug("[Database] ❌ Failed to prepare statement: \(errorMsg)")
                return []
            }

            // ステップ2: パラメータのバインド（?にを値を代入）
            // 例: "SELECT * FROM snippets WHERE id = ?" の ? に値を代入
            for (index, param) in parameters.enumerated() {
                let bindIndex = Int32(index + 1)  // SQLiteのインデックスは1から始まる

                if let stringValue = param as? String {
                    // 文字列パラメータのバインド
                    KeyboardLog.debug("[Database] 🔧 Binding text parameter [\(bindIndex)] (length: \(stringValue.count))")
                    let SQLITE_TRANSIENT = unsafeBitCast(-1, to: sqlite3_destructor_type.self)
                    let result = sqlite3_bind_text(statement, bindIndex, stringValue, -1, SQLITE_TRANSIENT)
                    if result != SQLITE_OK {
                        let errorMsg = String(cString: sqlite3_errmsg(db))
                        KeyboardLog.debug("[Database] ❌ Failed to bind text parameter [\(bindIndex)]: \(errorMsg)")
                    }
                } else if let intValue = param as? Int {
                    // 整数パラメータのバインド
                    KeyboardLog.debug("[Database] 🔧 Binding parameter [\(bindIndex)]: \(intValue)")
                    sqlite3_bind_int(statement, bindIndex, Int32(intValue))
                } else if let boolValue = param as? Bool {
                    // 真偽値パラメータのバインド（SQLiteでは0または1として保存）
                    KeyboardLog.debug("[Database] 🔧 Binding parameter [\(bindIndex)]: \(boolValue)")
                    sqlite3_bind_int(statement, bindIndex, boolValue ? 1 : 0)
                } else if param is NSNull {
                    // NULLパラメータのバインド
                    KeyboardLog.debug("[Database] 🔧 Binding parameter [\(bindIndex)]: NULL")
                    sqlite3_bind_null(statement, bindIndex)
                }
            }

            // ステップ3: 結果の取得（各行を処理）
            var rowCount = 0
            // sqlite3_step()を繰り返し呼び出して、各行を取得
            // SQLITE_ROWが返される間、まだ行が残っています
            while sqlite3_step(statement) == SQLITE_ROW {
                rowCount += 1
                // transform関数を使って、SQLiteの行をSwiftオブジェクトに変換
                if let result = transform(statement!) {
                    results.append(result)
                }
            }
            KeyboardLog.debug("[Database] 📊 Query returned \(rowCount) row(s), transformed to \(results.count) result(s)")

            // ステップ4: クリーンアップ
            // sqlite3_finalize()で、コンパイル済みSQL文を破棄してメモリを解放
            sqlite3_finalize(statement)
            return results
        }
    }

    /// クエリを実行（結果を返さない - INSERT, UPDATE, DELETE用）
    /// ※キーボード拡張は読み取り専用なので基本的に使用しない
    ///
    /// 【スレッドセーフティ】
    /// dbQueue.syncでシリアルキューを使用し、複数スレッドからの同時アクセスを防ぎます
    func executeUpdate(_ query: String, parameters: [Any] = []) -> Bool {
        return dbQueue.sync {
            guard let db = db else {
                KeyboardLog.debug("[Database] ❌ Database not opened")
                return false
            }

            var statement: OpaquePointer?

            let prepareResult = sqlite3_prepare_v2(db, query, -1, &statement, nil)
            if prepareResult != SQLITE_OK {
                let errorMsg = String(cString: sqlite3_errmsg(db))
                KeyboardLog.debug("[Database] ❌ Failed to prepare statement: \(errorMsg)")
                return false
            }

            // パラメータのバインド
            for (index, param) in parameters.enumerated() {
                let bindIndex = Int32(index + 1)

                if let stringValue = param as? String {
                    /* SQLITE_TRANSIENT を使用してSQLiteに文字列のコピーを作成させる
                       Swiftの文字列は一時的なメモリを使用するため、nil（SQLITE_STATIC）だと
                       メモリ解放後に不正な値を参照してしまう */
                    let SQLITE_TRANSIENT = unsafeBitCast(-1, to: sqlite3_destructor_type.self)
                    sqlite3_bind_text(statement, bindIndex, stringValue, -1, SQLITE_TRANSIENT)
                } else if let intValue = param as? Int {
                    sqlite3_bind_int(statement, bindIndex, Int32(intValue))
                } else if let boolValue = param as? Bool {
                    sqlite3_bind_int(statement, bindIndex, boolValue ? 1 : 0)
                } else if param is NSNull {
                    sqlite3_bind_null(statement, bindIndex)
                }
            }

            let stepResult = sqlite3_step(statement)
            sqlite3_finalize(statement)

            if stepResult != SQLITE_DONE {
                let errorMsg = String(cString: sqlite3_errmsg(db))
                KeyboardLog.debug("[Database] ❌ Failed to execute: \(errorMsg)")
                return false
            }

            return true
        }
    }

    // MARK: - Helper Methods（ヘルパーメソッド）

    /// SQLiteのカラム値を文字列として取得
    ///
    /// - Parameters:
    ///   - statement: SQLiteのステートメント（1行分のデータ）
    ///   - index: カラムのインデックス（0から始まる）
    /// - Returns: 文字列値（NULLの場合はnil）
    ///
    /// 【用途】
    /// executeQuery()のtransform関数内で使用
    /// SQLiteの行データからSwiftのStringに変換
    ///
    /// 【使用例】
    /// ```swift
    /// let title = db.getString(statement, at: 1)  // 2番目のカラムを文字列として取得
    /// ```
    func getString(_ statement: OpaquePointer, at index: Int32) -> String? {
        guard let cString = sqlite3_column_text(statement, index) else {
            return nil  // カラムがNULLの場合
        }
        // C言語の文字列（char*）をSwiftのStringに変換
        return String(cString: cString)
    }

    /// SQLiteのカラム値を整数として取得
    ///
    /// - Parameters:
    ///   - statement: SQLiteのステートメント（1行分のデータ）
    ///   - index: カラムのインデックス（0から始まる）
    /// - Returns: 整数値
    ///
    /// 【用途】
    /// IDやsortOrderなど、整数型のカラムを取得する際に使用
    ///
    /// 【使用例】
    /// ```swift
    /// let sortOrder = db.getInt(statement, at: 5)  /* 6番目のカラムを整数として取得 */
    /// ```
    func getInt(_ statement: OpaquePointer, at index: Int32) -> Int {
        // sqlite3_column_int()でInt32を取得し、Intに変換
        return Int(sqlite3_column_int(statement, index))
    }

    /// SQLiteのカラム値を真偽値として取得
    ///
    /// - Parameters:
    ///   - statement: SQLiteのステートメント（1行分のデータ）
    ///   - index: カラムのインデックス（0から始まる）
    /// - Returns: 真偽値（1=true, 0=false）
    ///
    /// 【用途】
    /// isPinned、copyWithTitleなど、真偽値型のカラムを取得する際に使用
    ///
    /// 【SQLiteの真偽値】
    /// SQLiteには真偽値型がないため、0（false）または1（true）の整数として保存されます
    ///
    /// 【使用例】
    /// ```swift
    /// let isPinned = db.getBool(statement, at: 4)  // 5番目のカラムを真偽値として取得
    /// ```
    func getBool(_ statement: OpaquePointer, at index: Int32) -> Bool {
        // 1ならtrue、0ならfalseに変換
        return sqlite3_column_int(statement, index) == 1
    }

    /// WALチェックポイントを実行
    ///
    /// 【目的】
    /// 拡張キーボードでの書き込み（copyCountインクリメントなど）を
    /// メインDBファイルに即座に反映させるために使用します。
    ///
    /// 【WALモードとは】
    /// SQLiteのデフォルトのジャーナルモードはWAL（Write-Ahead Logging）です。
    /// WALモードでは、書き込みが一時的に.walファイルに記録され、
    /// チェックポイント時にメインDBにマージされます。
    ///
    /// 【なぜ必要か】
    /// 拡張キーボードとメインアプリは別プロセスで動作するため、
    /// 拡張キーボードでの書き込みがメインアプリに反映されない場合があります。
    /// チェックポイントを実行することで、確実に反映されます。
    ///
    /// 【スレッドセーフティ】
    /// dbQueue.syncでシリアルキューを使用し、複数スレッドからの同時アクセスを防ぎます
    func checkpoint() {
        dbQueue.sync {
            guard let db = db else {
                KeyboardLog.debug("[Database] ⚠️ checkpoint() called but database not opened")
                return
            }

            let result = sqlite3_wal_checkpoint_v2(
                db,
                nil,  /* すべてのデータベース */
                SQLITE_CHECKPOINT_FULL,  /* フルチェックポイント */
                nil,  /* 書き込まれたページ数（不要） */
                nil   /* チェックポイントされたページ数（不要） */
            )

            if result == SQLITE_OK {
                KeyboardLog.debug("[Database] ✅ WAL checkpoint completed")
            } else {
                let errorMsg = String(cString: sqlite3_errmsg(db))
                KeyboardLog.debug("[Database] ⚠️ WAL checkpoint failed: %@", errorMsg)
            }
        }
    }

    // MARK: - Errors（エラー型定義）

    /// データベース操作で発生する可能性のあるエラー
    ///
    /// 【各エラーの意味】
    /// - containerNotFound: App Groupsの共有コンテナが見つからない
    ///   → Xcodeのプロジェクト設定でApp Groupsが正しく設定されていない
    ///
    /// - fileNotFound: データベースファイルが存在しない
    ///   → メインアプリでまだデータベースが作成されていない
    ///   → ユーザーにメインアプリを先に起動するよう促す
    ///
    /// - openFailed: データベースを開くのに失敗
    ///   → ファイルが壊れている、権限がないなど
    ///
    /// - queryFailed: SQLクエリの実行に失敗
    ///   → SQL文の文法エラー、テーブルが存在しないなど
    enum DatabaseError: Error {
        case containerNotFound  // App Groups未設定
        case fileNotFound  // DBファイルが存在しない
        case openFailed(message: String)  // DB接続失敗（エラーメッセージ付き）
        case queryFailed(message: String)  // クエリ実行失敗（エラーメッセージ付き）
    }
}
