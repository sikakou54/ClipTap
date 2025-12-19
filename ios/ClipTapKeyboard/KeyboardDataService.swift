//
//  KeyboardDataService.swift
//  ClipTapKeyboard
//
//  SQLiteデータベースからのデータ読み込みサービス
//

import Foundation
import SQLite3

class KeyboardDataService {

    // MARK: - Singleton

    static let shared = KeyboardDataService()

    // MARK: - Properties

    private var db: OpaquePointer?
    private let appGroupIdentifier = "group.com.sikakou.cliptap"

    // MARK: - Initialization

    private init() {}

    deinit {
        closeDatabase()
    }

    // MARK: - Database Operations

    func openDatabase() throws {
        // 既に開いている場合は何もしない
        if db != nil {
            print("[KeyboardDataService] Database already open")
            return
        }

        // App Groups の共有コンテナを取得
        print("[KeyboardDataService] Getting container URL for: \(appGroupIdentifier)")
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupIdentifier
        ) else {
            print("[KeyboardDataService] ❌ Container not found for: \(appGroupIdentifier)")
            throw DatabaseError.containerNotFound
        }

        print("[KeyboardDataService] ✅ Container URL: \(containerURL.path)")

        // データベースファイルのパス
        let dbPath = containerURL
            .appendingPathComponent("databases")
            .appendingPathComponent("cliptap.db")
            .path

        print("[KeyboardDataService] Attempting to open database at: \(dbPath)")

        // ファイルが存在するか確認
        let fileExists = FileManager.default.fileExists(atPath: dbPath)
        print("[KeyboardDataService] Database file exists: \(fileExists)")

        if fileExists {
            // ファイルサイズを確認
            if let attributes = try? FileManager.default.attributesOfItem(atPath: dbPath),
               let fileSize = attributes[.size] as? Int64 {
                print("[KeyboardDataService] Database file size: \(fileSize) bytes")
            }
        }

        // データベースを読み取り専用で開く
        let result = sqlite3_open_v2(
            dbPath,
            &db,
            SQLITE_OPEN_READONLY,
            nil
        )

        if result != SQLITE_OK {
            let errorMsg = String(cString: sqlite3_errmsg(db))
            print("[KeyboardDataService] ❌ Failed to open database: \(errorMsg)")
            throw DatabaseError.openFailed(message: errorMsg)
        }

        print("[KeyboardDataService] ✅ Database opened successfully at: \(dbPath)")
    }

    func closeDatabase() {
        if db != nil {
            sqlite3_close(db)
            db = nil
            print("[KeyboardDataService] Database closed")
        }
    }

    // MARK: - Data Loading

    func loadProfiles() -> [Profile] {
        guard let db = db else {
            print("[KeyboardDataService] Database not opened")
            return []
        }

        var profiles: [Profile] = []
        let query = """
            SELECT id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt
            FROM profiles
            WHERE valid = 1
            ORDER BY sortOrder ASC
        """

        var statement: OpaquePointer?
        if sqlite3_prepare_v2(db, query, -1, &statement, nil) == SQLITE_OK {
            while sqlite3_step(statement) == SQLITE_ROW {
                let id = String(cString: sqlite3_column_text(statement, 0))
                let name = String(cString: sqlite3_column_text(statement, 1))
                let isActive = sqlite3_column_int(statement, 2) == 1
                let isDefault = sqlite3_column_int(statement, 3) == 1
                let valid = sqlite3_column_int(statement, 4) == 1
                let sortOrder = Int(sqlite3_column_int(statement, 5))
                let createdAt = String(cString: sqlite3_column_text(statement, 6))
                let updatedAt = String(cString: sqlite3_column_text(statement, 7))

                profiles.append(Profile(
                    id: id,
                    name: name,
                    isActive: isActive,
                    isDefault: isDefault,
                    valid: valid,
                    sortOrder: sortOrder,
                    createdAt: createdAt,
                    updatedAt: updatedAt
                ))
            }
        } else {
            print("[KeyboardDataService] Failed to prepare statement: \(String(cString: sqlite3_errmsg(db)))")
        }
        sqlite3_finalize(statement)

        return profiles
    }

    func loadCategories() -> [Category] {
        guard let db = db else {
            print("[KeyboardDataService] Database not opened")
            return []
        }

        var categories: [Category] = []
        let query = """
            SELECT id, name, color, sortOrder, createdAt
            FROM categories
            ORDER BY sortOrder ASC
        """

        var statement: OpaquePointer?
        if sqlite3_prepare_v2(db, query, -1, &statement, nil) == SQLITE_OK {
            while sqlite3_step(statement) == SQLITE_ROW {
                let id = String(cString: sqlite3_column_text(statement, 0))
                let name = String(cString: sqlite3_column_text(statement, 1))
                let colorPtr = sqlite3_column_text(statement, 2)
                let color = colorPtr != nil ? String(cString: colorPtr!) : nil
                let sortOrder = Int(sqlite3_column_int(statement, 3))
                let createdAt = String(cString: sqlite3_column_text(statement, 4))

                categories.append(Category(
                    id: id,
                    name: name,
                    color: color,
                    sortOrder: sortOrder,
                    createdAt: createdAt
                ))
            }
        } else {
            print("[KeyboardDataService] Failed to prepare statement: \(String(cString: sqlite3_errmsg(db)))")
        }
        sqlite3_finalize(statement)

        return categories
    }

    func loadSnippets(profileId: String, categoryId: String? = nil) -> [Snippet] {
        guard let db = db else {
            print("[KeyboardDataService] ❌ Database not opened")
            return []
        }

        print("[KeyboardDataService] 📖 Loading snippets for profile: \(profileId)")

        // サブスクリプション制限を適用
        let isPremium = SubscriptionManager.shared.isPremiumSubscriber()
        let limit = isPremium ? nil : SubscriptionLimits.freeMaxSnippets
        print("[KeyboardDataService] isPremium: \(isPremium), limit: \(limit ?? 999)")

        var snippets: [Snippet] = []

        // アプリと同じロジック: snippet_profilesに登録されていない(全環境共通)か、指定プロファイルのスニペット
        var query = """
            SELECT DISTINCT s.id, s.title, s.content, s.categoryId, s.copyWithTitle, s.createdAt, s.updatedAt
            FROM snippets s
            WHERE s.id NOT IN (SELECT snippetId FROM snippet_profiles)
               OR s.id IN (SELECT snippetId FROM snippet_profiles WHERE profileId = ?)
        """

        // カテゴリフィルター
        if categoryId != nil {
            query += " AND s.categoryId = ?"
        }

        query += " ORDER BY s.createdAt ASC"

        // 無料版の場合は件数制限
        if let limit = limit {
            query += " LIMIT \(limit)"
        }

        print("[KeyboardDataService] 📝 SQL Query:\n\(query)")
        print("[KeyboardDataService] 🔑 Binding profileId: \(profileId)")

        var statement: OpaquePointer?
        let prepareResult = sqlite3_prepare_v2(db, query, -1, &statement, nil)

        if prepareResult == SQLITE_OK {
            print("[KeyboardDataService] ✅ Statement prepared successfully")

            // バインド: profileId（必須）
            sqlite3_bind_text(statement, 1, profileId, -1, nil)

            // バインド: categoryId（オプション）
            if let categoryId = categoryId {
                print("[KeyboardDataService] 🔑 Binding categoryId: \(categoryId)")
                sqlite3_bind_text(statement, 2, categoryId, -1, nil)
            }

            var rowCount = 0
            while sqlite3_step(statement) == SQLITE_ROW {
                rowCount += 1
                let id = String(cString: sqlite3_column_text(statement, 0))
                let titlePtr = sqlite3_column_text(statement, 1)
                let title = titlePtr != nil ? String(cString: titlePtr!) : nil
                let content = String(cString: sqlite3_column_text(statement, 2))
                let categoryIdPtr = sqlite3_column_text(statement, 3)
                let categoryId = categoryIdPtr != nil ? String(cString: categoryIdPtr!) : nil
                let copyWithTitle = sqlite3_column_int(statement, 4) == 1
                let createdAt = String(cString: sqlite3_column_text(statement, 5))
                let updatedAt = String(cString: sqlite3_column_text(statement, 6))

                print("[KeyboardDataService] 📄 Row \(rowCount): id=\(id), title=\(title ?? "nil")")

                snippets.append(Snippet(
                    id: id,
                    title: title,
                    content: content,
                    categoryId: categoryId,
                    copyWithTitle: copyWithTitle,
                    createdAt: createdAt,
                    updatedAt: updatedAt
                ))
            }
            print("[KeyboardDataService] 📊 Total rows read: \(rowCount)")
        } else {
            let errorMsg = String(cString: sqlite3_errmsg(db))
            print("[KeyboardDataService] ❌ Failed to prepare statement: \(errorMsg)")
            print("[KeyboardDataService] ❌ Error code: \(prepareResult)")
        }
        sqlite3_finalize(statement)

        print("[KeyboardDataService] ✅ Loaded \(snippets.count) snippets for profile: \(profileId)")
        return snippets
    }

    func loadProfileVariables(profileId: String) -> [String: String] {
        guard let db = db else {
            print("[KeyboardDataService] Database not opened")
            return [:]
        }

        // サブスクリプション制限を適用
        let isPremium = SubscriptionManager.shared.isPremiumSubscriber()
        let limit = isPremium ? nil : SubscriptionLimits.freeMaxVariables

        var variablesMap: [String: String] = [:]
        var query = """
            SELECT pv.value, v.name
            FROM profile_variables pv
            INNER JOIN variables v ON pv.variableId = v.id
            WHERE pv.profileId = ? AND v.type = 'custom' AND v.valid = 1
            ORDER BY v.sortOrder ASC
        """

        // 無料版の場合は件数制限
        if let limit = limit {
            query += " LIMIT \(limit)"
        }

        var statement: OpaquePointer?
        if sqlite3_prepare_v2(db, query, -1, &statement, nil) == SQLITE_OK {
            sqlite3_bind_text(statement, 1, profileId, -1, nil)

            while sqlite3_step(statement) == SQLITE_ROW {
                let value = String(cString: sqlite3_column_text(statement, 0))
                let name = String(cString: sqlite3_column_text(statement, 1))
                variablesMap[name] = value
            }
        } else {
            print("[KeyboardDataService] Failed to prepare statement: \(String(cString: sqlite3_errmsg(db)))")
        }
        sqlite3_finalize(statement)

        return variablesMap
    }

    // MARK: - Errors

    enum DatabaseError: Error {
        case containerNotFound
        case openFailed(message: String)
    }
}
