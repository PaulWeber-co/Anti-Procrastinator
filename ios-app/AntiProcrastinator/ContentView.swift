import SwiftUI

/// ContentView — Entry Point, zeigt die Swipe-Navigation
struct ContentView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        SwipeNavigationView()
    }
}

