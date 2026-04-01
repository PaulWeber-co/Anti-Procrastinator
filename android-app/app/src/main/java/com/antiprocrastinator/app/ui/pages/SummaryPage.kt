package com.antiprocrastinator.app.ui.pages

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.antiprocrastinator.app.AntiProcrastinatorApp
import com.antiprocrastinator.app.data.model.*
import com.antiprocrastinator.app.data.repository.TodoRepository
import com.antiprocrastinator.app.ui.theme.*
import kotlinx.coroutines.delay
import java.time.LocalDate
import java.time.LocalTime
import java.time.YearMonth
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.*

/**
 * Summary Page — Links (Swipe nach rechts von ToDo)
 * Alle wichtigsten Infos auf einen Blick (kompakte Version):
 * Fortschrittsanzeige, Kalender-Mini, heutige ToDos, Uhr, Wetter, Noten
 */
@Composable
fun SummaryPage() {
    val colors = AppTheme.colors
    val repository = remember { TodoRepository() }
    val prefs = AntiProcrastinatorApp.instance.preferenceManager
    val stats = remember { repository.getStats() }
    val todayTodos = remember { repository.getFilteredTodos(TodoFilter.TODAY) }
    val weather = remember { prefs.getCachedWeather() }
    val categoryData = remember { repository.getCategoryData() }

    var time by remember { mutableStateOf(LocalTime.now(ZoneId.of("Europe/Berlin"))) }

    LaunchedEffect(Unit) {
        while (true) {
            time = LocalTime.now(ZoneId.of("Europe/Berlin"))
            delay(1000)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bg)
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp)
    ) {
        Spacer(Modifier.height(16.dp))

        Text(
            "DASHBOARD",
            style = MaterialTheme.typography.labelLarge,
            color = colors.textMuted,
            letterSpacing = 3.sp
        )

        Spacer(Modifier.height(16.dp))

        // ── Row 1: Uhr + Wetter ──
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Mini Clock
            Box(
                modifier = Modifier
                    .weight(1f)
                    .background(colors.card, RoundedCornerShape(16.dp))
                    .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "UHR",
                        fontFamily = SpaceMono,
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.textMuted,
                        letterSpacing = 2.sp
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        time.format(DateTimeFormatter.ofPattern("HH:mm")),
                        fontFamily = SpaceMono,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Light,
                        color = colors.text,
                        letterSpacing = 2.sp
                    )
                    Text(
                        LocalDate.now().format(DateTimeFormatter.ofPattern("dd. MMM", Locale.GERMAN)).uppercase(),
                        fontFamily = SpaceMono,
                        fontSize = 9.sp,
                        color = colors.textMuted
                    )
                }
            }

            // Mini Weather
            Box(
                modifier = Modifier
                    .weight(1f)
                    .background(colors.card, RoundedCornerShape(16.dp))
                    .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "WETTER",
                        fontFamily = SpaceMono,
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.textMuted,
                        letterSpacing = 2.sp
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "${weather?.temp ?: "--"}°",
                        fontFamily = SpaceMono,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Light,
                        color = colors.text
                    )
                    Text(
                        weather?.city ?: "—",
                        fontFamily = SpaceMono,
                        fontSize = 9.sp,
                        color = colors.textMuted,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }

        Spacer(Modifier.height(10.dp))

        // ── Row 2: Progress Ring + Stats ──
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Progress Ring
            Box(
                modifier = Modifier
                    .weight(1f)
                    .background(colors.card, RoundedCornerShape(16.dp))
                    .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("FORTSCHRITT", fontFamily = SpaceMono, fontSize = 8.sp, fontWeight = FontWeight.Bold, color = colors.textMuted, letterSpacing = 2.sp)
                    Spacer(Modifier.height(8.dp))
                    Box(contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(
                            progress = { if (stats.total > 0) stats.done.toFloat() / stats.total else 0f },
                            modifier = Modifier.size(60.dp),
                            color = colors.text,
                            trackColor = colors.border,
                            strokeWidth = 4.dp
                        )
                        Text(
                            "${stats.rate}%",
                            fontFamily = SpaceMono,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = colors.text
                        )
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "${stats.done}/${stats.total}",
                        fontFamily = SpaceMono,
                        fontSize = 10.sp,
                        color = colors.textMuted
                    )
                }
            }

            // Stats
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    MiniStat("OFFEN", "${stats.open}", Modifier.weight(1f))
                    MiniStat("ERLEDIGT", "${stats.done}", Modifier.weight(1f))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    MiniStat("GESAMT", "${stats.total}", Modifier.weight(1f))
                    MiniStat("RATE", "${stats.rate}%", Modifier.weight(1f))
                }
            }
        }

        Spacer(Modifier.height(10.dp))

        // ── Mini Calendar (current month overview) ──
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(colors.card, RoundedCornerShape(16.dp))
                .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                .padding(12.dp)
        ) {
            Column {
                Text("KALENDER", fontFamily = SpaceMono, fontSize = 8.sp, fontWeight = FontWeight.Bold, color = colors.textMuted, letterSpacing = 2.sp)
                Spacer(Modifier.height(8.dp))

                val today = LocalDate.now()
                val month = YearMonth.now()

                Row(modifier = Modifier.fillMaxWidth()) {
                    listOf("M", "D", "M", "D", "F", "S", "S").forEach { d ->
                        Text(
                            d,
                            modifier = Modifier.weight(1f),
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                            fontFamily = SpaceMono,
                            fontSize = 7.sp,
                            color = colors.textMuted,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                Spacer(Modifier.height(4.dp))

                var dayOffset = month.atDay(1).dayOfWeek.value - 1
                var dayNum = 1
                val totalDays = month.lengthOfMonth()

                for (week in 0..5) {
                    if (dayNum > totalDays) break
                    Row(modifier = Modifier.fillMaxWidth()) {
                        for (dow in 0..6) {
                            if ((week == 0 && dow < dayOffset) || dayNum > totalDays) {
                                Spacer(Modifier.weight(1f))
                            } else {
                                val d = dayNum
                                val isToday = month.atDay(d) == today
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .padding(1.dp)
                                        .aspectRatio(1f)
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(
                                            if (isToday) colors.text else colors.bg
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        "$d",
                                        fontFamily = SpaceMono,
                                        fontSize = 7.sp,
                                        color = if (isToday) colors.bg else colors.textMuted,
                                        fontWeight = if (isToday) FontWeight.Bold else FontWeight.Normal
                                    )
                                }
                                dayNum++
                            }
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(10.dp))

        // ── Today's Todos ──
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(colors.card, RoundedCornerShape(16.dp))
                .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                .padding(12.dp)
        ) {
            Column {
                Text("HEUTE", fontFamily = SpaceMono, fontSize = 8.sp, fontWeight = FontWeight.Bold, color = colors.textMuted, letterSpacing = 2.sp)
                Spacer(Modifier.height(6.dp))

                if (todayTodos.isEmpty()) {
                    Text("Keine Aufgaben für heute", fontFamily = SpaceMono, fontSize = 10.sp, color = colors.textMuted)
                } else {
                    todayTodos.take(5).forEach { todo ->
                        Row(
                            modifier = Modifier.padding(vertical = 2.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(10.dp)
                                    .clip(CircleShape)
                                    .background(if (todo.completed) colors.text else colors.border)
                                    .then(
                                        if (!todo.completed) Modifier.border(1.dp, colors.textMuted, CircleShape)
                                        else Modifier
                                    )
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(
                                todo.text,
                                fontSize = 10.sp,
                                color = if (todo.completed) colors.textMuted else colors.text,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                    if (todayTodos.size > 5) {
                        Text("+${todayTodos.size - 5} mehr", fontFamily = SpaceMono, fontSize = 8.sp, color = colors.textMuted, modifier = Modifier.padding(top = 2.dp))
                    }
                }
            }
        }

        Spacer(Modifier.height(10.dp))

        // ── Mini Category Bars ──
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(colors.card, RoundedCornerShape(16.dp))
                .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                .padding(12.dp)
        ) {
            Column {
                Text("KATEGORIEN", fontFamily = SpaceMono, fontSize = 8.sp, fontWeight = FontWeight.Bold, color = colors.textMuted, letterSpacing = 2.sp)
                Spacer(Modifier.height(8.dp))
                val total = categoryData.values.sum().coerceAtLeast(1)
                categoryData.forEach { (cat, count) ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            cat.label.take(4).uppercase(),
                            fontFamily = SpaceMono,
                            fontSize = 7.sp,
                            fontWeight = FontWeight.Bold,
                            color = colors.textMuted,
                            modifier = Modifier.width(40.dp)
                        )
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(6.dp)
                                .background(colors.input, RoundedCornerShape(3.dp))
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxHeight()
                                    .fillMaxWidth(count.toFloat() / total)
                                    .background(colors.text.copy(alpha = 0.6f), RoundedCornerShape(3.dp))
                            )
                        }
                        Spacer(Modifier.width(6.dp))
                        Text("$count", fontFamily = SpaceMono, fontSize = 8.sp, fontWeight = FontWeight.Bold, color = colors.text)
                    }
                }
            }
        }

        Spacer(Modifier.height(40.dp))
    }
}

@Composable
private fun MiniStat(label: String, value: String, modifier: Modifier = Modifier) {
    val colors = AppTheme.colors
    Box(
        modifier = modifier
            .background(colors.card, RoundedCornerShape(12.dp))
            .border(1.dp, colors.border, RoundedCornerShape(12.dp))
            .padding(10.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, fontFamily = SpaceMono, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = colors.text)
            Text(label, fontFamily = SpaceMono, fontSize = 6.sp, fontWeight = FontWeight.Bold, color = colors.textMuted, letterSpacing = 1.sp)
        }
    }
}

