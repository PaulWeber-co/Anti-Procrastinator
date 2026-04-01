import Foundation

// ══════════════════════════════════════════════════════════
// To-Do Model
// ══════════════════════════════════════════════════════════

struct Todo: Identifiable, Codable, Equatable {
    let id: String
    var text: String
    var date: Date?
    var category: TodoCategory
    var completed: Bool
    var createdAt: Date

    init(text: String, date: Date? = nil, category: TodoCategory = .arbeit) {
        self.id = UUID().uuidString
        self.text = text
        self.date = date
        self.category = category
        self.completed = false
        self.createdAt = Date()
    }
}

enum TodoCategory: String, Codable, CaseIterable {
    case arbeit = "arbeit"
    case persoenlich = "persoenlich"
    case gesundheit = "gesundheit"
    case lernen = "lernen"

    var label: String {
        switch self {
        case .arbeit: return "Arbeit"
        case .persoenlich: return "Persönlich"
        case .gesundheit: return "Gesundheit"
        case .lernen: return "Lernen"
        }
    }
}

enum TodoFilter: CaseIterable {
    case all, today, open, done

    var label: String {
        switch self {
        case .all: return "Alle"
        case .today: return "Heute"
        case .open: return "Offen"
        case .done: return "Erledigt"
        }
    }
}

struct TodoStats {
    var total: Int = 0
    var done: Int = 0
    var open: Int = 0
    var rate: Int = 0
    var todayCompleted: Int = 0
}

// ══════════════════════════════════════════════════════════
// Planer Models
// ══════════════════════════════════════════════════════════

enum PlanerMode: String, Codable, CaseIterable {
    case schule, bachelor, master, provadis

    var label: String {
        switch self {
        case .schule: return "Schulplaner"
        case .bachelor: return "Bachelor Studienplan"
        case .master: return "Master Studienplan"
        case .provadis: return "Studienplan Provadis"
        }
    }

    var periodLabel: String {
        switch self {
        case .schule: return "Klasse"
        default: return "Semester"
        }
    }

    var hasEcts: Bool { self != .schule }
    var isSchule: Bool { self == .schule }

    var icon: String {
        switch self {
        case .schule: return ".:S:."
        case .bachelor: return ".:B:."
        case .master: return ".:M:."
        case .provadis: return ".:P:."
        }
    }

    var desc: String {
        switch self {
        case .schule: return "Klassen 5–13"
        case .bachelor: return "6 Semester · 180 ECTS"
        case .master: return "4 Semester · 120 ECTS"
        case .provadis: return "Informatik B.Sc."
        }
    }
}

struct PlanerPeriod: Codable, Identifiable {
    var id = UUID().uuidString
    var period: Int
    var modules: [PlanerModule]
}

struct PlanerModule: Codable, Identifiable {
    var id: String = UUID().uuidString
    var name: String
    var prof: String = ""
    var points: Int = 5
    var pruefung: String = ""
    var isWab: Bool = false
    var noten: SchulNoten?
    var grade: Double?
    var status: ModuleStatus = .offen
}

struct SchulNoten: Codable {
    var schulaufgabe: [Int] = []
    var ex: [Int] = []
    var muendlich: [Int] = []
}

enum ModuleStatus: String, Codable {
    case offen, bestanden, nichtBestanden = "nicht_bestanden"

    var label: String {
        switch self {
        case .offen: return "Offen"
        case .bestanden: return "Bestanden"
        case .nichtBestanden: return "Nicht bestanden"
        }
    }
}

struct PlanerStats {
    var totalPoints: Int = 0
    var completedPoints: Int = 0
    var average: Double = 0.0
    var gradedPoints: Int = 0
}

// ══════════════════════════════════════════════════════════
// Weather Model
// ══════════════════════════════════════════════════════════

struct WeatherData: Codable {
    var temp: Int = 0
    var desc: String = ""
    var city: String = ""
    var dailyMax: [Int] = []
    var dailyMin: [Int] = []
    var dailyCodes: [Int] = []
    var dailyDates: [String] = []
}

// ══════════════════════════════════════════════════════════
// Chart Data
// ══════════════════════════════════════════════════════════

struct ChartData {
    var labels: [String]
    var values: [Int]
}

enum ChartRange: CaseIterable {
    case week, month, year
    var label: String {
        switch self {
        case .week: return "W"
        case .month: return "M"
        case .year: return "J"
        }
    }
}

// ══════════════════════════════════════════════════════════
// Daily Quotes
// ══════════════════════════════════════════════════════════

struct Quote {
    let text: String
    let author: String
}

struct Quotes {
    static let list: [Quote] = [
        Quote(text: "Der beste Zeitpunkt anzufangen war gestern. Der zweitbeste ist jetzt.", author: "Chinesisches Sprichwort"),
        Quote(text: "Es ist nicht wenig Zeit, die wir haben, sondern viel Zeit, die wir nicht nutzen.", author: "Seneca"),
        Quote(text: "Disziplin ist die Brücke zwischen Zielen und Ergebnissen.", author: "Jim Rohn"),
        Quote(text: "Du musst nicht großartig sein, um anzufangen. Aber du musst anfangen, um großartig zu werden.", author: "Zig Ziglar"),
        Quote(text: "Der einzige Weg, großartige Arbeit zu leisten, ist zu lieben, was man tut.", author: "Steve Jobs"),
        Quote(text: "Kleine Schritte sind besser als große Pläne.", author: "Unbekannt"),
        Quote(text: "Perfektion ist der Feind des Fortschritts.", author: "Winston Churchill"),
        Quote(text: "Erfolg ist die Summe kleiner Anstrengungen, Tag für Tag wiederholt.", author: "Robert Collier"),
        Quote(text: "Motivation bringt dich in Gang. Gewohnheit bringt dich ans Ziel.", author: "Jim Ryun"),
        Quote(text: "Mach es jetzt. Manchmal wird aus Später Nie.", author: "Unbekannt"),
        Quote(text: "Der Weg entsteht beim Gehen.", author: "Antonio Machado"),
        Quote(text: "Fortschritt, nicht Perfektion.", author: "Unbekannt"),
        Quote(text: "Jeder Experte war einmal ein Anfänger.", author: "Helen Hayes"),
        Quote(text: "Handle, bevor du bereit bist.", author: "Mel Robbins"),
    ]

    static func daily() -> Quote {
        let dayOfYear = Calendar.current.ordinality(of: .day, in: .year, for: Date()) ?? 1
        return list[dayOfYear % list.count]
    }
}

