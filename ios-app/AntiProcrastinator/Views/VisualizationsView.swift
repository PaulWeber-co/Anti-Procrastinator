import SwiftUI

/// VisualizationsView — Charts und Tracking (Swipe nach oben von ToDo)
/// Fortschritt, Kategorien, Streak, Produktivitäts-Heatmap
struct VisualizationsView: View {
    @ObservedObject var viewModel: TodoViewModel
    @State private var chartRange: ChartRange = .week

    private let colors = ThemeColors.dark

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // ── Header ──
                Text("FORTSCHRITT")
                    .font(.system(.caption, design: .monospaced))
                    .fontWeight(.bold)
                    .foregroundColor(colors.textMuted)
                    .tracking(3)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, 60)

                // ── Stats Grid ──
                HStack(spacing: 10) {
                    StatMiniCard(label: "GESAMT", value: "\(viewModel.stats.total)", colors: colors)
                    StatMiniCard(label: "ERLEDIGT", value: "\(viewModel.stats.done)", colors: colors)
                }
                HStack(spacing: 10) {
                    StatMiniCard(label: "RATE", value: "\(viewModel.stats.rate)%", colors: colors)
                    StatMiniCard(label: "STREAK", value: "\(viewModel.getStreak())🔥", colors: colors)
                }

                // ── Progress Chart ──
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Text("ABSCHLUSSRATE")
                            .font(.system(size: 9, design: .monospaced))
                            .fontWeight(.bold)
                            .foregroundColor(colors.textMuted)
                            .tracking(2)
                        Spacer()
                        HStack(spacing: 4) {
                            ForEach(ChartRange.allCases, id: \.self) { range in
                                Button(action: { chartRange = range }) {
                                    Text(range.label)
                                        .font(.system(size: 8, design: .monospaced))
                                        .fontWeight(.bold)
                                        .foregroundColor(range == chartRange ? colors.bg : colors.textMuted)
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 4)
                                        .background(range == chartRange ? colors.text : Color.clear)
                                        .cornerRadius(12)
                                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(range == chartRange ? colors.text : colors.border, lineWidth: 1))
                                }
                            }
                        }
                    }

                    DotMatrixChartView(data: viewModel.getChartData(range: chartRange), colors: colors)
                        .frame(height: 160)
                }
                .padding(16)
                .background(colors.card)
                .cornerRadius(16)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(colors.border, lineWidth: 1))

                // ── Category Bars ──
                VStack(alignment: .leading, spacing: 16) {
                    Text("KATEGORIEN")
                        .font(.system(size: 9, design: .monospaced))
                        .fontWeight(.bold)
                        .foregroundColor(colors.textMuted)
                        .tracking(2)

                    let total = max(viewModel.categoryData.values.reduce(0, +), 1)
                    ForEach(TodoCategory.allCases, id: \.self) { cat in
                        let count = viewModel.categoryData[cat] ?? 0
                        CategoryBarView(label: cat.label.uppercased(), count: count, total: total, colors: colors)
                    }
                }
                .padding(16)
                .background(colors.card)
                .cornerRadius(16)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(colors.border, lineWidth: 1))

                // ── Heatmap ──
                VStack(alignment: .leading, spacing: 12) {
                    Text("AKTIVITÄTS-HEATMAP")
                        .font(.system(size: 9, design: .monospaced))
                        .fontWeight(.bold)
                        .foregroundColor(colors.textMuted)
                        .tracking(2)

                    HeatmapGridView(todos: viewModel.todos, colors: colors)
                }
                .padding(16)
                .background(colors.card)
                .cornerRadius(16)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(colors.border, lineWidth: 1))

                // ── Best Day ──
                if let best = findBestDay() {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("BESTER TAG")
                                .font(.system(size: 9, design: .monospaced))
                                .fontWeight(.bold)
                                .foregroundColor(colors.textMuted)
                                .tracking(2)
                            Text(formatDate(best.0))
                                .font(.system(size: 12, design: .monospaced))
                                .foregroundColor(colors.text)
                        }
                        Spacer()
                        Text("\(best.1) ✓")
                            .font(.system(size: 24, design: .monospaced))
                            .fontWeight(.bold)
                            .foregroundColor(colors.text)
                    }
                    .padding(16)
                    .background(colors.card)
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(colors.border, lineWidth: 1))
                }

                // ── Daily Quote ──
                let quote = Quotes.daily()
                VStack(spacing: 10) {
                    Text("\"\(quote.text)\"")
                        .font(.system(size: 13))
                        .italic()
                        .foregroundColor(colors.text)
                        .multilineTextAlignment(.center)
                    Text("— \(quote.author)")
                        .font(.system(size: 9, design: .monospaced))
                        .fontWeight(.semibold)
                        .foregroundColor(colors.textMuted)
                        .tracking(1.5)
                }
                .padding(20)
                .background(colors.card)
                .cornerRadius(16)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(colors.border, lineWidth: 1))

                Spacer().frame(height: 40)
            }
            .padding(.horizontal, 20)
        }
        .background(colors.bg.ignoresSafeArea())
    }

    private func findBestDay() -> (Date, Int)? {
        let allTodos = StorageService.shared.getTodos()
        let completed = allTodos.filter { $0.completed && $0.date != nil }
        let grouped = Dictionary(grouping: completed, by: { Calendar.current.startOfDay(for: $0.date!) })
        return grouped.max(by: { $0.value.count < $1.value.count }).map { ($0.key, $0.value.count) }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "de_DE")
        formatter.dateFormat = "dd. MMM yyyy"
        return formatter.string(from: date)
    }
}

struct StatMiniCard: View {
    let label: String
    let value: String
    let colors: ThemeColors

    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 22, design: .monospaced))
                .fontWeight(.bold)
                .foregroundColor(colors.text)
            Text(label)
                .font(.system(size: 8, design: .monospaced))
                .fontWeight(.bold)
                .foregroundColor(colors.textMuted)
                .tracking(2)
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(colors.card)
        .cornerRadius(16)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(colors.border, lineWidth: 1))
    }
}

struct DotMatrixChartView: View {
    let data: ChartData
    let colors: ThemeColors

    var body: some View {
        Canvas { context, size in
            let dotSize: CGFloat = 4
            let gap: CGFloat = 2
            let step = dotSize + gap
            let cols = Int(size.width / step)
            let rows = Int(size.height / step)

            guard !data.values.isEmpty, cols > 0 else { return }

            for r in 0..<rows {
                for c in 0..<cols {
                    let x = CGFloat(c) * step
                    let y = CGFloat(r) * step

                    let idx = CGFloat(c) / CGFloat(cols - 1) * CGFloat(data.values.count - 1)
                    let lo = Int(idx).clamped(to: 0...data.values.count - 1)
                    let hi = min(lo + 1, data.values.count - 1)
                    let frac = idx - CGFloat(lo)
                    let value = CGFloat(data.values[lo]) + CGFloat(data.values[hi] - data.values[lo]) * frac

                    let rowFromBottom = rows - 1 - r
                    let threshold = (value / 100) * CGFloat(rows - 1)

                    let rect = CGRect(x: x, y: y, width: dotSize, height: dotSize)
                    if CGFloat(rowFromBottom) <= threshold {
                        let alpha = 0.5 + 0.5 * (1.0 - CGFloat(rowFromBottom) / CGFloat(rows))
                        context.fill(Path(rect), with: .color(colors.text.opacity(alpha)))
                    } else {
                        context.fill(Path(rect), with: .color(colors.border.opacity(0.3)))
                    }
                }
            }
        }
    }
}

struct CategoryBarView: View {
    let label: String
    let count: Int
    let total: Int
    let colors: ThemeColors

    var body: some View {
        HStack {
            Text(label)
                .font(.system(size: 8, design: .monospaced))
                .fontWeight(.bold)
                .foregroundColor(colors.textMuted)
                .tracking(1)
                .frame(width: 90, alignment: .trailing)

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(colors.input)
                    RoundedRectangle(cornerRadius: 6)
                        .fill(colors.text.opacity(0.7))
                        .frame(width: geo.size.width * CGFloat(count) / CGFloat(total))
                        .animation(.spring(response: 0.6), value: count)
                }
            }
            .frame(height: 12)

            Text("\(count)")
                .font(.system(size: 10, design: .monospaced))
                .fontWeight(.bold)
                .foregroundColor(colors.text)
                .frame(width: 30, alignment: .trailing)
        }
    }
}

struct HeatmapGridView: View {
    let todos: [Todo]
    let colors: ThemeColors
    private let weeks = 7
    private let calendar = Calendar.current

    var body: some View {
        VStack(spacing: 3) {
            ForEach(0..<weeks, id: \.self) { week in
                HStack(spacing: 3) {
                    ForEach(0..<7, id: \.self) { day in
                        let daysAgo = (weeks - 1 - week) * 7 + (6 - day)
                        let date = calendar.date(byAdding: .day, value: -daysAgo, to: Date())!
                        let dayTodos = todos.filter { $0.date != nil && calendar.isDate($0.date!, inSameDayAs: date) }
                        let total = dayTodos.count
                        let done = dayTodos.filter { $0.completed }.count
                        let intensity = total > 0 ? Double(done) / Double(total) : 0

                        RoundedRectangle(cornerRadius: 4)
                            .fill(colors.text.opacity(0.05 + intensity * 0.8))
                            .aspectRatio(1, contentMode: .fit)
                    }
                }
            }
        }
    }
}

// Helper
extension Int {
    func clamped(to range: ClosedRange<Int>) -> Int {
        return Swift.min(Swift.max(self, range.lowerBound), range.upperBound)
    }
}

