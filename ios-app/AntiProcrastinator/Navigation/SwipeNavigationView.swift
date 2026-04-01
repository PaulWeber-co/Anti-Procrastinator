import SwiftUI

/// Snapchat-Style Cross-Navigation mit SwiftUI
///
///             [Overview]     (oben)
///                 ↑
/// [To-Do] ← [Summary] → [Calendar]
///                 ↓
///        [Visualizations]    (unten)

struct SwipeNavigationView: View {
    @StateObject private var viewModel = TodoViewModel()
    @State private var horizontalPage: Int = 1    // 0=ToDo, 1=Summary, 2=Calendar
    @State private var verticalPage: Int = 0      // -1=Overview, 0=Summary, 1=Visualizations
    @State private var todoAutoFocusToken: Int = 0

    var body: some View {
        GeometryReader { geo in
            let screenW = geo.size.width
            let screenH = geo.size.height

            ZStack {
                // Background
                Color(hex: "0A0A0A").ignoresSafeArea() // TODO: use theme

                // ── Current Page ──
                currentPage

                // ── Page Indicators ──
                if horizontalPage == 1 && verticalPage == 0 {
                    VStack {
                        Spacer()

                        // Horizontal dots
                        HStack(spacing: 8) {
                            ForEach(0..<3) { i in
                                Circle()
                                    .fill(Color.white.opacity(i == 1 ? 0.8 : 0.3))
                                    .frame(width: i == 1 ? 8 : 5, height: i == 1 ? 8 : 5)
                            }
                        }
                        .padding(.bottom, 40)
                    }
                    .allowsHitTesting(false)

                    // Vertical dots
                    HStack {
                        Spacer()
                        VStack(spacing: 8) {
                            ForEach(-1..<2) { i in
                                Circle()
                                    .fill(Color.white.opacity(i == 0 ? 0.8 : 0.3))
                                    .frame(width: i == 0 ? 8 : 5, height: i == 0 ? 8 : 5)
                            }
                        }
                        .padding(.trailing, 12)
                    }
                    .allowsHitTesting(false)
                }
            }
            .simultaneousGesture(
                DragGesture()
                    .onEnded { value in
                        // Statische Navigation: kein Mitziehen der Views, nur Zielseite nach Swipe.
                        let thresholdH = screenW * 0.14
                        let thresholdV = screenH * 0.12
                        let translation = value.predictedEndTranslation

                        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                            // Determine dominant axis
                            if abs(translation.width) > abs(translation.height) {
                                // Horizontal
                                if translation.width > thresholdH && horizontalPage > 0 {
                                    if horizontalPage == 1 { verticalPage = 0 }
                                    horizontalPage -= 1
                                    if horizontalPage == 0 { todoAutoFocusToken += 1 }
                                    HapticManager.shared.swipeFeedback()
                                } else if translation.width < -thresholdH && horizontalPage < 2 {
                                    if horizontalPage == 1 { verticalPage = 0 }
                                    horizontalPage += 1
                                    if horizontalPage == 0 { todoAutoFocusToken += 1 }
                                    HapticManager.shared.swipeFeedback()
                                }
                            } else {
                                // Vertical (nur auf center)
                                if horizontalPage == 1 {
                                    if translation.height > thresholdV && verticalPage > -1 {
                                        verticalPage -= 1
                                        horizontalPage = 1
                                        HapticManager.shared.swipeFeedback()
                                    } else if translation.height < -thresholdV && verticalPage < 1 {
                                        verticalPage += 1
                                        horizontalPage = 1
                                        HapticManager.shared.swipeFeedback()
                                    }
                                }
                            }
                        }
                    }
            )
        }
        .ignoresSafeArea()
    }

    @ViewBuilder
    private var currentPage: some View {
        switch (horizontalPage, verticalPage) {
        case (0, _):
            TodoView(viewModel: viewModel, autoFocusToken: todoAutoFocusToken)
        case (2, _):
            CalendarView(viewModel: viewModel)
        case (1, -1):
            OverviewView(viewModel: viewModel)
        case (1, 1):
            VisualizationsView(viewModel: viewModel)
        default:
            SummaryView(viewModel: viewModel)
        }
    }
}




