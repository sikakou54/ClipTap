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

    /// 全プロファイルを取得（valid=1のみ）
    func getAll() -> [Profile] {
        let query = """
            SELECT id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt
            FROM \(tableName)
            WHERE valid = 1
            ORDER BY sortOrder ASC
        """

        // サブスクリプション制限を適用
        let limit = getSubscriptionLimit()
        var finalQuery = query
        if let limit = limit {
            finalQuery += " LIMIT \(limit)"
        }

        return executeQuery(finalQuery) { statement in
            return self.mapProfile(from: statement)
        }
    }

    /// 全プロファイルを取得（無効なものも含む）
    func getAllIncludingInvalid() -> [Profile] {
        let query = """
            SELECT id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt
            FROM \(tableName)
            ORDER BY sortOrder ASC
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

    // MARK: - Subscription Limits

    /// サブスクリプション制限を取得
    private func getSubscriptionLimit() -> Int? {
        _ = SubscriptionManager.shared.isPremiumSubscriber()
        // プロファイルは無料版でも無制限（validフラグでアプリ側が制御）
        return nil
    }

    // MARK: - Valid Flags Update

    /// validフラグを更新（サブスクリプション状態に応じて）
    ///
    /// 処理内容：
    /// 1. すべてのプロファイルのvalidを0にする
    /// 2. デフォルトプロファイルを優先し、sortOrder順でlimit件を有効化
    ///
    /// - Parameter limit: 有効にする最大プロファイル数（無料プランは3、デフォルト込み）
    func updateValidFlags(limit: Int) {
        print("[ProfileMapper] 🔄 updateValidFlags called with limit: \(limit)")

        guard let db = Database.shared.getDB() else {
            print("[ProfileMapper] ❌ Database not available")
            return
        }

        /* 1. すべて無効にする */
        let updateAllQuery = "UPDATE profiles SET valid = 0"
        var statement: OpaquePointer?

        if sqlite3_prepare_v2(db, updateAllQuery, -1, &statement, nil) == SQLITE_OK {
            if sqlite3_step(statement) == SQLITE_DONE {
                print("[ProfileMapper] ✅ Set all profiles to invalid")
            } else {
                let errorMsg = String(cString: sqlite3_errmsg(db))
                print("[ProfileMapper] ❌ Failed to set all invalid: \(errorMsg)")
            }
        }
        sqlite3_finalize(statement)

        /* 2. デフォルトプロファイルを優先し、sortOrder順でlimit件を有効化 */
        let updateLimitQuery = """
            UPDATE profiles
            SET valid = 1
            WHERE id IN (
                SELECT id FROM profiles
                ORDER BY isDefault DESC, sortOrder ASC
                LIMIT ?
            )
        """
        statement = nil

        if sqlite3_prepare_v2(db, updateLimitQuery, -1, &statement, nil) == SQLITE_OK {
            sqlite3_bind_int(statement, 1, Int32(limit))

            if sqlite3_step(statement) == SQLITE_DONE {
                print("[ProfileMapper] ✅ Set \(limit) profiles to valid (default first)")
            } else {
                let errorMsg = String(cString: sqlite3_errmsg(db))
                print("[ProfileMapper] ❌ Failed to set limit valid: \(errorMsg)")
            }
        }
        sqlite3_finalize(statement)

        print("[ProfileMapper] ✅ updateValidFlags completed successfully")
    }
}
