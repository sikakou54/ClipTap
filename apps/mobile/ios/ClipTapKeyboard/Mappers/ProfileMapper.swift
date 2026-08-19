//
//  ProfileMapper.swift
//  ClipTapKeyboard
//
//  プロファイルMapper（TypeScript版 ProfileMapper.ts と同等）
//  読み取り専用操作のみ実装
//

import Foundation
import SQLite3

class ProfileMapper: BaseMapper {

    // MARK: - Singleton

    static let shared = ProfileMapper()

    // MARK: - Initialization

    private init() {
        super.init(tableName: "profiles")
    }

    // MARK: - Read Operations

    /// 全プロファイルを取得（valid=1のみ、標準優先→表示順）
    func getAll() -> [Profile] {
        let query = """
            SELECT id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt
            FROM \(tableName)
            WHERE valid = 1
            ORDER BY isDefault DESC, sortOrder ASC
        """

        return executeQuery(query) { statement in
            return self.mapProfile(from: statement)
        }
    }

    /// 全プロファイルを取得（無効なものも含む、標準優先→表示順）
    func getAllIncludingInvalid() -> [Profile] {
        let query = """
            SELECT id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt
            FROM \(tableName)
            ORDER BY isDefault DESC, sortOrder ASC
        """

        return executeQuery(query) { statement in
            return self.mapProfile(from: statement)
        }
    }

    /// ID指定でプロファイルを取得
    func getById(_ id: String) -> Profile? {
        let query = """
            SELECT id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt
            FROM \(tableName)
            WHERE id = ?
        """

        return executeQuerySingle(query, parameters: [id]) { statement in
            return self.mapProfile(from: statement)
        }
    }

    /// 名前でプロファイルを取得
    func getByName(_ name: String) -> Profile? {
        let query = """
            SELECT id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt
            FROM \(tableName)
            WHERE name = ?
        """

        return executeQuerySingle(query, parameters: [name]) { statement in
            return self.mapProfile(from: statement)
        }
    }

    /// アクティブなプロファイルを取得（isActive=1）
    func getActive() -> Profile? {
        let query = """
            SELECT id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt
            FROM \(tableName)
            WHERE isActive = 1
            LIMIT 1
        """

        return executeQuerySingle(query) { statement in
            return self.mapProfile(from: statement)
        }
    }

    /// デフォルトプロファイルを取得（isDefault=1）
    func getDefault() -> Profile? {
        let query = """
            SELECT id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt
            FROM \(tableName)
            WHERE isDefault = 1
            LIMIT 1
        """

        return executeQuerySingle(query) { statement in
            return self.mapProfile(from: statement)
        }
    }

    /// プロファイル＋変数を取得
    func getWithVariables(_ id: String) -> ProfileWithVariables? {
        guard let profile = getById(id) else {
            return nil
        }

        let variables = ProfileVariableMapper.shared.getByProfileIdWithVariableNames(id)

        return ProfileWithVariables(
            profile: profile,
            variables: variables
        )
    }

    /// 全プロファイル＋変数を取得
    func getAllWithVariables() -> [ProfileWithVariables] {
        let profiles = getAll()

        return profiles.map { profile in
            let variables = ProfileVariableMapper.shared.getByProfileIdWithVariableNames(profile.id)
            return ProfileWithVariables(
                profile: profile,
                variables: variables
            )
        }
    }

    // MARK: - Mapping

    /// SQLite結果からProfileモデルにマッピング
    private func mapProfile(from statement: OpaquePointer) -> Profile {
        let id = getString(statement, at: 0) ?? ""
        let name = getString(statement, at: 1) ?? ""
        let isActive = getBool(statement, at: 2)
        let isDefault = getBool(statement, at: 3)
        let valid = getBool(statement, at: 4)
        let sortOrder = getInt(statement, at: 5)
        let createdAt = getString(statement, at: 6) ?? ""
        let updatedAt = getString(statement, at: 7) ?? ""

        return Profile(
            id: id,
            name: name,
            isActive: isActive,
            isDefault: isDefault,
            valid: valid,
            sortOrder: sortOrder,
            createdAt: createdAt,
            updatedAt: updatedAt
        )
    }

}
