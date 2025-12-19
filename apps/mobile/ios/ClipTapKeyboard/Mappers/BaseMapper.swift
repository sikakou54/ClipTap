//
//  BaseMapper.swift
//  ClipTapKeyboard
//
//  基底Mapperクラス（TypeScript版 BaseMapper.ts と同等）
//

import Foundation
import SQLite3

class BaseMapper {

    // MARK: - Properties

    let db: Database
    let tableName: String

    // MARK: - Initialization

    init(tableName: String) {
        self.db = Database.shared
        self.tableName = tableName
    }

    // MARK: - Helper Methods

    /// SQLiteのカラム値を文字列として取得
    func getString(_ statement: OpaquePointer, at index: Int32) -> String? {
        return db.getString(statement, at: index)
    }

    /// SQLiteのカラム値を整数として取得
    func getInt(_ statement: OpaquePointer, at index: Int32) -> Int {
        return db.getInt(statement, at: index)
    }

    /// SQLiteのカラム値を真偽値として取得
    func getBool(_ statement: OpaquePointer, at index: Int32) -> Bool {
        return db.getBool(statement, at: index)
    }

    /// クエリを実行して結果を取得
    func executeQuery<T>(
        _ query: String,
        parameters: [Any] = [],
        transform: @escaping (OpaquePointer) -> T?
    ) -> [T] {
        let results = db.executeQuery(query, parameters: parameters, transform: transform)
        return results.compactMap { $0 as? T }
    }

    /// クエリを実行して単一の結果を取得
    func executeQuerySingle<T>(
        _ query: String,
        parameters: [Any] = [],
        transform: @escaping (OpaquePointer) -> T?
    ) -> T? {
        let results: [T] = executeQuery(query, parameters: parameters, transform: transform)
        return results.first
    }

    /// クエリを実行（結果を返さない）
    func executeUpdate(_ query: String, parameters: [Any] = []) -> Bool {
        return db.executeUpdate(query, parameters: parameters)
    }
}
