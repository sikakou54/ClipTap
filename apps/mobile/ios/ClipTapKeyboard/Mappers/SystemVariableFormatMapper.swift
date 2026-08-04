import Foundation

final class SystemVariableFormatMapper: BaseMapper {
    private struct FormatRow {
        let key: String
        let pattern: String
    }

    static let shared = SystemVariableFormatMapper()

    private static let validPatterns: [String: Set<String>] = [
        "today": ["yyyy/MM/dd", "yyyy-MM-dd", "yyyy年M月d日", "yyyy年MM月dd日", "M/d", "MM/dd", "M/d/yyyy", "yyyy/MM/dd(EEE)", "M月d日(EEE)"],
        "now": ["yyyy/MM/dd HH:mm:ss", "yyyy/MM/dd HH:mm", "yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd HH:mm", "yyyy年M月d日 HH時mm分", "M/d HH:mm"],
        "time": ["HH:mm", "HH:mm:ss", "H:mm", "HH時mm分"],
        "year": ["yyyy", "yy", "yyyy年"],
        "month": ["MM", "M", "M月", "MM月"],
        "day": ["dd", "d", "d日", "dd日"],
        "weekday": ["EEE", "EEEE", "(EEE)"],
    ]

    private init() {
        super.init(tableName: "system_variable_formats")
    }

    func getAll() -> [String: String] {
        let tableExists = executeQuerySingle(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
            parameters: [tableName]
        ) { statement in
            self.getString(statement, at: 0)
        } != nil

        guard tableExists else { return [:] }

        let rows: [FormatRow] = executeQuery(
            "SELECT variableKey, pattern FROM system_variable_formats"
        ) { statement in
            guard
                let key = self.getString(statement, at: 0),
                let pattern = self.getString(statement, at: 1)
            else {
                return nil
            }
            return FormatRow(key: key, pattern: pattern)
        }

        return rows.reduce(into: [String: String]()) { result, row in
            if SystemVariableFormatMapper.validPatterns[row.key]?.contains(row.pattern) == true {
                result[row.key] = row.pattern
            }
        }
    }
}
