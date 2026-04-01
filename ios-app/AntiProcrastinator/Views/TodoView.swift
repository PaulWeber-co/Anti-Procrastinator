import SwiftUI

/// TodoView — Hauptseite (Fullscreen Center)
/// Minimalistisch, touch-optimiert, mit haptischem Feedback
struct TodoView: View {
    @ObservedObject var viewModel: TodoViewModel
    @State private var inputText = ""
    @State private var selectedCategory: TodoCategory = .arbeit
    @State private var showCategoryPicker = false

    private let colors = ThemeColors.dark // Dark by default for mobile

    var body: some View {
        VStack(spacing: 0) {
            // ── Header ──
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("AUFGABEN")
                        .font(.system(.caption, design: .monospaced))
                        .fontWeight(.bold)
                        .foregroundColor(colors.textMuted)
                        .tracking(3)
                    Text("\(viewModel.stats.done)/\(viewModel.stats.total) erledigt")
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundColor(colors.textMuted)
                }

                Spacer()

                // Progress Ring
                ZStack {
                    Circle()
                        .stroke(colors.border, lineWidth: 3)
                        .frame(width: 44, height: 44)
                    Circle()
                        .trim(from: 0, to: viewModel.stats.total > 0 ? CGFloat(viewModel.stats.done) / CGFloat(viewModel.stats.total) : 0)
                        .stroke(colors.text, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                        .frame(width: 44, height: 44)
                        .rotationEffect(.degrees(-90))
                        .animation(.spring(response: 0.6), value: viewModel.stats.done)

                    Text("\(viewModel.stats.rate)%")
                        .font(.system(size: 10, design: .monospaced))
                        .fontWeight(.bold)
                        .foregroundColor(colors.text)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 60)

            Spacer().frame(height: 20)

            // ── Input Row ──
            HStack(spacing: 4) {
                // Category Pill
                Button(action: { withAnimation(.spring(response: 0.3)) { showCategoryPicker.toggle() } }) {
                    Text(String(selectedCategory.label.prefix(3)).uppercased())
                        .font(.system(size: 8, design: .monospaced))
                        .fontWeight(.bold)
                        .foregroundColor(colors.textSecondary)
                        .tracking(1)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 12)
                        .background(colors.input)
                        .cornerRadius(12)
                }

                // Text Input
                TextField("Neue Aufgabe...", text: $inputText)
                    .font(.system(size: 13))
                    .foregroundColor(colors.text)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 12)
                    .onSubmit { addTodo() }

                // Add Button
                Button(action: addTodo) {
                    Text("+")
                        .font(.system(size: 20, weight: .light))
                        .foregroundColor(colors.bg)
                        .frame(width: 40, height: 40)
                        .background(colors.text)
                        .cornerRadius(12)
                }
            }
            .padding(4)
            .background(colors.card)
            .cornerRadius(16)
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(colors.border, lineWidth: 1))
            .padding(.horizontal, 20)

            // ── Category Picker ──
            if showCategoryPicker {
                HStack(spacing: 6) {
                    ForEach(TodoCategory.allCases, id: \.self) { cat in
                        let isSelected = cat == selectedCategory
                        Button(action: {
                            selectedCategory = cat
                            withAnimation(.spring(response: 0.3)) { showCategoryPicker = false }
                            HapticManager.shared.buttonPress()
                        }) {
                            Text(cat.label)
                                .font(.system(size: 9, design: .monospaced))
                                .fontWeight(.semibold)
                                .foregroundColor(isSelected ? colors.bg : colors.textSecondary)
                                .tracking(1)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(isSelected ? colors.text : colors.input)
                                .cornerRadius(20)
                                .overlay(RoundedRectangle(cornerRadius: 20).stroke(isSelected ? colors.text : colors.border, lineWidth: 1))
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .transition(.move(edge: .top).combined(with: .opacity))
            }

            Spacer().frame(height: 12)

            // ── Filter Pills ──
            HStack(spacing: 6) {
                ForEach(TodoFilter.allCases, id: \.self) { f in
                    let isActive = f == viewModel.filter
                    Button(action: {
                        viewModel.filter = f
                        viewModel.refresh()
                        HapticManager.shared.buttonPress()
                    }) {
                        Text(f.label.uppercased())
                            .font(.system(size: 9, design: .monospaced))
                            .fontWeight(.bold)
                            .foregroundColor(isActive ? colors.bg : colors.textMuted)
                            .tracking(1)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 7)
                            .background(isActive ? colors.text : Color.clear)
                            .cornerRadius(20)
                            .overlay(RoundedRectangle(cornerRadius: 20).stroke(isActive ? colors.text : colors.border, lineWidth: 1))
                    }
                }
                Spacer()
            }
            .padding(.horizontal, 20)

            Spacer().frame(height: 12)

            // ── Todo List ──
            if viewModel.todos.isEmpty {
                Spacer()
                VStack(spacing: 8) {
                    Text("--")
                        .font(.system(size: 20, design: .monospaced))
                        .foregroundColor(colors.textMuted)
                    Text("KEINE AUFGABEN")
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundColor(colors.textMuted)
                        .tracking(2)
                }
                Spacer()
            } else {
                ScrollView {
                    LazyVStack(spacing: 2) {
                        ForEach(viewModel.todos) { todo in
                            TodoItemRow(
                                todo: todo,
                                colors: colors,
                                onToggle: { viewModel.toggleTodo(todo.id) },
                                onDelete: { viewModel.deleteTodo(todo.id) }
                            )
                        }
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .background(colors.bg.ignoresSafeArea())
    }

    private func addTodo() {
        guard !inputText.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        viewModel.addTodo(text: inputText.trimmingCharacters(in: .whitespaces), date: Date(), category: selectedCategory)
        inputText = ""
        HapticManager.shared.buttonPress()
    }
}

struct TodoItemRow: View {
    let todo: Todo
    let colors: ThemeColors
    let onToggle: () -> Void
    let onDelete: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            // Checkbox
            Button(action: onToggle) {
                ZStack {
                    Circle()
                        .stroke(todo.completed ? colors.text : colors.textMuted, lineWidth: 1.5)
                        .frame(width: 22, height: 22)
                    if todo.completed {
                        Circle()
                            .fill(colors.text)
                            .frame(width: 22, height: 22)
                        Text("✓")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(colors.bg)
                    }
                }
            }
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: todo.completed)

            // Content
            VStack(alignment: .leading, spacing: 3) {
                Text(todo.text)
                    .font(.system(size: 13))
                    .foregroundColor(todo.completed ? colors.textMuted : colors.text)
                    .strikethrough(todo.completed)
                    .lineLimit(2)

                HStack(spacing: 6) {
                    // Category tag
                    Text(todo.category.label)
                        .font(.system(size: 8, design: .monospaced))
                        .fontWeight(.semibold)
                        .foregroundColor(colors.textSecondary)
                        .tracking(0.5)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(colors.input)
                        .cornerRadius(10)

                    // Date
                    if let date = todo.date {
                        Text(date, style: .date)
                            .font(.system(size: 9, design: .monospaced))
                            .foregroundColor(colors.textMuted)
                    }
                }
            }

            Spacer()

            // Delete
            Button(action: onDelete) {
                Text("×")
                    .font(.system(size: 16, design: .monospaced))
                    .foregroundColor(colors.textMuted)
                    .frame(width: 28, height: 28)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(colors.card.opacity(0.5))
        .cornerRadius(12)
    }
}

