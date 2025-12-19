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

let profileVariableMapperLog = OSLog(subsystem: "com.sikakou.cliptap.keyboard", category: "ProfileVariableMapper")

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
        os_log("📝 Getting variables for profile: %@", log: profileVariableMapperLog, type: .info, profileId)
        NSLog("📝 [ProfileVariableMapper] Getting variables for profile: %@", profileId)

        // まず、全変数を確認
        let debugQuery1 = "SELECT id, name, type, valid FROM variables"
        os_log("📝 [Debug] All variables in DB:", log: profileVariableMapperLog, type: .info)
        NSLog("📝 [Debug] All variables in DB:")
        let _ = executeQuery(debugQuery1, parameters: []) { statement -> String? in
            let id = self.getString(statement, at: 0) ?? ""
            let name = self.getString(statement, at: 1) ?? ""
            let type = self.getString(statement, at: 2) ?? ""
            let valid = self.getInt(statement, at: 3)
            os_log("    - Variable: id=%@, name=%@, type=%@, valid=%d", log: profileVariableMapperLog, type: .info, id, name, type, valid)
            NSLog("    - Variable: id=%@, name=%@, type=%@, valid=%d", id, name, type, valid)
            return nil
        }

        // まず、profile_variablesテーブルの全行数を確認
        let countQuery = "SELECT COUNT(*) FROM profile_variables"
        let totalCount = executeQuery(countQuery, parameters: []) { statement -> Int? in
            return Int(sqlite3_column_int(statement, 0))
        }.first ?? 0
        os_log("📝 [Debug] Total profile_variables count: %d", log: profileVariableMapperLog, type: .info, totalCount)
        NSLog("📝 [Debug] Total profile_variables count: %d", totalCount)

        // 次に、該当プロファイルの変数値を確認
        let debugQuery2 = "SELECT profileId, variableId, value FROM profile_variables WHERE profileId = ?"
        os_log("📝 [Debug] Profile variables for profileId=%@:", log: profileVariableMapperLog, type: .info, profileId)
        NSLog("📝 [Debug] Profile variables for profileId=%@:", profileId)
        let pvResults = executeQuery(debugQuery2, parameters: [profileId]) { statement -> String? in
            let pId = self.getString(statement, at: 0) ?? ""
            let vId = self.getString(statement, at: 1) ?? ""
            let val = self.getString(statement, at: 2) ?? ""
            os_log("    - ProfileVariable: profileId=%@, variableId=%@, value=%@", log: profileVariableMapperLog, type: .info, pId, vId, val)
            NSLog("    - ProfileVariable: profileId=%@, variableId=%@, value=%@", pId, vId, val)
            return "\(pId):\(vId)"
        }
        os_log("📝 [Debug] Found %d profile_variables for this profile", log: profileVariableMapperLog, type: .info, pvResults.count)
        NSLog("📝 [Debug] Found %d profile_variables for this profile", pvResults.count)

        let query = """
            SELECT v.name, pv.value
            FROM \(tableName) pv
            INNER JOIN variables v ON pv.variableId = v.id
            WHERE pv.profileId = ? AND v.type = 'custom' AND v.valid = 1
            ORDER BY pv.createdAt ASC
        """

        let finalQuery = query

        os_log("📝 Query: %@", log: profileVariableMapperLog, type: .info, finalQuery)
        NSLog("📝 [ProfileVariableMapper] Query: %@", finalQuery)
        os_log("📝 Parameters: [%@]", log: profileVariableMapperLog, type: .info, profileId)
        NSLog("📝 [ProfileVariableMapper] Parameters: [%@]", profileId)

        var result: [String: String] = [:]

        let rows = executeQuery(finalQuery, parameters: [profileId]) { statement -> (String, String)? in
            guard let name = self.getString(statement, at: 0),
                  let value = self.getString(statement, at: 1) else {
                return nil
            }
            os_log("  ✅ Found variable: %@ = %@", log: profileVariableMapperLog, type: .info, name, value)
            NSLog("  ✅ Found variable: %@ = %@", name, value)
            return (name, value)
        }

        for (name, value) in rows {
            result[name] = value
        }

        os_log("📝 Total variables: %d", log: profileVariableMapperLog, type: .info, result.count)
        NSLog("📝 [ProfileVariableMapper] Total variables: %d", result.count)
        os_log("📝 Result map: %@", log: profileVariableMapperLog, type: .info, result.description)
        NSLog("📝 [ProfileVariableMapper] Result map: %@", result.description)
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
