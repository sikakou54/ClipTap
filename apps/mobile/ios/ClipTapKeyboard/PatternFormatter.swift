import Foundation

enum PatternFormatter {
    private static let japaneseWeekdaysShort = ["日", "月", "火", "水", "木", "金", "土"]
    private static let englishWeekdaysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    private static let japaneseWeekdaysLong = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"]
    private static let englishWeekdaysLong = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    private static let tokens = ["yyyy", "EEEE", "EEE", "yy", "MM", "dd", "HH", "mm", "ss", "M", "d", "H"]

    static func format(date: Date, pattern: String, isJapanese: Bool) -> String {
        let calendar = Calendar(identifier: .gregorian)
        let components = calendar.dateComponents(
            [.year, .month, .day, .hour, .minute, .second, .weekday],
            from: date
        )
        let weekdayIndex = max(0, min(6, (components.weekday ?? 1) - 1))
        let shortWeekdays = isJapanese ? japaneseWeekdaysShort : englishWeekdaysShort
        let longWeekdays = isJapanese ? japaneseWeekdaysLong : englishWeekdaysLong
        let year = components.year ?? 0

        let values: [String: String] = [
            "yyyy": String(format: "%04d", year),
            "yy": String(format: "%02d", year % 100),
            "MM": String(format: "%02d", components.month ?? 0),
            "M": String(components.month ?? 0),
            "dd": String(format: "%02d", components.day ?? 0),
            "d": String(components.day ?? 0),
            "HH": String(format: "%02d", components.hour ?? 0),
            "H": String(components.hour ?? 0),
            "mm": String(format: "%02d", components.minute ?? 0),
            "ss": String(format: "%02d", components.second ?? 0),
            "EEE": shortWeekdays[weekdayIndex],
            "EEEE": longWeekdays[weekdayIndex],
        ]

        var output = ""
        var index = pattern.startIndex
        while index < pattern.endIndex {
            if let token = tokens.first(where: { pattern[index...].hasPrefix($0) }) {
                output += values[token] ?? token
                index = pattern.index(index, offsetBy: token.count)
            } else {
                output.append(pattern[index])
                index = pattern.index(after: index)
            }
        }
        return output
    }
}
