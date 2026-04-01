import Foundation
import Combine

/// TodoViewModel — Verwaltet To-Do State und Business Logic
class TodoViewModel: ObservableObject {
    @Published var todos: [Todo] = []
    @Published var filter: TodoFilter = .all
    @Published var stats: TodoStats = TodoStats()
    @Published var categoryData: [TodoCategory: Int] = [:]

    private let storage = StorageService.shared

    init() {
        refresh()
    }

    func refresh() {
        let allTodos = storage.getTodos()

        // Apply filter
        switch filter {
        case .all:
            todos = allTodos
        case .today:
            let today = Calendar.current.startOfDay(for: Date())
            todos = allTodos.filter { todo in
                guard let date = todo.date else { return false }
                return Calendar.current.isDate(date, inSameDayAs: today)
            }
        case .open:
            todos = allTodos.filter { !$0.completed }
        case .done:
            todos = allTodos.filter { $0.completed }
        }

        todos.sort { a, b in
            if a.completed != b.completed { return !a.completed }
            return a.createdAt > b.createdAt
        }

        // Stats
        let total = allTodos.count
        let done = allTodos.filter { $0.completed }.count
        let open = total - done
        let rate = total > 0 ? (done * 100) / total : 0
        stats = TodoStats(total: total, done: done, open: open, rate: rate, todayCompleted: storage.getTodayCompletedCount())

        // Categories
        categoryData = Dictionary(grouping: allTodos, by: { $0.category }).mapValues { $0.count }
        for cat in TodoCategory.allCases {
            if categoryData[cat] == nil { categoryData[cat] = 0 }
        }
    }

    func addTodo(text: String, date: Date? = nil, category: TodoCategory = .arbeit) {
        guard !text.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        var allTodos = storage.getTodos()
        allTodos.append(Todo(text: text, date: date ?? Date(), category: category))
        storage.saveTodos(allTodos)
        refresh()
    }

    func toggleTodo(_ id: String) {
        var allTodos = storage.getTodos()
        if let idx = allTodos.firstIndex(where: { $0.id == id }) {
            let wasDone = allTodos[idx].completed
            allTodos[idx].completed.toggle()
            storage.saveTodos(allTodos)
            if !wasDone {
                storage.incrementTodayCompleted()
                let count = storage.getTodayCompletedCount()
                HapticManager.shared.todoChecked(todayCount: count)
            }
        }
        refresh()
    }

    func deleteTodo(_ id: String) {
        var allTodos = storage.getTodos()
        allTodos.removeAll { $0.id == id }
        storage.saveTodos(allTodos)
        refresh()
    }

    func getChartData(range: ChartRange) -> ChartData {
        let allTodos = storage.getTodos()
        var labels: [String] = []
        var values: [Int] = []
        let calendar = Calendar.current

        switch range {
        case .week:
            for i in stride(from: 6, through: 0, by: -1) {
                let date = calendar.date(byAdding: .day, value: -i, to: Date())!
                let formatter = DateFormatter()
                formatter.locale = Locale(identifier: "de_DE")
                formatter.dateFormat = "EE"
                labels.append(formatter.string(from: date).uppercased())

                let dayTodos = allTodos.filter { todo in
                    guard let d = todo.date else { return false }
                    return calendar.isDate(d, inSameDayAs: date)
                }
                let completed = dayTodos.filter { $0.completed }.count
                let total = dayTodos.count
                values.append(total > 0 ? (completed * 100) / total : 0)
            }
        case .month:
            for i in stride(from: 29, through: 0, by: -1) {
                let date = calendar.date(byAdding: .day, value: -i, to: Date())!
                let formatter = DateFormatter()
                formatter.dateFormat = "dd.MM"
                labels.append(formatter.string(from: date))

                let dayTodos = allTodos.filter { todo in
                    guard let d = todo.date else { return false }
                    return calendar.isDate(d, inSameDayAs: date)
                }
                let completed = dayTodos.filter { $0.completed }.count
                let total = dayTodos.count
                values.append(total > 0 ? (completed * 100) / total : 0)
            }
        case .year:
            let months = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"]
            for i in stride(from: 11, through: 0, by: -1) {
                let date = calendar.date(byAdding: .month, value: -i, to: Date())!
                let month = calendar.component(.month, from: date)
                labels.append(months[month - 1])

                let monthTodos = allTodos.filter { todo in
                    guard let d = todo.date else { return false }
                    return calendar.component(.year, from: d) == calendar.component(.year, from: date) &&
                           calendar.component(.month, from: d) == month
                }
                let completed = monthTodos.filter { $0.completed }.count
                let total = monthTodos.count
                values.append(total > 0 ? (completed * 100) / total : 0)
            }
        }

        return ChartData(labels: labels, values: values)
    }

    func getTodayTodos() -> [Todo] {
        let allTodos = storage.getTodos()
        let today = Calendar.current.startOfDay(for: Date())
        return allTodos.filter { todo in
            guard let date = todo.date else { return false }
            return Calendar.current.isDate(date, inSameDayAs: today)
        }
    }

    func getTasksByDate() -> [Date: [Todo]] {
        return Dictionary(grouping: storage.getTodos().filter { $0.date != nil }, by: {
            Calendar.current.startOfDay(for: $0.date!)
        })
    }

    func getStreak() -> Int {
        let allTodos = storage.getTodos()
        var streak = 0
        var date = Calendar.current.startOfDay(for: Date())

        while true {
            let dayTodos = allTodos.filter { todo in
                guard let d = todo.date else { return false }
                return Calendar.current.isDate(d, inSameDayAs: date)
            }
            if dayTodos.isEmpty || !dayTodos.contains(where: { $0.completed }) { break }
            streak += 1
            date = Calendar.current.date(byAdding: .day, value: -1, to: date)!
        }
        return streak
    }
}

