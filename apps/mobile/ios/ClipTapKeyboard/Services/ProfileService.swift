//
//  ProfileService.swift
//  ClipTapKeyboard
//
//  プロファイルビジネスロジック（TypeScript版 ProfileService.ts と同等）
//  読み取り専用操作のみ実装
//

import Foundation

class ProfileService {

    // MARK: - Singleton

    static let shared = ProfileService()

    // MARK: - Dependencies

    private let profileMapper = ProfileMapper.shared

    // MARK: - Initialization

    private init() {}

    // MARK: - Read Operations

    /// すべてのプロファイルを取得（有効なもののみ）
    func getAllProfiles() -> [Profile] {
        return profileMapper.getAll()
    }

    /// すべてのプロファイルを取得（無効なものも含む）
    func getAllProfilesIncludingInvalid() -> [Profile] {
        return profileMapper.getAllIncludingInvalid()
    }

    /// すべてのプロファイルを取得（変数込み）
    func getAllProfilesWithVariables() -> [ProfileWithVariables] {
        return profileMapper.getAllWithVariables()
    }

    /// IDでプロファイルを取得
    func getProfileById(_ id: String) -> Profile? {
        return profileMapper.getById(id)
    }

    /// プロファイルを取得（変数込み）
    func getProfileWithVariables(_ id: String) -> ProfileWithVariables? {
        return profileMapper.getWithVariables(id)
    }

    /// アクティブなプロファイルを取得
    func getActiveProfile() -> Profile? {
        return profileMapper.getActive()
    }

    /// アクティブなプロファイルを取得（変数込み）
    func getActiveProfileWithVariables() -> ProfileWithVariables? {
        guard let activeProfile = getActiveProfile() else {
            return nil
        }
        return profileMapper.getWithVariables(activeProfile.id)
    }

    /// デフォルトプロファイルを取得
    func getDefaultProfile() -> Profile? {
        return profileMapper.getDefault()
    }
}
