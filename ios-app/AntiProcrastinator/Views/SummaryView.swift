import SwiftUI

/// SummaryView — Links (Swipe nach rechts von ToDo)
/// Alle wichtigsten Dinge zusammengefasst (kompakt):
/// Fortschritt, Kalender-Mini, heutige ToDos, Uhr, Wetter, Noten
struct SummaryView: View {
    @ObservedObject var viewModel: TodoViewModel
    @State private var currentTime = Date()

    private let colors = ThemeColors.dark
    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                // ── Header ──
                Text("DASHBOARD")
                    .font(.system(.caption, design: .monospaced))
                    .fontWeight(.bold)
                    .foregroundColor(colors.textMuted)
                    .tracking(3)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, 60)

                // ── Row 1: Clock + Weather ──
                HStack(spacing: 10) {
                    // Mini Clock
                    VStack(spacing: 4) {
                        Text("UHR")
                            .font(.system(size: 8, design: .monospaced))
                            .fontWeight(.bold)
                            .foregroundColor(colors.textMuted)
                            .tracking(2)
                        Text({
                            let f = DateFormatter()
                            f.dateFormat = "HH:mm"
                            f.timeZone = TimeZone(identifier: "Europe/Berlin")
                            return f.string(from: currentTime)
                        }())
                        .font(.system(size: 28, design: .monospaced))
                        .fontWeight(.light)
                        .foregroundColor(colors.text)
                        .tracking(2)
                        Text({
                            let f = DateFormatter()
                            f.locale = Locale(identifier: "de_DE")
                            f.dateFormat = "dd. MMM"
                            return f.string(from: Date()).uppercased()
                        }())
                        .font(.system(size: 9, design: .monospaced))
                        .foregroundColor(colors.textMuted)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(16)
                    .background(colors.card)
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(colors.border, lineWidth: 1))

                    // Mini Weather
                    let weather = StorageService.shared.getCachedWeather()
                    VStack(spacing: 4) {
                        Text("WETTER")
                            .font(.system(size: 8, design: .monospaced))
                            .fontWeight(.bold)
                            .foregroundColor(colors.textMuted)
                            .tracking(2)
                        Text("\(weather?.temp ?? 0)°")
                            .font(.system(size: 28, design: .monospaced))
                            .fontWeight(.light)
                            .foregroundColor(colors.text)
                        Text(weather?.city ?? "—")
                            .font(.system(size: 9, design: .monospaced))
                            .foregroundColor(colors.textMuted)
                            .lineLimit(1)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(16)
                    .background(colors.card)
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(colors.border, lineWidth: 1))
                }
                .onReceive(timer) { _ in currentTime = Date() }

                // ── Row 2: Progress Ring + Stats ──
                HStack(spacing: 10) {
                    // Progress Ring
                    VStack(spacing: 8) {
                        Text("FORTSCHRITT")
                            .font(.system(size: 8, design: .monospaced))
                            .fontWeight(.bold)
                            .foregroundColor(colors.textMuted)
                            .tracking(2)

                        ZStack {
                            Circle()
                                .stroke(colors.border, lineWidth: 4)
                                .frame(width: 60, height: 60)
                            Circle()
                                .trim(from: 0, to: viewModel.stats.total > 0 ? CGFloat(viewModel.stats.done) / CGFloat(viewModel.stats.total) : 0)
                                .stroke(colors.text, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                                .frame(width: 60, height: 60)
                                .rotationEffect(.degrees(-90))
                            Text("\(viewModel.stats.rate)%")
                                .font(.system(size: 14, design: .monospaced))
                                .fontWeight(.bold)
                                .foregroundColor(colors.text)
                        }

                        Text("\(viewModel.stats.done)/\(viewModel.stats.total)")
                            .font(.system(size: 10, design: .monospaced))
                            .foregroundColor(colors.textMuted)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(16)
                    .background(colors.card)
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(colors.border, lineWidth: 1))

                    // Mini Stats
                    VStack(spacing: 10) {
                        HStack(spacing: 10) {
                            MiniStatCell(label: "OFFEN", value: "\(viewModel.stats.open)", colors: colors)
                            MiniStatCell(label: "ERLEDIGT", value: "\(viewModel.stats.done)", colors: colors)
                        }
                        HStack(spacing: 10) {
                            MiniStatCell(label: "GESAMT", value: "\(viewModel.stats.total)", colors: colors)
                            MiniStatCell(label: "RATE", value: "\(viewModel.stats.rate)%", colors: colors)
                        }
                    }
                    .frame(maxWidth: .infinity)
                }

                // ── Mini Calendar ──
                VStack(alignment: .leading, spacing: 8) {
                    Text("KALENDER")
                        .font(.system(size: 8, design: .monospaced))
                        .fontWeight(.bold)
                        .foregroundColor(colors.textMuted)
                        .tracking(2)

                    MiniCalendarGrid(colors: colors)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(colors.card)
                .cornerRadius(16)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(colors.border, lineWidth: 1))

                // ── Today's Todos ──
                VStack(alignment: .leading, spacing: 6) {
                    Text("HEUTE")
                        .font(.system(size: 8, design: .monospaced))
                        .fontWeight(.bold)
                        .foregroundColor(colors.textMuted)
                        .tracking(2)

                    let todayTodos = viewModel.getTodayTodos()

                    if todayTodos.isEmpty {
                        Text("Keine Aufgaben für heute")
                            .font(.system(size: 10, design: .monospaced))
                            .foregroundColor(colors.textMuted)
                    } else {
                        ForEach(todayTodos.prefix(5)) { todo in
                            HStack(spacing: 8) {
                                Circle()
                                    .fill(todo.completed ? colors.text : Color.clear)
                                    .stroke(todo.completed ? Color.clear : colors.textMuted, lineWidth: 1)
                                    .frame(width: 10, height: 10)
                                Text(todo.text)
                                    .font(.system(size: 10))
                                    .foregroundColor(todo.completed ? colors.textMuted : colors.text)
                                    .strikethrough(todo.completed)
                                    .lineLimit(1)
                            }
                        }
                        if todayTodos.count > 5 {
                            Text("+\(todayTodos.count - 5) mehr")
                                .font(.system(size: 8, design: .monospaced))
                                .foregroundColor(colors.textMuted)
                        }
                    }
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(colors.card)
                .cornerRadius(16)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(colors.border, lineWidth: 1))

                // ── Mini Categories ──
                VStack(alignment: .leading, spacing: 8) {
                    Text("KATEGORIEN")
                        .font(.system(size: 8, design: .monospaced))
                        .fontWeight(.bold)
                        .foregroundColor(colors.textMuted)
                        .tracking(2)

                    let total = max(viewModel.categoryData.values.reduce(0, +), 1)
                    ForEach(TodoCategory.allCases, id: \.self) { cat in
                        let count = viewModel.categoryData[cat] ?? 0
                        HStack {
                            Text(String(cat.label.prefix(4)).uppercased())
                                .font(.system(size: 7, design: .monospaced))
                                .fontWeight(.bold)
                                .foregroundColor(colors.textMuted)
                                .frame(width: 40, alignment: .trailing)

                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    RoundedRectangle(cornerRadius: 3).fill(colors.input)
                                    RoundedRectangle(cornerRadius: 3)
                                        .fill(colors.text.opacity(0.6))
                                        .frame(width: geo.size.width * CGFloat(count) / CGFloat(total))
                                }
                            }
                            .frame(height: 6)

                            Text("\(count)")
                                .font(.system(size: 8, design: .monospaced))
                                .fontWeight(.bold)
                                .foregroundColor(colors.text)
                                .frame(width: 20, alignment: .trailing)
                        }
                    }
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(colors.card)
                .cornerRadius(16)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(colors.border, lineWidth: 1))

                Spacer().frame(height: 40)
            }
            .padding(.horizontal, 16)
        }
        .background(colors.bg.ignoresSafeArea())
    }
}

struct MiniStatCell: View {
    let label: String
    let value: String
    let colors: ThemeColors

    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 14, design: .monospaced))
                .fontWeight(.bold)
                .foregroundColor(colors.text)
            Text(label)
                .font(.system(size: 6, design: .monospaced))
                .fontWeight(.bold)
                .foregroundColor(colors.textMuted)
                .tracking(1)
        }
        .frame(maxWidth: .infinity)
        .padding(10)
        .background(colors.card)
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(colors.border, lineWidth: 1))
    }
}

struct MiniCalendarGrid: View {
    let colors: ThemeColors
    private let calendar = Calendar.current
    private let dayLetters = ["M", "D", "M", "D", "F", "S", "S"]

    var body: some View {
        let today = Date()
        let month = calendar.dateComponents([.year, .month], from: today)
        let firstOfMonth = calendar.date(from: month)!
        let daysInMonth = calendar.range(of: .day, in: .month, for: today)!.count
        var startOffset = calendar.component(.weekday, from: firstOfMonth) - 2
        if startOffset < 0 { startOffset = 6 }

        VStack(spacing: 2) {
            HStack(spacing: 0) {
                ForEach(dayLetters.indices, id: \.self) { i in
                    Text(dayLetters[i])
                        .font(.system(size: 7, design: .monospaced))
                        .fontWeight(.bold)
                        .foregroundColor(colors.textMuted)
                        .frame(maxWidth: .infinity)
                }
            }

            let totalSlots = startOffset + daysInMonth
            let rows = (totalSlots + 6) / 7

            ForEach(0..<rows, id: \.self) { row in
                HStack(spacing: 2) {
                    ForEach(0..<7, id: \.self) { col in
                        let slot = row * 7 + col
                        let dayNum = slot - startOffset + 1

                        if dayNum >= 1 && dayNum <= daysInMonth {
                            let date = calendar.date(from: DateComponents(year: month.year, month: month.month, day: dayNum))!
                            let isToday = calendar.isDateInToday(date)

                            Text("\(dayNum)")
                                .font(.system(size: 7, design: .monospaced))
                                .fontWeight(isToday ? .bold : .regular)
                                .foregroundColor(isToday ? colors.bg : colors.textMuted)
                                .frame(maxWidth: .infinity)
                                .aspectRatio(1, contentMode: .fit)
                                .background(
                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(isToday ? colors.text : Color.clear)
                                )
                        } else {
                            Color.clear
                                .frame(maxWidth: .infinity)
                                .aspectRatio(1, contentMode: .fit)
                        }
                    }
                }
            }
        }
    }
}

