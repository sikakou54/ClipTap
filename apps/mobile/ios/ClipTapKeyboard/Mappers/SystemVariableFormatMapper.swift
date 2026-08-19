import Foundation

final class SystemVariableFormatMapper: BaseMapper {
    private struct FormatRow {
        let key: String
        let pattern: String
    }

    static let shared = SystemVariableFormatMapper()

    private static let validPatterns: [String: Set<String>] = [
        "today": [
            "yyyy/MM/dd", "yyyy/M/d", "yy/MM/dd", "yy/M/d",
            "yyyy-MM-dd", "yyyy-M-d", "yy-MM-dd", "yy-M-d",
            "yyyy.MM.dd", "yyyy.M.d", "yy.MM.dd", "yy.M.d",
            "yyyy年MM月dd日", "yyyy年M月d日", "yy年MM月dd日", "yy年M月d日",
            "MM/dd", "M/d", "MM-dd", "M-d", "MM.dd", "M.d", "MM月dd日", "M月d日",
            "MM/dd/yyyy", "M/d/yyyy", "MM/dd/yy", "M/d/yy",
            "dd/MM/yyyy", "d/M/yyyy", "dd/MM/yy", "d/M/yy", "yyyyMMdd", "yyMMdd",
        ],
        "now": [
            "yyyy/MM/dd HH:mm:ss", "yyyy/MM/dd HH:mm", "yyyy/M/d H:mm:ss", "yyyy/M/d H:mm",
            "yy/MM/dd HH:mm:ss", "yy/MM/dd HH:mm", "yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd HH:mm",
            "yyyy-M-d H:mm:ss", "yyyy-M-d H:mm", "yy-MM-dd HH:mm:ss", "yy-MM-dd HH:mm",
            "yyyy.MM.dd HH:mm:ss", "yyyy.MM.dd HH:mm", "yyyy.M.d H:mm:ss", "yyyy.M.d H:mm",
            "yyyy年MM月dd日 HH時mm分ss秒", "yyyy年MM月dd日 HH時mm分",
            "yyyy年M月d日 H時mm分ss秒", "yyyy年M月d日 H時mm分",
            "yy年MM月dd日 HH時mm分ss秒", "yy年MM月dd日 HH時mm分",
            "MM/dd/yyyy HH:mm:ss", "MM/dd/yyyy HH:mm", "M/d/yyyy HH:mm:ss", "M/d/yyyy HH:mm",
            "d/M/yyyy HH:mm:ss", "d/M/yyyy HH:mm", "MM/dd HH:mm:ss", "MM/dd HH:mm",
            "M/d HH:mm:ss", "M/d HH:mm", "yyyyMMdd HHmmss", "yyyyMMdd HHmm",
        ],
        "time": [
            "HH:mm", "HH:mm:ss", "H:mm", "H:mm:ss", "HH時mm分", "HH時mm分ss秒",
            "H時mm分", "H時mm分ss秒", "HHmm", "HHmmss",
        ],
        "year": ["yyyy", "yyyy年", "yy", "yy年"],
        "month": ["MM", "MM月", "M", "M月"],
        "day": ["dd", "dd日", "d", "d日"],
        "weekday": ["EEE", "(EEE)", "EEEE", "(EEEE)"],
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
