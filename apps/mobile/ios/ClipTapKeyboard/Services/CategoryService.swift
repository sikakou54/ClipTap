//
//  CategoryService.swift
//  ClipTapKeyboard
//
//  カテゴリビジネスロジック（TypeScript版 CategoryService.ts と同等）
//  読み取り専用操作のみ実装
//

import Foundation

class CategoryService {

    // MARK: - Singleton

    static let shared = CategoryService()

    // MARK: - Dependencies

    private let categoryMapper = CategoryMapper.shared

    // MARK: - Initialization

    private init() {}

    // MARK: - Read Operations

    /// 全カテゴリを取得
    func getAll() -> [Category] {
        return categoryMapper.getAll()
    }

    /// ID指定でカテゴリを取得
    func getById(_ id: String) -> Category? {
        return categoryMapper.getById(id)
    }

    /// 名前でカテゴリを取得
    func getByName(_ name: String) -> Category? {
        return categoryMapper.getByName(name)
    }
}
