import SwiftUI
import EventKit

/// CalendarView — Fullscreen Kalender (Swipe nach links von ToDo)
/// Synchronisiert mit iOS Kalender (iCloud, Google Calendar etc.)
struct CalendarView: View {
    @ObservedObject var viewModel: TodoViewModel
    @State private var currentMonth = Date()
    @State private var selectedDate: Date? = nil
    @State private var systemEvents: [Date: [String]] = [:]

    private let colors = ThemeColors.dark
    private let calendar = Calendar.current
    private let dayNames = ["MO", "DI", "MI", "DO", "FR", "SA", "SO"]

    var body: some View {
        GeometryReader { geo in
        VStack(spacing: 0) {
            // ── Header ──
            Text("KALENDER")
                .font(.system(.caption, design: .monospaced))
                .fontWeight(.bold)
                .foregroundColor(colors.textMuted)
                .tracking(3)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 20)
                .padding(.top, 60)

            Spacer().frame(height: 16)

            // ── Month Navigation ──
            HStack {
                Button(action: { prevMonth() }) {
                    Circle()
                        .stroke(colors.border, lineWidth: 1)
                        .frame(width: 36, height: 36)
                        .overlay(Text("<").font(.system(size: 14, design: .monospaced)).foregroundColor(colors.textSecondary))
                }

                Spacer()

                Text(monthYearString())
                    .font(.system(size: 13, design: .monospaced))
                    .fontWeight(.bold)
                    .foregroundColor(colors.text)
                    .tracking(2)

                Spacer()

                Button(action: { nextMonth() }) {
                    Circle()
                        .stroke(colors.border, lineWidth: 1)
                        .frame(width: 36, height: 36)
                        .overlay(Text(">").font(.system(size: 14, design: .monospaced)).foregroundColor(colors.textSecondary))
                }
            }
            .padding(.horizontal, 20)

            Spacer().frame(height: 16)

            // ── Day Headers ──
            HStack(spacing: 0) {
                ForEach(dayNames, id: \.self) { day in
                    Text(day)
                        .font(.system(size: 9, design: .monospaced))
                        .fontWeight(.bold)
                        .foregroundColor(colors.textMuted)
                        .tracking(1)
                        .frame(maxWidth: .infinity)
                }
            }
            .padding(.horizontal, 16)

            Spacer().frame(height: 8)

            // ── Calendar Grid ──
            let days = generateDays()
            let rows = days.chunked(into: 7)
            let rowCount = CGFloat(max(rows.count, 1))
            let targetHeight = selectedDate == nil ? geo.size.height * 0.56 : geo.size.height * 0.44
            let cellHeight = max(44, min(72, targetHeight / rowCount))

            VStack(spacing: 2) {
                ForEach(Array(rows.enumerated()), id: \.offset) { _, week in
                    HStack(spacing: 2) {
                        ForEach(Array(week.enumerated()), id: \.offset) { _, day in
                            CalendarDayCell(
                                day: day,
                                colors: colors,
                                tasksByDate: viewModel.getTasksByDate(),
                                systemEvents: systemEvents,
                                selectedDate: selectedDate,
                                cellHeight: cellHeight,
                                onTap: {
                                    if let date = day.date {
                                        withAnimation(.spring(response: 0.3)) {
                                            selectedDate = selectedDate == date ? nil : date
                                        }
                                        HapticManager.shared.buttonPress()
                                    }
                                }
                            )
                        }
                    }
                }
            }
            .padding(.horizontal, 16)
            .frame(maxHeight: targetHeight)

            Spacer().frame(height: 12)

            // ── Selected Date Details ──
            if let date = selectedDate {
                let todos = viewModel.getTasksByDate()[calendar.startOfDay(for: date)] ?? []
                let events = systemEvents[calendar.startOfDay(for: date)] ?? []

                VStack(alignment: .leading, spacing: 8) {
                    Text(formatDate(date))
                        .font(.system(size: 10, design: .monospaced))
                        .fontWeight(.bold)
                        .foregroundColor(colors.textMuted)
                        .tracking(1)

                    if todos.isEmpty && events.isEmpty {
                        Text("Keine Termine")
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundColor(colors.textMuted)
                    }

                    ForEach(events, id: \.self) { event in
                        HStack(spacing: 8) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(colors.red)
                                .frame(width: 3, height: 16)
                            Text(event)
                                .font(.system(size: 11))
                                .foregroundColor(colors.text)
                                .lineLimit(1)
                        }
                    }

                    ForEach(todos) { todo in
                        HStack(spacing: 8) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(colors.text.opacity(0.5))
                                .frame(width: 3, height: 16)
                            Text(todo.text)
                                .font(.system(size: 11))
                                .foregroundColor(todo.completed ? colors.textMuted : colors.text)
                                .strikethrough(todo.completed)
                                .lineLimit(1)
                        }
                    }
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(colors.card)
                .cornerRadius(16)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(colors.border, lineWidth: 1))
                .padding(.horizontal, 16)
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }

            Spacer(minLength: 8)
        }
        .background(colors.bg.ignoresSafeArea())
        .safeAreaInset(edge: .bottom) {
            HStack {
                Button(action: { requestCalendarAccess() }) {
                    Text("SYNC MIT IOS KALENDER")
                        .font(.system(size: 9, design: .monospaced))
                        .fontWeight(.bold)
                        .foregroundColor(colors.textMuted)
                        .tracking(1)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 10)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(colors.border, lineWidth: 1))
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.top, 6)
            .padding(.bottom, 14)
            .background(colors.bg.opacity(0.95))
        }
        .onAppear { requestCalendarAccess() }
        }
    }

    // ── Calendar Logic ──

    private func monthYearString() -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "de_DE")
        formatter.dateFormat = "MMMM yyyy"
        return formatter.string(from: currentMonth).uppercased()
    }

    private func prevMonth() {
        currentMonth = calendar.date(byAdding: .month, value: -1, to: currentMonth)!
    }

    private func nextMonth() {
        currentMonth = calendar.date(byAdding: .month, value: 1, to: currentMonth)!
    }

    private func generateDays() -> [CalendarDay] {
        var days: [CalendarDay] = []
        let components = calendar.dateComponents([.year, .month], from: currentMonth)
        let firstOfMonth = calendar.date(from: components)!
        let daysInMonth = calendar.range(of: .day, in: .month, for: currentMonth)!.count

        // Weekday offset (Mon=1)
        var startWeekday = calendar.component(.weekday, from: firstOfMonth) - 2
        if startWeekday < 0 { startWeekday = 6 }

        // Previous month padding
        let prevMonth = calendar.date(byAdding: .month, value: -1, to: firstOfMonth)!
        let daysInPrevMonth = calendar.range(of: .day, in: .month, for: prevMonth)!.count
        for i in stride(from: startWeekday - 1, through: 0, by: -1) {
            days.append(CalendarDay(number: daysInPrevMonth - i, isOtherMonth: true, date: nil))
        }

        // Current month
        for d in 1...daysInMonth {
            let date = calendar.date(from: DateComponents(year: components.year, month: components.month, day: d))
            let isToday = calendar.isDateInToday(date!)
            days.append(CalendarDay(number: d, isOtherMonth: false, date: date, isToday: isToday))
        }

        // Next month padding
        let remaining = (7 - (days.count % 7)) % 7
        for i in 1...max(remaining, 1) {
            if remaining == 0 { break }
            days.append(CalendarDay(number: i, isOtherMonth: true, date: nil))
        }

        return days
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "de_DE")
        formatter.dateFormat = "dd. MMMM yyyy"
        return formatter.string(from: date).uppercased()
    }

    // ── iOS Calendar Sync ──

    private func requestCalendarAccess() {
        let store = EKEventStore()
        if #available(iOS 17.0, *) {
            store.requestFullAccessToEvents { granted, _ in
                if granted { loadSystemEvents(store: store) }
            }
        } else {
            store.requestAccess(to: .event) { granted, _ in
                if granted { loadSystemEvents(store: store) }
            }
        }
    }

    private func loadSystemEvents(store: EKEventStore) {
        let start = calendar.date(byAdding: .month, value: -1, to: Date())!
        let end = calendar.date(byAdding: .month, value: 3, to: Date())!
        let predicate = store.predicateForEvents(withStart: start, end: end, calendars: nil)
        let events = store.events(matching: predicate)

        var result: [Date: [String]] = [:]
        for event in events {
            let day = calendar.startOfDay(for: event.startDate)
            result[day, default: []].append(event.title ?? "Termin")
        }

        DispatchQueue.main.async {
            systemEvents = result
        }
    }
}

struct CalendarDay {
    let number: Int
    let isOtherMonth: Bool
    var date: Date? = nil
    var isToday: Bool = false
}

struct CalendarDayCell: View {
    let day: CalendarDay
    let colors: ThemeColors
    let tasksByDate: [Date: [Todo]]
    let systemEvents: [Date: [String]]
    let selectedDate: Date?
    let cellHeight: CGFloat
    let onTap: () -> Void

    private let calendar = Calendar.current

    var body: some View {
        let isSelected = day.date != nil && selectedDate != nil && calendar.isDate(day.date!, inSameDayAs: selectedDate!)
        let hasTasks = day.date != nil && tasksByDate[calendar.startOfDay(for: day.date!)] != nil
        let hasEvents = day.date != nil && systemEvents[calendar.startOfDay(for: day.date!)] != nil

        Button(action: onTap) {
            VStack(spacing: 2) {
                Text("\(day.number)")
                    .font(.system(size: 12, design: .monospaced))
                    .fontWeight(day.isToday || isSelected ? .bold : .regular)
                    .foregroundColor(
                        isSelected ? colors.bg :
                        day.isOtherMonth ? colors.textMuted.opacity(0.35) :
                        colors.text
                    )

                if hasTasks || hasEvents {
                    HStack(spacing: 2) {
                        if hasTasks {
                            Circle()
                                .fill(isSelected ? colors.bg.opacity(0.7) : colors.text)
                                .frame(width: 4, height: 4)
                        }
                        if hasEvents {
                            Circle()
                                .fill(isSelected ? colors.bg.opacity(0.7) : colors.red)
                                .frame(width: 4, height: 4)
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: cellHeight)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? colors.red : day.isToday ? colors.text.opacity(0.08) : Color.clear)
            )
            .overlay(
                day.isToday && !isSelected ?
                    RoundedRectangle(cornerRadius: 12).stroke(colors.text, lineWidth: 1.5) : nil
            )
        }
        .disabled(day.isOtherMonth)
    }
}

// Helper extension
extension Array {
    func chunked(into size: Int) -> [[Element]] {
        stride(from: 0, to: count, by: size).map {
            Array(self[$0..<Swift.min($0 + size, count)])
        }
    }
}


