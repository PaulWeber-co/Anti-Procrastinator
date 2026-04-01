import SwiftUI

/// Snapchat-Style Cross-Navigation mit SwiftUI
///
///              [Overview]    (oben — Uhr, Wetter, Planer)
///                  ↑
/// [Summary] ← [To-Do] → [Calendar]
///                  ↓
///           [Visualizations]  (unten — Charts, Fortschritt)

struct SwipeNavigationView: View {
    @StateObject private var viewModel = TodoViewModel()
    @State private var horizontalPage: Int = 1    // 0=Summary, 1=ToDo, 2=Calendar
    @State private var verticalPage: Int = 0      // -1=Overview, 0=ToDo, 1=Visualizations
    @State private var dragOffset: CGSize = .zero
    @State private var isDragging = false

    var body: some View {
        GeometryReader { geo in
            let screenW = geo.size.width
            let screenH = geo.size.height

            ZStack {
                // Background
                Color(hex: "0A0A0A").ignoresSafeArea() // TODO: use theme

                // ── Current Page ──
                currentPage
                    .offset(x: dragOffset.width, y: dragOffset.height)

                // ── Peek Pages (during drag) ──

                // Left peek (Summary)
                if horizontalPage == 1 && verticalPage == 0 && dragOffset.width > 20 {
                    SummaryView(viewModel: viewModel)
                        .offset(x: -screenW + dragOffset.width)
                        .opacity(Double(min(dragOffset.width / screenW, 1)) * 0.9 + 0.1)
                        .transition(.move(edge: .leading))
                }

                // Right peek (Calendar)
                if horizontalPage == 1 && verticalPage == 0 && dragOffset.width < -20 {
                    CalendarView(viewModel: viewModel)
                        .offset(x: screenW + dragOffset.width)
                        .opacity(Double(min(-dragOffset.width / screenW, 1)) * 0.9 + 0.1)
                        .transition(.move(edge: .trailing))
                }

                // Top peek (Overview)
                if horizontalPage == 1 && verticalPage == 0 && dragOffset.height > 20 {
                    OverviewView(viewModel: viewModel)
                        .offset(y: -screenH + dragOffset.height)
                        .opacity(Double(min(dragOffset.height / screenH, 1)) * 0.9 + 0.1)
                }

                // Bottom peek (Visualizations)
                if horizontalPage == 1 && verticalPage == 0 && dragOffset.height < -20 {
                    VisualizationsView(viewModel: viewModel)
                        .offset(y: screenH + dragOffset.height)
                        .opacity(Double(min(-dragOffset.height / screenH, 1)) * 0.9 + 0.1)
                }

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
            .gesture(
                DragGesture()
                    .onChanged { value in
                        isDragging = true
                        let translation = value.translation

                        // Allow dragging based on current page
                        if horizontalPage == 1 && verticalPage == 0 {
                            // On center — allow all directions with resistance at edges
                            dragOffset = translation
                        } else if horizontalPage == 0 {
                            // On Summary — only allow swipe left (to go back to center)
                            dragOffset = CGSize(width: min(0, translation.width) * 0.3 + max(0, translation.width), height: 0)
                        } else if horizontalPage == 2 {
                            // On Calendar — only allow swipe right (to go back)
                            dragOffset = CGSize(width: max(0, translation.width) * 0.3 + min(0, translation.width), height: 0)
                        } else if verticalPage == -1 {
                            dragOffset = CGSize(width: 0, height: min(0, translation.height) * 0.3 + max(0, translation.height))
                        } else if verticalPage == 1 {
                            dragOffset = CGSize(width: 0, height: max(0, translation.height) * 0.3 + min(0, translation.height))
                        }
                    }
                    .onEnded { value in
                        isDragging = false
                        let thresholdH = screenW * 0.25
                        let thresholdV = screenH * 0.2
                        let translation = value.translation

                        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                            // Determine dominant axis
                            if abs(translation.width) > abs(translation.height) {
                                // Horizontal
                                if translation.width > thresholdH && horizontalPage > 0 {
                                    if horizontalPage == 1 { verticalPage = 0 }
                                    horizontalPage -= 1
                                    HapticManager.shared.swipeFeedback()
                                } else if translation.width < -thresholdH && horizontalPage < 2 {
                                    if horizontalPage == 1 { verticalPage = 0 }
                                    horizontalPage += 1
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
                            dragOffset = .zero
                        }
                    }
            )
            .animation(.spring(response: 0.3, dampingFraction: 0.85), value: dragOffset)
        }
        .ignoresSafeArea()
    }

    @ViewBuilder
    private var currentPage: some View {
        switch (horizontalPage, verticalPage) {
        case (0, _):
            SummaryView(viewModel: viewModel)
        case (2, _):
            CalendarView(viewModel: viewModel)
        case (1, -1):
            OverviewView(viewModel: viewModel)
        case (1, 1):
            VisualizationsView(viewModel: viewModel)
        default:
            TodoView(viewModel: viewModel)
        }
    }
}

