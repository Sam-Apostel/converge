import Foundation

enum Format {
    private static let dayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "EEEE, MMM d"
        return f
    }()

    private static let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f
    }()

    static func day(_ date: Date) -> String { dayFormatter.string(from: date) }
    static func time(_ date: Date) -> String { timeFormatter.string(from: date) }

    static func timeRange(_ start: Date?, _ end: Date?) -> String {
        switch (start, end) {
        case let (s?, e?): "\(timeFormatter.string(from: s)) – \(timeFormatter.string(from: e))"
        case let (s?, nil): timeFormatter.string(from: s)
        default: ""
        }
    }

    /// "in 12 min", "2h ago", etc.
    static func relative(_ date: Date) -> String {
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .short
        return f.localizedString(for: date, relativeTo: Date())
    }
}
