//
//  VariableService.swift
//  ClipTapKeyboard
//
//  変数ビジネスロジック（TypeScript版 VariableService.ts と同等）
//  読み取り専用操作のみ実装
//

import Foundation
import os.log

let variableServiceLog = OSLog.disabled

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
        var map: [String: String] = [:]
        if let defaultProfile = profileMapper.getDefault() {
            map = profileVariableMapper.getByProfileIdWithVariableNames(defaultProfile.id)
                .filter { !$0.value.isEmpty }
        }
        let profileMap = profileVariableMapper.getByProfileIdWithVariableNames(profileId)
        for (name, value) in profileMap where !value.isEmpty {
            map[name] = value
        }

        KeyboardLog.debug("[VariableService] Loaded %d custom variable(s)", map.count)

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
