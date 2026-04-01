import Foundation

/// StorageService — Persistenz mit UserDefaults + JSON Codable
class StorageService {
    static let shared = StorageService()
    private let defaults = UserDefaults.standard
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    // ── Todos ──

    func getTodos() -> [Todo] {
        guard let data = defaults.data(forKey: "todos") else { return [] }
        return (try? decoder.decode([Todo].self, from: data)) ?? []
    }

    func saveTodos(_ todos: [Todo]) {
        if let data = try? encoder.encode(todos) {
            defaults.set(data, forKey: "todos")
        }
    }

    // ── Planer ──

    func getPlanerMode() -> PlanerMode? {
        guard let raw = defaults.string(forKey: "planer_mode") else { return nil }
        return PlanerMode(rawValue: raw)
    }

    func setPlanerMode(_ mode: PlanerMode?) {
        defaults.set(mode?.rawValue, forKey: "planer_mode")
    }

    func getPlanerData(for mode: PlanerMode? = nil) -> [PlanerPeriod] {
        let key = mode.map { "planer_data_\($0.rawValue)" } ?? "planer_data"
        guard let data = defaults.data(forKey: key) else {
            // Fallback auf Altbestand, falls noch nicht pro Modus gespeichert wurde.
            if mode != nil, let legacy = defaults.data(forKey: "planer_data") {
                return (try? decoder.decode([PlanerPeriod].self, from: legacy)) ?? []
            }
            return []
        }
        return (try? decoder.decode([PlanerPeriod].self, from: data)) ?? []
    }

    func savePlanerData(_ data: [PlanerPeriod], for mode: PlanerMode? = nil) {
        let key = mode.map { "planer_data_\($0.rawValue)" } ?? "planer_data"
        if let encoded = try? encoder.encode(data) {
            defaults.set(encoded, forKey: key)
        }
    }

    // ── Weather Cache ──

    func getCachedWeather() -> WeatherData? {
        guard let data = defaults.data(forKey: "weather_cache") else { return nil }
        let time = defaults.double(forKey: "weather_cache_time")
        guard Date().timeIntervalSince1970 - time < 1800 else { return nil }
        return try? decoder.decode(WeatherData.self, from: data)
    }

    func cacheWeather(_ weather: WeatherData) {
        if let data = try? encoder.encode(weather) {
            defaults.set(data, forKey: "weather_cache")
            defaults.set(Date().timeIntervalSince1970, forKey: "weather_cache_time")
        }
    }

    // ── Today Completed Count (für Haptik-Intensität) ──

    func getTodayCompletedCount() -> Int {
        let savedDate = defaults.string(forKey: "haptic_date") ?? ""
        let today = Self.todayString()
        return savedDate == today ? defaults.integer(forKey: "haptic_count") : 0
    }

    func incrementTodayCompleted() {
        let today = Self.todayString()
        let savedDate = defaults.string(forKey: "haptic_date") ?? ""
        let count = savedDate == today ? defaults.integer(forKey: "haptic_count") : 0
        defaults.set(today, forKey: "haptic_date")
        defaults.set(count + 1, forKey: "haptic_count")
    }

    // ── Dark Mode ──

    var isDarkMode: Bool {
        get { defaults.bool(forKey: "dark_mode") }
        set { defaults.set(newValue, forKey: "dark_mode") }
    }

    // ── Helper ──

    static func todayString() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: "Europe/Berlin")
        return formatter.string(from: Date())
    }
}


