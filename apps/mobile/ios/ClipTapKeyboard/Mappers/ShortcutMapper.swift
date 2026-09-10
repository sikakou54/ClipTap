//
//  ShortcutMapper.swift
//  ClipTapKeyboard
//
//  ショートカットMapper（TypeScript版 ShortcutMapper.ts と同等）
//  拡張キーボードで必要な「取得」と「使用回数の記録」のみ実装
//

import Foundation
import SQLite3

class ShortcutMapper: BaseMapper {

    // MARK: - Singleton

    static let shared = ShortcutMapper()

    // MARK: - Constants

    /// ショートカット値のテーブル名
    /// BaseMapperのtableNameは親テーブル（shortcuts）を指すため、子テーブルは個別に保持する
    private let valueTableName = "shortcut_values"

    /// 更新日時を書き込むためのフォーマッタ
    ///
    /// メインアプリ（TypeScript版 getCurrentTimestamp）は new Date().toISOString() を保存しており、
    /// ミリ秒付きのUTC表記になる。同じ列へ別表記を混ぜると更新日時の比較や表示がずれるため、
    /// 小数秒付き・UTC固定のISO8601に揃える。
    /// 生成コストを毎回払わないよう1つだけ作って使い回す。
    private static let timestampFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        formatter.timeZone = TimeZone(identifier: "UTC")
        return formatter
    }()

    // MARK: - Initialization

    private init() {
        super.init(tableName: "shortcuts")
    }

    // MARK: - Read Operations

    /// 全ショートカットを値付きで取得（sortOrder順、値もsortOrder順）
    ///
    /// - Returns: ショートカットの配列（値は各ショートカットのvaluesに格納済み）
    ///
    /// 【値を1回のクエリでまとめて取る理由】
    /// ショートカットごとに値を問い合わせると、キーボードを開くたびに件数分のクエリが走る。
    /// 全件を1回で取り、ショートカットIDで振り分ける（TypeScript版 getAll() と同じ方針）。
    func getAll() -> [Shortcut] {
        let shortcutQuery = """
            SELECT id, name, sortOrder, createdAt, updatedAt
            FROM \(tableName)
            ORDER BY sortOrder ASC
        """

        let shortcuts: [Shortcut] = executeQuery(shortcutQuery) { statement in
            return self.mapShortcut(from: statement)
        }

        let valueQuery = """
            SELECT id, shortcutId, name, value, useCount, sortOrder, createdAt, updatedAt
            FROM \(valueTableName)
            ORDER BY shortcutId ASC, sortOrder ASC
        """

        let values: [ShortcutValue] = executeQuery(valueQuery) { statement in
            return self.mapShortcutValue(from: statement)
        }

        /* ショートカットIDごとに値をまとめる（1回の走査で振り分ける） */
        var valuesByShortcutId: [String: [ShortcutValue]] = [:]
        for value in values {
            valuesByShortcutId[value.shortcutId, default: []].append(value)
        }

        return shortcuts.map { shortcut in
            var resolved = shortcut
            resolved.values = valuesByShortcutId[shortcut.id] ?? []
            return resolved
        }
    }

    // MARK: - Write Operations

    /// ショートカット値の使用回数をインクリメントし、親ショートカットの更新日時を進める
    ///
    /// - Parameters:
    ///   - valueId: 挿入したショートカット値のID
    ///   - shortcutId: その値が属するショートカットのID
    ///
    /// 【親の更新日時も進める理由】
    /// メインアプリ側（TypeScript版 incrementUseCount）と同じ扱いにして、
    /// 更新日時順の並びに拡張キーボードからの利用も反映されるようにする。
    ///
    /// 【書き込み可否を判定しない理由】
    /// 共有DBへの書き込みはフルアクセスが無いと失敗する。
    /// ただし判定はビジネスロジックであり、Mapperは渡された指示を素直に実行する。
    /// 呼び出し可否は ShortcutService 側で判断する（SnippetService.isUsageTrackingEnabled と同じ）。
    func incrementUseCount(valueId: String, shortcutId: String) {
        let incrementQuery = """
            UPDATE \(valueTableName)
            SET useCount = useCount + 1
            WHERE id = ?
        """

        _ = executeUpdate(incrementQuery, parameters: [valueId])

        let touchQuery = """
            UPDATE \(tableName)
            SET updatedAt = ?
            WHERE id = ?
        """

        let now = Self.timestampFormatter.string(from: Date())
        _ = executeUpdate(touchQuery, parameters: [now, shortcutId])

        KeyboardLog.debug("[ShortcutMapper] ✅ Incremented useCount for value: %@", valueId)

        /* WALチェックポイントを実行してメインDBに即座に反映 */
        db.checkpoint()
    }

    // MARK: - Mapping

    /// SQLite結果からShortcutモデルにマッピング
    /// カラム順: id, name, sortOrder, createdAt, updatedAt
    private func mapShortcut(from statement: OpaquePointer) -> Shortcut {
        let id = getString(statement, at: 0) ?? ""
        let name = getString(statement, at: 1) ?? ""
        let sortOrder = getInt(statement, at: 2)
        let createdAt = getString(statement, at: 3) ?? ""
        let updatedAt = getString(statement, at: 4) ?? ""

        return Shortcut(
            id: id,
            name: name,
            sortOrder: sortOrder,
            createdAt: createdAt,
            updatedAt: updatedAt,
            values: []  /* 値はgetAllでまとめて差し込む */
        )
    }

    /// SQLite結果からShortcutValueモデルにマッピング
    /// カラム順: id, shortcutId, name, value, useCount, sortOrder, createdAt, updatedAt
    private func mapShortcutValue(from statement: OpaquePointer) -> ShortcutValue {
        let id = getString(statement, at: 0) ?? ""
        let shortcutId = getString(statement, at: 1) ?? ""
        let name = getString(statement, at: 2) ?? ""
        let value = getString(statement, at: 3) ?? ""
        let useCount = getInt(statement, at: 4)
        let sortOrder = getInt(statement, at: 5)
        let createdAt = getString(statement, at: 6) ?? ""
        let updatedAt = getString(statement, at: 7) ?? ""

        return ShortcutValue(
            id: id,
            shortcutId: shortcutId,
            name: name,
            value: value,
            useCount: useCount,
            sortOrder: sortOrder,
            createdAt: createdAt,
            updatedAt: updatedAt
        )
    }
}
