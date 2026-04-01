package com.antiprocrastinator.app.data.repository

import com.antiprocrastinator.app.AntiProcrastinatorApp
import com.antiprocrastinator.app.data.local.PreferenceManager
import com.antiprocrastinator.app.data.model.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

class TodoRepository {
    private val prefs: PreferenceManager = AntiProcrastinatorApp.instance.preferenceManager

    fun getAllTodos(): List<Todo> = prefs.getTodos()

    fun addTodo(text: String, date: LocalDate?, category: TodoCategory): Todo {
        val todos = prefs.getTodos().toMutableList()
        val todo = Todo(text = text, date = date, category = category)
        todos.add(todo)
        prefs.saveTodos(todos)
        return todo
    }

    fun toggleTodo(id: String): List<Todo> {
        val todos = prefs.getTodos().toMutableList()
        val idx = todos.indexOfFirst { it.id == id }
        if (idx >= 0) {
            val todo = todos[idx]
            todos[idx] = todo.copy(completed = !todo.completed)
            if (!todo.completed) { // war false, wird jetzt true → increment
                prefs.incrementTodayCompleted()
            }
        }
        prefs.saveTodos(todos)
        return todos
    }

    fun deleteTodo(id: String): List<Todo> {
        val todos = prefs.getTodos().filter { it.id != id }
        prefs.saveTodos(todos)
        return todos
    }

    fun getFilteredTodos(filter: TodoFilter, selectedDate: LocalDate? = null): List<Todo> {
        var list = prefs.getTodos()

        if (selectedDate != null) {
            list = list.filter { it.date == selectedDate }
        }

        list = when (filter) {
            TodoFilter.TODAY -> list.filter { it.date == LocalDate.now() }
            TodoFilter.OPEN -> list.filter { !it.completed }
            TodoFilter.DONE -> list.filter { it.completed }
            TodoFilter.ALL -> list
        }

        return list.sortedWith(compareBy<Todo> { it.completed }.thenByDescending { it.createdAt })
    }

    fun getStats(): TodoStats {
        val todos = prefs.getTodos()
        val total = todos.size
        val done = todos.count { it.completed }
        val open = total - done
        val rate = if (total > 0) (done * 100) / total else 0
        val todayCompleted = prefs.getTodayCompletedCount()
        return TodoStats(total, done, open, rate, todayCompleted)
    }

    fun getCategoryData(): Map<TodoCategory, Int> {
        val todos = prefs.getTodos()
        return TodoCategory.entries.associateWith { cat -> todos.count { it.category == cat } }
    }

    fun getChartData(range: ChartRange): ChartData {
        val todos = prefs.getTodos()
        val labels = mutableListOf<String>()
        val values = mutableListOf<Int>()
        val formatter = DateTimeFormatter.ofPattern("dd.MM")

        when (range) {
            ChartRange.WEEK -> {
                for (i in 6 downTo 0) {
                    val date = LocalDate.now().minusDays(i.toLong())
                    labels.add(date.dayOfWeek.name.take(2))
                    val dayTodos = todos.filter { it.date == date }
                    val completed = dayTodos.count { it.completed }
                    val total = dayTodos.size
                    values.add(if (total > 0) (completed * 100) / total else 0)
                }
            }
            ChartRange.MONTH -> {
                for (i in 29 downTo 0) {
                    val date = LocalDate.now().minusDays(i.toLong())
                    labels.add(date.format(formatter))
                    val dayTodos = todos.filter { it.date == date }
                    val completed = dayTodos.count { it.completed }
                    val total = dayTodos.size
                    values.add(if (total > 0) (completed * 100) / total else 0)
                }
            }
            ChartRange.YEAR -> {
                val months = listOf("Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez")
                for (i in 11 downTo 0) {
                    val date = LocalDate.now().minusMonths(i.toLong())
                    labels.add(months[date.monthValue - 1])
                    val monthTodos = todos.filter {
                        it.date != null && it.date.year == date.year && it.date.monthValue == date.monthValue
                    }
                    val completed = monthTodos.count { it.completed }
                    val total = monthTodos.size
                    values.add(if (total > 0) (completed * 100) / total else 0)
                }
            }
        }

        return ChartData(labels, values)
    }

    fun getTasksByDate(): Map<LocalDate, List<Todo>> {
        return prefs.getTodos().filter { it.date != null }.groupBy { it.date!! }
    }

    fun getTodayCompletedCount(): Int = prefs.getTodayCompletedCount()
}

