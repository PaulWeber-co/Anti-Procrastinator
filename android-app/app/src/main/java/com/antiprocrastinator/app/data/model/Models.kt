package com.antiprocrastinator.app.data.model

import java.time.LocalDate
import java.time.LocalDateTime
import java.util.UUID

// ══════════════════════════════════════════════════════════
// To-Do Model
// ══════════════════════════════════════════════════════════

data class Todo(
    val id: String = UUID.randomUUID().toString(),
    val text: String,
    val date: LocalDate? = null,
    val category: TodoCategory = TodoCategory.ARBEIT,
    val completed: Boolean = false,
    val createdAt: LocalDateTime = LocalDateTime.now()
)

enum class TodoCategory(val label: String, val key: String) {
    ARBEIT("Arbeit", "arbeit"),
    PERSOENLICH("Persönlich", "persoenlich"),
    GESUNDHEIT("Gesundheit", "gesundheit"),
    LERNEN("Lernen", "lernen")
}

enum class TodoFilter { ALL, TODAY, OPEN, DONE }

data class TodoStats(
    val total: Int = 0,
    val done: Int = 0,
    val open: Int = 0,
    val rate: Int = 0,
    val todayCompleted: Int = 0
)

// ══════════════════════════════════════════════════════════
// Planer Models
// ══════════════════════════════════════════════════════════

enum class PlanerMode(val label: String, val periodLabel: String, val hasEcts: Boolean, val isSchule: Boolean) {
    SCHULE("Schulplaner", "Klasse", false, true),
    BACHELOR("Bachelor Studienplan", "Semester", true, false),
    MASTER("Master Studienplan", "Semester", true, false),
    PROVADIS("Studienplan Provadis", "Semester", true, false)
}

data class PlanerPeriod(
    val period: Int,
    val modules: MutableList<PlanerModule> = mutableListOf()
)

data class PlanerModule(
    val id: String = UUID.randomUUID().toString(),
    var name: String,
    var prof: String = "",
    var points: Int = 5,
    var pruefung: String = "",
    var isWab: Boolean = false,
    // Schul-Noten
    var noten: SchulNoten? = null,
    // Uni-Noten
    var grade: Double? = null,
    var status: ModuleStatus = ModuleStatus.OFFEN
)

data class SchulNoten(
    val schulaufgabe: MutableList<Int> = mutableListOf(),
    val ex: MutableList<Int> = mutableListOf(),
    val muendlich: MutableList<Int> = mutableListOf()
)

enum class ModuleStatus(val label: String) {
    OFFEN("Offen"),
    BESTANDEN("Bestanden"),
    NICHT_BESTANDEN("Nicht bestanden")
}

data class PlanerStats(
    val totalPoints: Int = 0,
    val completedPoints: Int = 0,
    val average: Double = 0.0,
    val gradedPoints: Int = 0
)

// ══════════════════════════════════════════════════════════
// Weather Model
// ══════════════════════════════════════════════════════════

data class WeatherData(
    val temp: Int = 0,
    val desc: String = "",
    val city: String = "",
    val dailyMax: List<Int> = emptyList(),
    val dailyMin: List<Int> = emptyList(),
    val dailyCodes: List<Int> = emptyList(),
    val dailyDates: List<String> = emptyList()
)

// ══════════════════════════════════════════════════════════
// Chart Data
// ══════════════════════════════════════════════════════════

data class ChartData(
    val labels: List<String>,
    val values: List<Int>
)

enum class ChartRange { WEEK, MONTH, YEAR }

// ══════════════════════════════════════════════════════════
// Daily Quotes
// ══════════════════════════════════════════════════════════

data class Quote(val text: String, val author: String)

object Quotes {
    val list = listOf(
        Quote("Der beste Zeitpunkt anzufangen war gestern. Der zweitbeste ist jetzt.", "Chinesisches Sprichwort"),
        Quote("Es ist nicht wenig Zeit, die wir haben, sondern viel Zeit, die wir nicht nutzen.", "Seneca"),
        Quote("Disziplin ist die Brücke zwischen Zielen und Ergebnissen.", "Jim Rohn"),
        Quote("Du musst nicht großartig sein, um anzufangen. Aber du musst anfangen, um großartig zu werden.", "Zig Ziglar"),
        Quote("Fokussiere dich nicht auf das Ergebnis. Fokussiere dich auf den Prozess.", "Nick Saban"),
        Quote("Der einzige Weg, großartige Arbeit zu leisten, ist zu lieben, was man tut.", "Steve Jobs"),
        Quote("Kleine Schritte sind besser als große Pläne.", "Unbekannt"),
        Quote("Perfektion ist der Feind des Fortschritts.", "Winston Churchill"),
        Quote("Erfolg ist die Summe kleiner Anstrengungen, Tag für Tag wiederholt.", "Robert Collier"),
        Quote("Motivation bringt dich in Gang. Gewohnheit bringt dich ans Ziel.", "Jim Ryun"),
        Quote("Handle, bevor du bereit bist.", "Mel Robbins"),
        Quote("Fortschritt, nicht Perfektion.", "Unbekannt"),
        Quote("Jeder Experte war einmal ein Anfänger.", "Helen Hayes"),
        Quote("Mach es jetzt. Manchmal wird aus Später Nie.", "Unbekannt"),
        Quote("Der Weg entsteht beim Gehen.", "Antonio Machado"),
    )

    fun daily(): Quote {
        val dayOfYear = java.time.LocalDate.now().dayOfYear
        return list[dayOfYear % list.size]
    }
}

