//
//  CategoryMapper.swift
//  ClipTapKeyboard
//
//  カテゴリMapper（TypeScript版 CategoryMapper.ts と同等）
//  読み取り専用操作のみ実装
//

import Foundation
import SQLite3

class CategoryMapper: BaseMapper {

    // MARK: - Singleton

    static let shared = CategoryMapper()

    // MARK: - Initialization

    private init() {
        super.init(tableName: "categories")
    }

    // MARK: - Read Operations

    /// ID指定でカテゴリを取得
    func getById(_ id: String) -> Category? {
        let query = """
            SELECT id, name, color, sortOrder, createdAt
            FROM \(tableName)
            WHERE id = ?
        """

        return executeQuerySingle(query, parameters: [id]) { statement in
            return self.mapCategory(from: statement)
        }
    }

    /// 全カテゴリを取得
    func getAll() -> [Category] {
        let query = """
            SELECT id, name, color, sortOrder, createdAt
            FROM \(tableName)
            ORDER BY sortOrder ASC
        """

        return executeQuery(query) { statement in
            return self.mapCategory(from: statement)
        }
    }

    /// 名前でカテゴリを取得
    func getByName(_ name: String) -> Category? {
        let query = """
            SELECT id, name, color, sortOrder, createdAt
            FROM \(tableName)
            WHERE name = ?
        """

        return executeQuerySingle(query, parameters: [name]) { statement in
            return self.mapCategory(from: statement)
        }
    }

    // MARK: - Mapping

    /// SQLite結果からCategoryモデルにマッピング
    private func mapCategory(from statement: OpaquePointer) -> Category {
        let id = getString(statement, at: 0) ?? ""
        let name = getString(statement, at: 1) ?? ""
        let color = getString(statement, at: 2)
        let sortOrder = getInt(statement, at: 3)
        let createdAt = getString(statement, at: 4) ?? ""

        return Category(
            id: id,
            name: name,
            color: color,
            sortOrder: sortOrder,
            createdAt: createdAt
        )
    }
}
