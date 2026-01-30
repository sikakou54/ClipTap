//
//  SnippetMapper.swift
//  ClipTapKeyboard
//
//  スニペットMapper（TypeScript版 SnippetMapper.ts と同等）
//  読み取り専用操作のみ実装
//

import Foundation
import SQLite3

class SnippetMapper: BaseMapper {

    // MARK: - Singleton

    static let shared = SnippetMapper()

    // MARK: - Initialization

    private init() {
        super.init(tableName: "snippets")
    }

    // MARK: - Read Operations

    /// ID指定でスニペットを取得
    func getById(_ id: String) -> Snippet? {
        let query = """
            SELECT id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt
            FROM \(tableName)
            WHERE id = ?
        """

        return executeQuerySingle(query, parameters: [id]) { statement in
            return self.mapSnippet(from: statement)
        }
    }

    /// 全スニペットを取得（プロファイルフィルタ対応）
    func getAll(filterByProfileId profileId: String? = nil) -> [Snippet] {
        var query: String
        var parameters: [Any] = []

        if let profileId = profileId {
            /* プロファイル指定: snippet_profilesに登録されていない or 指定プロファイルに紐付くスニペット */
            query = """
                SELECT DISTINCT s.id, s.title, s.content, s.categoryId, s.copyWithTitle, s.copyCount, s.createdAt, s.updatedAt
                FROM \(tableName) s
                WHERE s.id NOT IN (SELECT snippetId FROM snippet_profiles)
                   OR s.id IN (SELECT snippetId FROM snippet_profiles WHERE profileId = ?)
                ORDER BY s.createdAt DESC
            """
            parameters = [profileId]
        } else {
            /* プロファイル未指定: 全スニペット */
            query = """
                SELECT id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt
                FROM \(tableName)
                ORDER BY createdAt DESC
            """
        }

        return executeQuery(query, parameters: parameters) { statement in
            return self.mapSnippet(from: statement)
        }
    }

    /// カテゴリ別にスニペットを取得（プロファイルフィルタ対応）
    func getByCategoryId(_ categoryId: String, filterByProfileId profileId: String? = nil) -> [Snippet] {
        var query: String
        var parameters: [Any] = [categoryId]

        if let profileId = profileId {
            query = """
                SELECT DISTINCT s.id, s.title, s.content, s.categoryId, s.copyWithTitle, s.copyCount, s.createdAt, s.updatedAt
                FROM \(tableName) s
                WHERE s.categoryId = ?
                  AND (s.id NOT IN (SELECT snippetId FROM snippet_profiles)
                   OR s.id IN (SELECT snippetId FROM snippet_profiles WHERE profileId = ?))
                ORDER BY s.createdAt DESC
            """
            parameters.append(profileId)
        } else {
            query = """
                SELECT id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt
                FROM \(tableName)
                WHERE categoryId = ?
                ORDER BY createdAt DESC
            """
        }

        return executeQuery(query, parameters: parameters) { statement in
            return self.mapSnippet(from: statement)
        }
    }

    /// スニペットを検索（タイトル・内容でLIKE検索）
    func search(query searchQuery: String, categoryId: String? = nil, filterByProfileId profileId: String? = nil) -> [Snippet] {
        var query: String
        var parameters: [Any] = ["%\(searchQuery)%", "%\(searchQuery)%"]

        if let profileId = profileId {
            if let categoryId = categoryId {
                query = """
                    SELECT DISTINCT s.id, s.title, s.content, s.categoryId, s.copyWithTitle, s.copyCount, s.createdAt, s.updatedAt
                    FROM \(tableName) s
                    WHERE (s.title LIKE ? OR s.content LIKE ?)
                      AND s.categoryId = ?
                      AND (s.id NOT IN (SELECT snippetId FROM snippet_profiles)
                       OR s.id IN (SELECT snippetId FROM snippet_profiles WHERE profileId = ?))
                    ORDER BY s.createdAt DESC
                """
                parameters.append(categoryId)
                parameters.append(profileId)
            } else {
                query = """
                    SELECT DISTINCT s.id, s.title, s.content, s.categoryId, s.copyWithTitle, s.copyCount, s.createdAt, s.updatedAt
                    FROM \(tableName) s
                    WHERE (s.title LIKE ? OR s.content LIKE ?)
                      AND (s.id NOT IN (SELECT snippetId FROM snippet_profiles)
                       OR s.id IN (SELECT snippetId FROM snippet_profiles WHERE profileId = ?))
                    ORDER BY s.createdAt DESC
                """
                parameters.append(profileId)
            }
        } else {
            if let categoryId = categoryId {
                query = """
                    SELECT id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt
                    FROM \(tableName)
                    WHERE (title LIKE ? OR content LIKE ?) AND categoryId = ?
                    ORDER BY createdAt DESC
                """
                parameters.append(categoryId)
            } else {
                query = """
                    SELECT id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt
                    FROM \(tableName)
                    WHERE title LIKE ? OR content LIKE ?
                    ORDER BY createdAt DESC
                """
            }
        }

        return executeQuery(query, parameters: parameters) { statement in
            return self.mapSnippet(from: statement)
        }
    }

    /// スニペットのプロファイルIDを取得（snippet_profilesから）
    func getProfileIds(for snippetId: String) -> [String] {
        let query = """
            SELECT profileId
            FROM snippet_profiles
            WHERE snippetId = ?
        """

        return executeQuery(query, parameters: [snippetId]) { statement in
            return self.getString(statement, at: 0)
        }.compactMap { $0 }
    }

    // MARK: - Write Operations

    /// スニペットのコピー回数をインクリメント
    /// 拡張キーボードでスニペットを使用した際に呼び出し、使用頻度を記録する
    /// TypeScript版 SnippetMapper.incrementCopyCount() と同等
    func incrementCopyCount(for snippetId: String) {
        let query = """
            UPDATE \(tableName)
            SET copyCount = copyCount + 1
            WHERE id = ?
        """

        _ = executeUpdate(query, parameters: [snippetId])
        NSLog("[SnippetMapper] ✅ Incremented copyCount for snippet: %@", snippetId)
    }

    // MARK: - Mapping

    /// SQLite結果からSnippetモデルにマッピング
    /// カラム順: id, title, content, categoryId, copyWithTitle, copyCount, createdAt, updatedAt
    private func mapSnippet(from statement: OpaquePointer) -> Snippet {
        let id = getString(statement, at: 0) ?? ""
        let title = getString(statement, at: 1)
        let content = getString(statement, at: 2) ?? ""
        let categoryId = getString(statement, at: 3)
        let copyWithTitle = getBool(statement, at: 4)
        let copyCount = getInt(statement, at: 5)
        let createdAt = getString(statement, at: 6) ?? ""
        let updatedAt = getString(statement, at: 7) ?? ""

        return Snippet(
            id: id,
            title: title,
            content: content,
            categoryId: categoryId,
            copyWithTitle: copyWithTitle,
            copyCount: copyCount,
            createdAt: createdAt,
            updatedAt: updatedAt,
            profileIds: []  /* 遅延ロード */
        )
    }
}
