package com.antiprocrastinator.app.ui.pages

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.antiprocrastinator.app.data.model.*
import com.antiprocrastinator.app.data.repository.TodoRepository
import com.antiprocrastinator.app.ui.theme.AppTheme
import com.antiprocrastinator.app.ui.theme.SpaceMono
import java.time.LocalDate
import java.time.format.DateTimeFormatter

/**
 * Visualizations Page — Fullscreen Charts und Tracking (Swipe nach oben)
 * Zeigt: Fortschritt, Kategorien, Streak, Produktivitäts-Heatmap, Wochenverlauf
 */
@Composable
fun VisualizationsPage() {
    val colors = AppTheme.colors
    val repository = remember { TodoRepository() }
    val stats = remember { repository.getStats() }
    var chartRange by remember { mutableStateOf(ChartRange.WEEK) }
    val chartData = remember(chartRange) { repository.getChartData(chartRange) }
    val categoryData = remember { repository.getCategoryData() }
    val todos = remember { repository.getAllTodos() }

    // Streak berechnen
    val streak = remember { calculateStreak(todos) }
    // Bester Tag
    val bestDay = remember { findBestDay(todos) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bg)
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
    ) {
        Spacer(Modifier.height(16.dp))

        Text(
            "FORTSCHRITT",
            style = MaterialTheme.typography.labelLarge,
            color = colors.textMuted,
            letterSpacing = 3.sp
        )

        Spacer(Modifier.height(20.dp))

        // ── Stats Grid (2x2) ──
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            StatMiniCard("GESAMT", "${stats.total}", Modifier.weight(1f))
            StatMiniCard("ERLEDIGT", "${stats.done}", Modifier.weight(1f))
        }
        Spacer(Modifier.height(10.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            StatMiniCard("RATE", "${stats.rate}%", Modifier.weight(1f))
            StatMiniCard("STREAK", "${streak}🔥", Modifier.weight(1f))
        }

        Spacer(Modifier.height(24.dp))

        // ── Fortschritts-Chart ──
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(colors.card, RoundedCornerShape(16.dp))
                .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                .padding(16.dp)
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "ABSCHLUSSRATE",
                        fontFamily = SpaceMono,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.textMuted,
                        letterSpacing = 2.sp
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        ChartRange.entries.forEach { range ->
                            val label = when (range) {
                                ChartRange.WEEK -> "W"
                                ChartRange.MONTH -> "M"
                                ChartRange.YEAR -> "J"
                            }
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (range == chartRange) colors.text else colors.bg)
                                    .border(1.dp, if (range == chartRange) colors.text else colors.border, RoundedCornerShape(12.dp))
                                    .clickable { chartRange = range }
                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    label,
                                    fontFamily = SpaceMono,
                                    fontSize = 8.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (range == chartRange) colors.bg else colors.textMuted
                                )
                            }
                        }
                    }
                }

                Spacer(Modifier.height(16.dp))

                // Dot-Matrix Chart
                DotMatrixChart(
                    values = chartData.values,
                    labels = chartData.labels,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(160.dp)
                )
            }
        }

        Spacer(Modifier.height(16.dp))

        // ── Kategorien-Bars ──
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(colors.card, RoundedCornerShape(16.dp))
                .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                .padding(16.dp)
        ) {
            Column {
                Text(
                    "KATEGORIEN",
                    fontFamily = SpaceMono,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.textMuted,
                    letterSpacing = 2.sp
                )
                Spacer(Modifier.height(16.dp))

                val total = categoryData.values.sum().coerceAtLeast(1)
                categoryData.forEach { (cat, count) ->
                    CategoryBar(cat.label.uppercase(), count, total)
                    Spacer(Modifier.height(10.dp))
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        // ── Produktivitäts-Heatmap (letzte 7 Wochen) ──
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(colors.card, RoundedCornerShape(16.dp))
                .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                .padding(16.dp)
        ) {
            Column {
                Text(
                    "AKTIVITÄTS-HEATMAP",
                    fontFamily = SpaceMono,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.textMuted,
                    letterSpacing = 2.sp
                )
                Spacer(Modifier.height(12.dp))
                HeatmapGrid(todos)
            }
        }

        Spacer(Modifier.height(16.dp))

        // ── Bester Tag ──
        bestDay?.let { (date, count) ->
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(colors.card, RoundedCornerShape(16.dp))
                    .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("BESTER TAG", fontFamily = SpaceMono, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = colors.textMuted, letterSpacing = 2.sp)
                        Spacer(Modifier.height(4.dp))
                        Text(
                            date.format(DateTimeFormatter.ofPattern("dd. MMM yyyy")),
                            fontFamily = SpaceMono, fontSize = 12.sp, color = colors.text
                        )
                    }
                    Text("$count ✓", fontFamily = SpaceMono, fontSize = 24.sp, fontWeight = FontWeight.Bold, color = colors.text)
                }
            }
        }

        Spacer(Modifier.height(40.dp))
    }
}

@Composable
private fun StatMiniCard(label: String, value: String, modifier: Modifier = Modifier) {
    val colors = AppTheme.colors
    Box(
        modifier = modifier
            .background(colors.card, RoundedCornerShape(16.dp))
            .border(1.dp, colors.border, RoundedCornerShape(16.dp))
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, fontFamily = SpaceMono, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = colors.text)
            Spacer(Modifier.height(2.dp))
            Text(label, fontFamily = SpaceMono, fontSize = 8.sp, fontWeight = FontWeight.Bold, color = colors.textMuted, letterSpacing = 2.sp)
        }
    }
}

@Composable
private fun DotMatrixChart(values: List<Int>, labels: List<String>, modifier: Modifier = Modifier) {
    val colors = AppTheme.colors
    val textColor = colors.text
    val dotBg = colors.border.copy(alpha = 0.3f)

    Canvas(modifier = modifier) {
        val dotSize = 4f
        val gap = 2f
        val step = dotSize + gap
        val cols = (size.width / step).toInt()
        val rows = (size.height / step).toInt()

        if (values.isEmpty() || cols == 0) return@Canvas

        // Interpolate values to cols
        val colValues = (0 until cols).map { c ->
            val idx = (c.toFloat() / (cols - 1)) * (values.size - 1)
            val lo = idx.toInt().coerceIn(0, values.size - 1)
            val hi = (lo + 1).coerceIn(0, values.size - 1)
            val frac = idx - lo
            values[lo] + (values[hi] - values[lo]) * frac
        }

        for (r in 0 until rows) {
            for (c in 0 until cols) {
                val x = c * step
                val y = r * step
                val rowFromBottom = rows - 1 - r
                val threshold = (colValues[c] / 100f) * (rows - 1)

                val color = if (rowFromBottom <= threshold) {
                    textColor.copy(alpha = 0.5f + 0.5f * (1f - rowFromBottom.toFloat() / rows))
                } else {
                    dotBg
                }
                drawRect(color, topLeft = Offset(x, y), size = Size(dotSize, dotSize))
            }
        }
    }
}

@Composable
private fun CategoryBar(label: String, count: Int, total: Int) {
    val colors = AppTheme.colors
    val fraction = count.toFloat() / total
    val animatedFraction by animateFloatAsState(
        targetValue = fraction,
        animationSpec = tween(600, easing = FastOutSlowInEasing), label = "cat"
    )

    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            label,
            fontFamily = SpaceMono,
            fontSize = 8.sp,
            fontWeight = FontWeight.Bold,
            color = colors.textMuted,
            modifier = Modifier.width(90.dp),
            letterSpacing = 1.sp
        )

        Box(
            modifier = Modifier
                .weight(1f)
                .height(12.dp)
                .background(colors.input, RoundedCornerShape(6.dp))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(animatedFraction)
                    .background(colors.text.copy(alpha = 0.7f), RoundedCornerShape(6.dp))
            )
        }

        Spacer(Modifier.width(8.dp))
        Text("$count", fontFamily = SpaceMono, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = colors.text)
    }
}

@Composable
private fun HeatmapGrid(todos: List<Todo>) {
    val colors = AppTheme.colors
    val today = LocalDate.now()
    val weeks = 7

    // Berechne Completion pro Tag
    val dayData = mutableMapOf<LocalDate, Float>()
    for (i in 0 until weeks * 7) {
        val date = today.minusDays(i.toLong())
        val dayTodos = todos.filter { it.date == date }
        val total = dayTodos.size
        val done = dayTodos.count { it.completed }
        dayData[date] = if (total > 0) done.toFloat() / total else 0f
    }

    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
        for (week in 0 until weeks) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(3.dp)
            ) {
                for (day in 0 until 7) {
                    val date = today.minusDays(((weeks - 1 - week) * 7 + (6 - day)).toLong())
                    val intensity = dayData[date] ?: 0f

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .aspectRatio(1f)
                            .background(
                                colors.text.copy(alpha = 0.05f + intensity * 0.8f),
                                RoundedCornerShape(4.dp)
                            )
                    )
                }
            }
        }
    }
}

private fun calculateStreak(todos: List<Todo>): Int {
    var streak = 0
    var date = LocalDate.now()
    while (true) {
        val dayTodos = todos.filter { it.date == date }
        if (dayTodos.isEmpty() || dayTodos.none { it.completed }) break
        streak++
        date = date.minusDays(1)
    }
    return streak
}

private fun findBestDay(todos: List<Todo>): Pair<LocalDate, Int>? {
    return todos
        .filter { it.completed && it.date != null }
        .groupBy { it.date!! }
        .maxByOrNull { it.value.size }
        ?.let { it.key to it.value.size }
}

