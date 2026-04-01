import SwiftUI

@main
struct AntiProcrastinatorApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .preferredColorScheme(appState.isDarkMode ? .dark : .light)
        }
    }
}

class AppState: ObservableObject {
    @Published var isDarkMode: Bool {
        didSet { UserDefaults.standard.set(isDarkMode, forKey: "dark_mode") }
    }

    init() {
        self.isDarkMode = UserDefaults.standard.bool(forKey: "dark_mode")
    }
}

