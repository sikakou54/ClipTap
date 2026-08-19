//
//  ProfileVariableMapper.swift
//  ClipTapKeyboard
//
//  プロファイル変数Mapper（TypeScript版 ProfileVariableMapper.ts と同等）
//  読み取り専用操作のみ実装
//

import Foundation
import SQLite3
import os.log

let profileVariableMapperLog = OSLog.disabled

class ProfileVariableMapper: BaseMapper {

    // MARK: - Singleton

    static let shared = ProfileVariableMapper()

    // MARK: - Initialization

    private init() {
        super.init(tableName: "profile_variables")
    }

    // MARK: - Read Operations

    /// プロファイルIDでプロファイル変数を取得
    func getByProfileId(_ profileId: String) -> [ProfileVariable] {
        let query = """
            SELECT id, profileId, variableId, value, createdAt, updatedAt
            FROM \(tableName)
            WHERE profileId = ?
            ORDER BY createdAt ASC
        """

        return executeQuery(query, parameters: [profileId]) { statement in
            return self.mapProfileVariable(from: statement)
        }
    }

    /// プロファイルIDで変数名と値のマップを取得（JOIN使用）
    func getByProfileIdWithVariableNames(_ profileId: String) -> [String: String] {
        let query = """
            SELECT v.name, pv.value
            FROM \(tableName) pv
            INNER JOIN variables v ON pv.variableId = v.id
            WHERE pv.profileId = ? AND v.type = 'custom' AND v.valid = 1
            ORDER BY pv.createdAt ASC
        """

        var result: [String: String] = [:]

        let rows = executeQuery(query, parameters: [profileId]) { statement -> (String, String)? in
            guard let name = self.getString(statement, at: 0),
                  let value = self.getString(statement, at: 1) else {
                return nil
            }
            return (name, value)
        }

        for (name, value) in rows {
            result[name] = value
        }

        KeyboardLog.debug("[ProfileVariableMapper] Loaded %d variable value(s)", result.count)
        return result
    }

    /// ID指定でプロファイル変数を取得
    func getById(_ id: String) -> ProfileVariable? {
        let query = """
            SELECT id, profileId, variableId, value, createdAt, updatedAt
            FROM \(tableName)
            WHERE id = ?
        """

        return executeQuerySingle(query, parameters: [id]) { statement in
            return self.mapProfileVariable(from: statement)
        }
    }

    /// プロファイルID＋変数IDでプロファイル変数を取得
    func getByProfileIdAndVariableId(profileId: String, variableId: String) -> ProfileVariable? {
        let query = """
            SELECT id, profileId, variableId, value, createdAt, updatedAt
            FROM \(tableName)
            WHERE profileId = ? AND variableId = ?
        """

        return executeQuerySingle(query, parameters: [profileId, variableId]) { statement in
            return self.mapProfileVariable(from: statement)
        }
    }

    // MARK: - Mapping

    /// SQLite結果からProfileVariableモデルにマッピング
    private func mapProfileVariable(from statement: OpaquePointer) -> ProfileVariable {
        let id = getString(statement, at: 0) ?? ""
        let profileId = getString(statement, at: 1) ?? ""
        let variableId = getString(statement, at: 2) ?? ""
        let value = getString(statement, at: 3) ?? ""
        let createdAt = getString(statement, at: 4) ?? ""
        let updatedAt = getString(statement, at: 5) ?? ""

        return ProfileVariable(
            id: id,
            profileId: profileId,
            variableId: variableId,
            value: value,
            createdAt: createdAt,
            updatedAt: updatedAt
        )
    }

}
