//
//  Models.swift
//  ClipTapKeyboard
//
//  データモデル定義（TypeScript版と完全互換）
//

import Foundation

// MARK: - Snippet

struct Snippet {
    let id: String
    let title: String?
    let content: String
    let categoryId: String?
    let copyWithTitle: Bool
    let createdAt: String
    let updatedAt: String
    var profileIds: [String] = []  // snippet_profilesから取得（遅延ロード）
}

// MARK: - Category

struct Category {
    let id: String
    let name: String
    let color: String?
    let sortOrder: Int
    let createdAt: String
}

// MARK: - Profile

struct Profile {
    let id: String
    let name: String
    let isActive: Bool
    let isDefault: Bool
    let valid: Bool
    let sortOrder: Int
    let createdAt: String
    let updatedAt: String
}

// MARK: - Variable

struct Variable {
    let id: String
    let name: String
    let type: String  // 'custom' | 'system'
    let label: String?
    let icon: String?
    let valid: Bool
    let sortOrder: Int
    let createdAt: String
    let updatedAt: String
}

// MARK: - ProfileVariable

struct ProfileVariable {
    let id: String
    let profileId: String
    let variableId: String
    let value: String
    let createdAt: String
    let updatedAt: String
}

// MARK: - ProfileWithVariables (JOIN結果用)

struct ProfileWithVariables {
    let profile: Profile
    let variables: [String: String]  // variableName: value
}
