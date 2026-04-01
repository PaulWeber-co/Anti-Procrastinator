package com.antiprocrastinator.app.ui.pages

import android.Manifest
import android.content.ContentResolver
import android.content.ContentUris
import android.content.pm.PackageManager
import android.provider.CalendarContract
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.antiprocrastinator.app.data.model.Todo
import com.antiprocrastinator.app.data.model.TodoCategory
import com.antiprocrastinator.app.data.repository.TodoRepository
import com.antiprocrastinator.app.ui.theme.AppTheme
import com.antiprocrastinator.app.ui.theme.SpaceMono
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.*

/**
 * Calendar Page — Fullscreen Kalender (Swipe nach links von ToDo)
 * Synchronisiert mit Android-System-Kalender (Google Calendar etc.)
 */
@Composable
fun CalendarPage() {
    val colors = AppTheme.colors
    val context = LocalContext.current
    val repository = remember { TodoRepository() }
    val tasksByDate = remember { repository.getTasksByDate() }

    var currentMonth by remember { mutableStateOf(YearMonth.now()) }
    var selectedDate by remember { mutableStateOf<LocalDate?>(LocalDate.now()) }
    var systemEvents by remember { mutableStateOf<Map<LocalDate, List<String>>>(emptyMap()) }

    // Versuche System-Kalender zu lesen
    LaunchedEffect(Unit) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CALENDAR) == PackageManager.PERMISSION_GRANTED) {
            systemEvents = readSystemCalendar(context.contentResolver)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bg)
            .statusBarsPadding()
            .padding(horizontal = 16.dp)
    ) {
        Spacer(Modifier.height(16.dp))

        // ── Header ──
        Text(
            "KALENDER",
            style = MaterialTheme.typography.labelLarge,
            color = colors.textMuted,
            letterSpacing = 3.sp,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        // ── Month Navigation ──
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .border(1.dp, colors.border, CircleShape)
                    .clickable { currentMonth = currentMonth.minusMonths(1) },
                contentAlignment = Alignment.Center
            ) {
                Text("<", fontFamily = SpaceMono, color = colors.textSecondary, fontSize = 14.sp)
            }

            Text(
                "${currentMonth.month.getDisplayName(TextStyle.FULL, Locale.GERMAN).uppercase()} ${currentMonth.year}",
                fontFamily = SpaceMono,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp,
                color = colors.text
            )

            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .border(1.dp, colors.border, CircleShape)
                    .clickable { currentMonth = currentMonth.plusMonths(1) },
                contentAlignment = Alignment.Center
            ) {
                Text(">", fontFamily = SpaceMono, color = colors.textSecondary, fontSize = 14.sp)
            }
        }

        Spacer(Modifier.height(16.dp))

        // ── Day Headers ──
        Row(modifier = Modifier.fillMaxWidth()) {
            listOf("MO", "DI", "MI", "DO", "FR", "SA", "SO").forEach { day ->
                Text(
                    day,
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.Center,
                    fontFamily = SpaceMono,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.textMuted,
                    letterSpacing = 1.sp
                )
            }
        }

        Spacer(Modifier.height(8.dp))

        // ── Calendar Grid ──
        val firstDay = currentMonth.atDay(1)
        var startOffset = firstDay.dayOfWeek.value - 1 // Mo=0 ... So=6
        val daysInMonth = currentMonth.lengthOfMonth()
        val today = LocalDate.now()

        LazyVerticalGrid(
            columns = GridCells.Fixed(7),
            modifier = Modifier.weight(1f),
            horizontalArrangement = Arrangement.spacedBy(2.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            // Empty cells for offset
            items(startOffset) {
                Box(modifier = Modifier.aspectRatio(1f))
            }

            // Days
            items(daysInMonth) { dayIndex ->
                val day = dayIndex + 1
                val date = currentMonth.atDay(day)
                val isToday = date == today
                val isSelected = date == selectedDate
                val hasTasks = tasksByDate.containsKey(date)
                val hasSystemEvents = systemEvents.containsKey(date)

                Box(
                    modifier = Modifier
                        .aspectRatio(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(
                            when {
                                isSelected -> colors.red
                                isToday -> colors.text.copy(alpha = 0.08f)
                                else -> colors.bg
                            }
                        )
                        .then(
                            if (isToday && !isSelected) Modifier.border(1.5.dp, colors.text, RoundedCornerShape(12.dp))
                            else Modifier
                        )
                        .clickable { selectedDate = if (selectedDate == date) null else date },
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            "$day",
                            fontFamily = SpaceMono,
                            fontSize = 12.sp,
                            fontWeight = if (isToday || isSelected) FontWeight.Bold else FontWeight.Normal,
                            color = if (isSelected) colors.bg else colors.text
                        )

                        // Dots für Tasks
                        if (hasTasks || hasSystemEvents) {
                            Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                                if (hasTasks) {
                                    Box(
                                        modifier = Modifier
                                            .size(4.dp)
                                            .background(
                                                if (isSelected) colors.bg.copy(alpha = 0.7f) else colors.text,
                                                CircleShape
                                            )
                                    )
                                }
                                if (hasSystemEvents) {
                                    Box(
                                        modifier = Modifier
                                            .size(4.dp)
                                            .background(
                                                if (isSelected) colors.bg.copy(alpha = 0.7f) else colors.red,
                                                CircleShape
                                            )
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // ── Selected Date Details ──
        selectedDate?.let { date ->
            Spacer(Modifier.height(12.dp))

            val dateTasks = tasksByDate[date] ?: emptyList()
            val dateEvents = systemEvents[date] ?: emptyList()

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(0.4f)
                    .background(colors.card, RoundedCornerShape(16.dp))
                    .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                    .padding(16.dp)
            ) {
                Column {
                    Text(
                        date.format(java.time.format.DateTimeFormatter.ofPattern("dd. MMMM yyyy", Locale.GERMAN)).uppercase(),
                        fontFamily = SpaceMono,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.textMuted,
                        letterSpacing = 1.sp
                    )
                    Spacer(Modifier.height(8.dp))

                    if (dateTasks.isEmpty() && dateEvents.isEmpty()) {
                        Text("Keine Termine", color = colors.textMuted, fontSize = 11.sp, fontFamily = SpaceMono)
                    }

                    // System Calendar Events
                    dateEvents.forEach { event ->
                        Row(
                            modifier = Modifier.padding(vertical = 3.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .width(3.dp)
                                    .height(16.dp)
                                    .background(colors.red, RoundedCornerShape(2.dp))
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(
                                event,
                                fontSize = 11.sp,
                                color = colors.text,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }

                    // App Tasks
                    dateTasks.forEach { task ->
                        Row(
                            modifier = Modifier.padding(vertical = 3.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .width(3.dp)
                                    .height(16.dp)
                                    .background(colors.text.copy(alpha = 0.5f), RoundedCornerShape(2.dp))
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(
                                task.text,
                                fontSize = 11.sp,
                                color = if (task.completed) colors.textMuted else colors.text,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(20.dp))
    }
}

/** Liest Events aus dem Android System-Kalender (Google Calendar, Samsung etc.) */
private fun readSystemCalendar(contentResolver: ContentResolver): Map<LocalDate, List<String>> {
    val result = mutableMapOf<LocalDate, MutableList<String>>()
    try {
        val now = Calendar.getInstance()
        val start = now.clone() as Calendar
        start.add(Calendar.MONTH, -1)
        val end = now.clone() as Calendar
        end.add(Calendar.MONTH, 3)

        val uri = CalendarContract.Events.CONTENT_URI
        val projection = arrayOf(
            CalendarContract.Events.TITLE,
            CalendarContract.Events.DTSTART
        )
        val selection = "${CalendarContract.Events.DTSTART} >= ? AND ${CalendarContract.Events.DTSTART} <= ?"
        val selectionArgs = arrayOf(start.timeInMillis.toString(), end.timeInMillis.toString())

        contentResolver.query(uri, projection, selection, selectionArgs, null)?.use { cursor ->
            while (cursor.moveToNext()) {
                val title = cursor.getString(0) ?: continue
                val dtStart = cursor.getLong(1)
                val cal = Calendar.getInstance().apply { timeInMillis = dtStart }
                val date = LocalDate.of(
                    cal.get(Calendar.YEAR),
                    cal.get(Calendar.MONTH) + 1,
                    cal.get(Calendar.DAY_OF_MONTH)
                )
                result.getOrPut(date) { mutableListOf() }.add(title)
            }
        }
    } catch (e: Exception) {
        // Permission denied or error
    }
    return result
}

