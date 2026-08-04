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

}
