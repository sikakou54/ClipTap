//
//  VariableService.swift
//  ClipTapKeyboard
//
//  変数ビジネスロジック（TypeScript版 VariableService.ts と同等）
//  読み取り専用操作のみ実装
//

import Foundation
import os.log

let variableServiceLog = OSLog(subsystem: "com.sikakou.cliptap.keyboard", category: "VariableService")

class VariableService {

    // MARK: - Singleton

    static let shared = VariableService()

    // MARK: - Dependencies

    private let variableMapper = VariableMapper.shared
    private let profileVariableMapper = ProfileVariableMapper.shared
    private let profileMapper = ProfileMapper.shared

    // MARK: - Initialization

    private init() {}

    // MARK: - Read Operations

    /// 全カスタム変数を取得（有効なもののみ）
    func getAllCustomVariables() -> [Variable] {
        // Mapper側で既にsortOrder ASCでソート済み
        return variableMapper.getByType("custom")
    }

    /// 全カスタム変数を取得（無効なものも含む）
    func getAllCustomVariablesIncludingInvalid() -> [Variable] {
        // Mapper側で既にsortOrder ASCでソート済み
        return variableMapper.getAllIncludingInvalid().filter { $0.type == "custom" }
    }

    /// プロファイルIDで変数名と値のマップを取得
    func getVariablesMap(for profileId: String) -> [String: String] {
        os_log("📝 Getting variables map for profile: %@", log: variableServiceLog, type: .info, profileId)
        NSLog("📝 [VariableService] Getting variables map for profile: %@", profileId)

        let map = profileVariableMapper.getByProfileIdWithVariableNames(profileId)

        os_log("📝 Retrieved %d custom variable(s)", log: variableServiceLog, type: .info, map.count)
        NSLog("📝 [VariableService] Retrieved %d custom variable(s): %@", map.count, map.description)

        return map
    }

    /// 変数の標準値を取得（デフォルトプロファイルの値）
    func getStandardValue(variableName: String) -> String {
        guard let defaultProfile = profileMapper.getDefault() else {
            return ""
        }

        let variablesMap = profileVariableMapper.getByProfileIdWithVariableNames(defaultProfile.id)
        return variablesMap[variableName] ?? ""
    }

    /// IDで変数を取得
    func getVariableById(_ id: String) -> Variable? {
        return variableMapper.getById(id)
    }

    /// 名前で変数を取得
    func getVariableByName(_ name: String) -> Variable? {
        return variableMapper.getByName(name)
    }

    /// タイプで変数を取得
    func getVariablesByType(_ type: String) -> [Variable] {
        return variableMapper.getByType(type)
    }
}
