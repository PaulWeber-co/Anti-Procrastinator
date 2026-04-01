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

extension PlanerMode {
    var periodRange: ClosedRange<Int> {
        switch self {
        case .schule: return 5...13
        case .bachelor: return 1...6
        case .master: return 1...4
        case .provadis: return 1...6
        }
    }

    func defaultModules(for period: Int) -> [PlanerModule] {
        switch self {
        case .schule:
            let subjectsByClass: [Int: [String]] = [
                5: ["Deutsch", "Mathematik", "Englisch", "Biologie", "Geschichte", "Sport"],
                6: ["Deutsch", "Mathematik", "Englisch", "Geographie", "Biologie", "Sport"],
                7: ["Deutsch", "Mathematik", "Englisch", "Franzosisch", "Physik", "Chemie"],
                8: ["Deutsch", "Mathematik", "Englisch", "Physik", "Chemie", "Informatik"],
                9: ["Deutsch", "Mathematik", "Englisch", "Wirtschaft", "Physik", "Informatik"],
                10: ["Deutsch", "Mathematik", "Englisch", "Biologie", "Chemie", "Sozialkunde"],
                11: ["Deutsch", "Mathematik", "Englisch", "Informatik", "Geschichte", "Sport"],
                12: ["Deutsch", "Mathematik", "Englisch", "Informatik", "Wirtschaft", "Politik"],
                13: ["Deutsch", "Mathematik", "Englisch", "Informatik", "Ethik", "Seminar"]
            ]
            let subjects = subjectsByClass[period] ?? subjectsByClass[10] ?? []
            return subjects.map {
                PlanerModule(name: $0, points: 0, noten: SchulNoten(), status: .offen)
            }
        case .bachelor:
            let modulesBySemester: [Int: [String]] = [
                1: ["Programmierung 1", "Mathematik 1", "Technische Informatik", "BWL"],
                2: ["Programmierung 2", "Mathematik 2", "Datenbanken", "Rechnernetze"],
                3: ["Algorithmen", "Software Engineering", "Statistik", "Web-Technologien"],
                4: ["Betriebssysteme", "IT-Sicherheit", "Projektmanagement", "Wahlpflicht 1"],
                5: ["Verteilte Systeme", "KI Grundlagen", "Wahlpflicht 2", "Praxisprojekt"],
                6: ["Bachelorarbeit", "Kolloquium", "Unternehmenspraxis"]
            ]
            return (modulesBySemester[period] ?? []).map {
                PlanerModule(name: $0, points: 5, status: .offen)
            }
        case .master:
            let modulesBySemester: [Int: [String]] = [
                1: ["Advanced Software Engineering", "Data Science", "Research Methods"],
                2: ["Cloud Computing", "Machine Learning", "IT-Architekturen"],
                3: ["Wahlpflicht Vertiefung", "Praxisprojekt", "Seminar"],
                4: ["Masterarbeit", "Verteidigung"]
            ]
            return (modulesBySemester[period] ?? []).map {
                PlanerModule(name: $0, points: 6, status: .offen)
            }
        case .provadis:
            let provadisBySemester: [Int: [String]] = [
                1: ["Programmierung", "Mathematik", "BWL", "Kommunikation"],
                2: ["Objektorientierung", "Datenbanken", "Recht", "Englisch"],
                3: ["Webentwicklung", "Statistik", "Projektarbeit", "Wirtschaftsinformatik"],
                4: ["Software Engineering", "IT-Sicherheit", "Controlling", "Praxisphase"],
                5: ["Systemintegration", "Cloud Grundlagen", "Wahlmodul", "Praxisprojekt"],
                6: ["Bachelor Thesis", "Kolloquium", "Unternehmensprojekt"]
            ]
            return (provadisBySemester[period] ?? []).map {
                PlanerModule(name: $0, points: 5, status: .offen)
            }
        }
    }
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


