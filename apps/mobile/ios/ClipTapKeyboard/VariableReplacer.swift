import Foundation

enum SystemVariable: String, CaseIterable {
    case today
    case now
    case time
    case year
    case month
    case day
    case weekday

    private static let aliases: [String: SystemVariable] = [
        "today": .today,
        "今日": .today,
        "now": .now,
        "現在": .now,
        "time": .time,
        "時刻": .time,
        "year": .year,
        "年": .year,
        "month": .month,
        "月": .month,
        "day": .day,
        "日": .day,
        "weekday": .weekday,
        "曜日": .weekday,
    ]

    private static let defaultPatterns: [SystemVariable: String] = [
        .today: "yyyy/MM/dd",
        .now: "yyyy/MM/dd HH:mm:ss",
        .time: "HH:mm",
        .year: "yyyy",
        .month: "MM",
        .day: "dd",
        .weekday: "EEE",
    ]

    static func from(_ rawName: String) -> SystemVariable? {
        let trimmed = rawName.trimmingCharacters(in: .whitespacesAndNewlines)
        let normalized = trimmed.unicodeScalars.allSatisfy { $0.value < 128 }
            ? trimmed.lowercased()
            : trimmed
        return aliases[normalized]
    }

    func resolve(formats: [String: String], date: Date = Date()) -> String {
        let defaultPattern = SystemVariable.defaultPatterns[self] ?? ""
        let pattern = formats[rawValue] ?? defaultPattern
        return PatternFormatter.format(
            date: date,
            pattern: pattern,
            isJapanese: L10n.isJapanese
        )
    }
}

final class VariableReplacer {
    private static let variablePattern = try? NSRegularExpression(
        pattern: "\\{\\{([^}]+)\\}\\}",
        options: []
    )

    func replace(
        in text: String,
        variablesMap: [String: String],
        formats: [String: String] = [:]
    ) -> String {
        guard let regex = VariableReplacer.variablePattern else { return text }

        var result = text
        let matches = regex.matches(
            in: text,
            options: [],
            range: NSRange(text.startIndex..., in: text)
        )

        for match in matches.reversed() {
            guard
                let nameRange = Range(match.range(at: 1), in: text),
                let fullRange = Range(match.range, in: result)
            else {
                continue
            }

            let name = String(text[nameRange]).trimmingCharacters(in: .whitespacesAndNewlines)
            if let systemVariable = SystemVariable.from(name) {
                result.replaceSubrange(fullRange, with: systemVariable.resolve(formats: formats))
            } else if let value = variablesMap[name] {
                result.replaceSubrange(fullRange, with: value)
            }
        }

        return result
    }

    func hasVariables(in text: String) -> Bool {
        guard let regex = VariableReplacer.variablePattern else { return false }
        return regex.firstMatch(
            in: text,
            options: [],
            range: NSRange(text.startIndex..., in: text)
        ) != nil
    }
}
