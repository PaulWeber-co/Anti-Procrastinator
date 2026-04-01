import Foundation
import CoreLocation

/// WeatherService — Holt Wetterdaten von Open-Meteo API
class WeatherService: NSObject, CLLocationManagerDelegate {
    static let shared = WeatherService()

    private let locationManager = CLLocationManager()
    private var completion: ((WeatherData?) -> Void)?

    private let wmoDescriptions: [Int: String] = [
        0: "Klar", 1: "Überwiegend klar", 2: "Teilweise bewölkt", 3: "Bedeckt",
        45: "Nebel", 48: "Nebel mit Reif",
        51: "Leichter Nieselregen", 53: "Nieselregen", 55: "Starker Nieselregen",
        61: "Leichter Regen", 63: "Regen", 65: "Starker Regen",
        71: "Leichter Schneefall", 73: "Schneefall", 75: "Starker Schneefall",
        80: "Regenschauer", 81: "Starke Regenschauer", 82: "Heftige Regenschauer",
        95: "Gewitter", 96: "Gewitter mit Hagel", 99: "Gewitter mit starkem Hagel"
    ]

    override init() {
        super.init()
        locationManager.delegate = self
    }

    func fetchWeather(completion: @escaping (WeatherData?) -> Void) {
        // Check cache first
        if let cached = StorageService.shared.getCachedWeather() {
            completion(cached)
            return
        }

        self.completion = completion
        locationManager.requestWhenInUseAuthorization()
        locationManager.requestLocation()
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.first else { return }
        fetchFromAPI(lat: location.coordinate.latitude, lon: location.coordinate.longitude, city: "Mein Standort")
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        // Fallback: Berlin
        fetchFromAPI(lat: 52.52, lon: 13.41, city: "Berlin")
    }

    private func fetchFromAPI(lat: Double, lon: Double, city: String) {
        let urlStr = "https://api.open-meteo.com/v1/forecast?latitude=\(lat)&longitude=\(lon)&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=7&timezone=Europe%2FBerlin"

        guard let url = URL(string: urlStr) else {
            completion?(nil)
            return
        }

        URLSession.shared.dataTask(with: url) { [weak self] data, _, error in
            guard let self = self, let data = data, error == nil else {
                DispatchQueue.main.async { self?.completion?(nil) }
                return
            }

            do {
                let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                let current = json?["current"] as? [String: Any]
                let daily = json?["daily"] as? [String: Any]

                let temp = Int((current?["temperature_2m"] as? Double) ?? 0)
                let code = (current?["weather_code"] as? Int) ?? 0
                let desc = self.wmoDescriptions[code] ?? "Unbekannt"

                let dailyMax = (daily?["temperature_2m_max"] as? [Double])?.map { Int($0.rounded()) } ?? []
                let dailyMin = (daily?["temperature_2m_min"] as? [Double])?.map { Int($0.rounded()) } ?? []
                let dailyCodes = (daily?["weather_code"] as? [Int]) ?? []
                let dailyDates = (daily?["time"] as? [String]) ?? []

                let weather = WeatherData(
                    temp: temp, desc: desc, city: city,
                    dailyMax: dailyMax, dailyMin: dailyMin,
                    dailyCodes: dailyCodes, dailyDates: dailyDates
                )

                StorageService.shared.cacheWeather(weather)
                DispatchQueue.main.async { self.completion?(weather) }
            } catch {
                DispatchQueue.main.async { self.completion?(nil) }
            }
        }.resume()
    }
}

