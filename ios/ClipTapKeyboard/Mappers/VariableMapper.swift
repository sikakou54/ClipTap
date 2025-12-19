//
//  VariableMapper.swift
//  ClipTapKeyboard
//
//  変数Mapper（TypeScript版 VariableMapper.ts と同等）
//  読み取り専用操作のみ実装
//

import Foundation
import SQLite3

class VariableMapper: BaseMapper {

    // MARK: - Singleton

    static let shared = VariableMapper()

    // MARK: - Initialization

    private init() {
        super.init(tableName: "variables")
    }

    // MARK: - Read Operations

    /// 全変数を取得（valid=1のみ）
    func getAll() -> [Variable] {
        let query = """
            SELECT id, name, type, label, icon, valid, sortOrder, createdAt, updatedAt
            FROM \(tableName)
            WHERE valid = 1
            ORDER BY sortOrder ASC
        """

        return executeQuery(query) { statement in
            return self.mapVariable(from: statement)
        }
    }

    /// 全変数を取得（無効なものも含む）
    func getAllIncludingInvalid() -> [Variable] {
        let query = """
            SELECT id, name, type, label, icon, valid, sortOrder, createdAt, updatedAt
            FROM \(tableName)
            ORDER BY sortOrder ASC
        """

        return executeQuery(query) { statement in
            return self.mapVariable(from: statement)
        }
    }

    /// ID指定で変数を取得
    func getById(_ id: String) -> Variable? {
        let query = """
            SELECT id, name, type, label, icon, valid, sortOrder, createdAt, updatedAt
            FROM \(tableName)
            WHERE id = ?
        """

        return executeQuerySingle(query, parameters: [id]) { statement in
            return self.mapVariable(from: statement)
        }
    }

    /// 名前で変数を取得
    func getByName(_ name: String) -> Variable? {
        let query = """
            SELECT id, name, type, label, icon, valid, sortOrder, createdAt, updatedAt
            FROM \(tableName)
            WHERE name = ?
        """

        return executeQuerySingle(query, parameters: [name]) { statement in
            return self.mapVariable(from: statement)
        }
    }

    /// タイプ別に変数を取得
    func getByType(_ type: String) -> [Variable] {
        let query = """
            SELECT id, name, type, label, icon, valid, sortOrder, createdAt, updatedAt
            FROM \(tableName)
            WHERE type = ? AND valid = 1
            ORDER BY sortOrder ASC
        """

        return executeQuery(query, parameters: [type]) { statement in
            return self.mapVariable(from: statement)
        }
    }

    // MARK: - Mapping

    /// SQLite結果からVariableモデルにマッピング
    private func mapVariable(from statement: OpaquePointer) -> Variable {
        let id = getString(statement, at: 0) ?? ""
        let name = getString(statement, at: 1) ?? ""
        let type = getString(statement, at: 2) ?? ""
        let label = getString(statement, at: 3)
        let icon = getString(statement, at: 4)
        let valid = getBool(statement, at: 5)
        let sortOrder = getInt(statement, at: 6)
        let createdAt = getString(statement, at: 7) ?? ""
        let updatedAt = getString(statement, at: 8) ?? ""

        return Variable(
            id: id,
            name: name,
            type: type,
            label: label,
            icon: icon,
            valid: valid,
            sortOrder: sortOrder,
            createdAt: createdAt,
            updatedAt: updatedAt
        )
    }

    // MARK: - Valid Flags Update

    /// validフラグを更新（サブスクリプション状態に応じて）
    ///
    /// 処理内容：
    /// 1. customタイプの変数をすべて無効（valid=0）にする
    /// 2. 作成日時の古い順にlimit件を有効化（valid=1）
    ///
    /// 注意：systemタイプの変数は常に有効なので、更新対象外
    ///
    /// - Parameter limit: 有効にする最大カスタム変数数
    func updateValidFlags(limit: Int) {
        print("[VariableMapper] 🔄 updateValidFlags called with limit: \(limit)")

        guard let db = Database.shared.getDB() else {
            print("[VariableMapper] ❌ Database not available")
            return
        }

        do {
            // 1. customタイプの変数をすべて無効にする
            let updateAllQuery = "UPDATE variables SET valid = 0 WHERE type = 'custom'"
            var statement: OpaquePointer?

            if sqlite3_prepare_v2(db, updateAllQuery, -1, &statement, nil) == SQLITE_OK {
                if sqlite3_step(statement) == SQLITE_DONE {
                    print("[VariableMapper] ✅ Set all custom variables to invalid")
                } else {
                    let errorMsg = String(cString: sqlite3_errmsg(db))
                    print("[VariableMapper] ❌ Failed to set all invalid: \(errorMsg)")
                }
            }
            sqlite3_finalize(statement)

            // 2. sortOrder順にlimit件を有効化
            let updateLimitQuery = """
                UPDATE variables
                SET valid = 1
                WHERE id IN (
                    SELECT id FROM variables
                    WHERE type = 'custom'
                    ORDER BY sortOrder ASC
                    LIMIT ?
                )
            """
            statement = nil

            if sqlite3_prepare_v2(db, updateLimitQuery, -1, &statement, nil) == SQLITE_OK {
                sqlite3_bind_int(statement, 1, Int32(limit))

                if sqlite3_step(statement) == SQLITE_DONE {
                    print("[VariableMapper] ✅ Set \(limit) custom variables to valid")
                } else {
                    let errorMsg = String(cString: sqlite3_errmsg(db))
                    print("[VariableMapper] ❌ Failed to set limit valid: \(errorMsg)")
                }
            }
            sqlite3_finalize(statement)

            print("[VariableMapper] ✅ updateValidFlags completed successfully")

        } catch {
            print("[VariableMapper] ❌ updateValidFlags failed: \(error)")
        }
    }
}
