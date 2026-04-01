package com.antiprocrastinator.app.ui.pages

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.antiprocrastinator.app.data.model.*
import com.antiprocrastinator.app.data.repository.TodoRepository
import com.antiprocrastinator.app.ui.components.rememberHapticManager
import com.antiprocrastinator.app.ui.theme.AppTheme
import com.antiprocrastinator.app.ui.theme.SpaceMono
import java.time.LocalDate
import java.time.format.DateTimeFormatter

/**
 * To-Do Page — Hauptseite (Fullscreen)
 * Snapchat-Centerpage: Minimalistisch, touch-optimiert
 */
@Composable
fun TodoPage() {
    val colors = AppTheme.colors
    val repository = remember { TodoRepository() }
    val haptic = rememberHapticManager()

    var todos by remember { mutableStateOf(repository.getAllTodos()) }
    var filter by remember { mutableStateOf(TodoFilter.ALL) }
    var inputText by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf(TodoCategory.ARBEIT) }
    var showCategoryPicker by remember { mutableStateOf(false) }
    val stats = remember(todos) { repository.getStats() }

    fun refresh() { todos = repository.getFilteredTodos(filter) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bg)
            .statusBarsPadding()
            .padding(horizontal = 20.dp)
    ) {
        Spacer(Modifier.height(16.dp))

        // ── Header ──
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    "AUFGABEN",
                    style = MaterialTheme.typography.labelLarge,
                    color = colors.textMuted,
                    letterSpacing = 3.sp
                )
                Text(
                    "${stats.done}/${stats.total} erledigt",
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.textMuted
                )
            }

            // Tages-Fortschrittsring
            Box(contentAlignment = Alignment.Center) {
                CircularProgressIndicator(
                    progress = { if (stats.total > 0) stats.done.toFloat() / stats.total else 0f },
                    modifier = Modifier.size(44.dp),
                    color = colors.text,
                    trackColor = colors.border,
                    strokeWidth = 3.dp
                )
                Text(
                    "${stats.rate}%",
                    fontFamily = SpaceMono,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.text
                )
            }
        }

        Spacer(Modifier.height(20.dp))

        // ── Input Row ──
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(colors.card, RoundedCornerShape(16.dp))
                .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                .padding(4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Category Pill
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(colors.input)
                    .clickable { showCategoryPicker = !showCategoryPicker }
                    .padding(horizontal = 12.dp, vertical = 12.dp)
            ) {
                Text(
                    selectedCategory.label.take(3).uppercase(),
                    fontFamily = SpaceMono,
                    fontSize = 8.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.textSecondary,
                    letterSpacing = 1.sp
                )
            }

            BasicTextField(
                value = inputText,
                onValueChange = { inputText = it },
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 12.dp, vertical = 12.dp),
                textStyle = MaterialTheme.typography.bodyMedium.copy(color = colors.text),
                cursorBrush = SolidColor(colors.text),
                singleLine = true,
                decorationBox = { innerTextField ->
                    Box {
                        if (inputText.isEmpty()) {
                            Text(
                                "Neue Aufgabe...",
                                style = MaterialTheme.typography.bodyMedium,
                                color = colors.textMuted
                            )
                        }
                        innerTextField()
                    }
                }
            )

            // Add Button
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(colors.text)
                    .clickable {
                        if (inputText.isNotBlank()) {
                            repository.addTodo(inputText.trim(), LocalDate.now(), selectedCategory)
                            inputText = ""
                            refresh()
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                Text("+", color = colors.bg, fontSize = 20.sp, fontWeight = FontWeight.Light)
            }
        }

        // ── Category Picker (animated) ──
        AnimatedVisibility(
            visible = showCategoryPicker,
            enter = expandVertically() + fadeIn(),
            exit = shrinkVertically() + fadeOut()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                TodoCategory.entries.forEach { cat ->
                    val isSelected = cat == selectedCategory
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(if (isSelected) colors.text else colors.input)
                            .border(1.dp, if (isSelected) colors.text else colors.border, RoundedCornerShape(20.dp))
                            .clickable {
                                selectedCategory = cat
                                showCategoryPicker = false
                            }
                            .padding(horizontal = 14.dp, vertical = 8.dp)
                    ) {
                        Text(
                            cat.label,
                            fontFamily = SpaceMono,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (isSelected) colors.bg else colors.textSecondary,
                            letterSpacing = 1.sp
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        // ── Filter Pills ──
        Row(
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            TodoFilter.entries.forEach { f ->
                val label = when (f) {
                    TodoFilter.ALL -> "Alle"
                    TodoFilter.TODAY -> "Heute"
                    TodoFilter.OPEN -> "Offen"
                    TodoFilter.DONE -> "Erledigt"
                }
                val isActive = f == filter
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(if (isActive) colors.text else colors.bg)
                        .border(1.dp, if (isActive) colors.text else colors.border, RoundedCornerShape(20.dp))
                        .clickable {
                            filter = f
                            refresh()
                        }
                        .padding(horizontal = 14.dp, vertical = 7.dp)
                ) {
                    Text(
                        label.uppercase(),
                        fontFamily = SpaceMono,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isActive) colors.bg else colors.textMuted,
                        letterSpacing = 1.sp
                    )
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        // ── Todo List ──
        if (todos.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("--", color = colors.textMuted, fontFamily = SpaceMono, fontSize = 20.sp)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "KEINE AUFGABEN",
                        fontFamily = SpaceMono,
                        fontSize = 10.sp,
                        color = colors.textMuted,
                        letterSpacing = 2.sp
                    )
                }
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                items(todos, key = { it.id }) { todo ->
                    TodoItem(
                        todo = todo,
                        onToggle = {
                            repository.toggleTodo(todo.id)
                            val count = repository.getTodayCompletedCount()
                            if (!todo.completed) haptic.todoChecked(count)
                            refresh()
                        },
                        onDelete = {
                            repository.deleteTodo(todo.id)
                            refresh()
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun TodoItem(
    todo: Todo,
    onToggle: () -> Unit,
    onDelete: () -> Unit
) {
    val colors = AppTheme.colors
    val checkAnimation by animateFloatAsState(
        targetValue = if (todo.completed) 1f else 0f,
        animationSpec = spring(dampingRatio = 0.6f), label = "check"
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(colors.card.copy(alpha = 0.5f))
            .clickable(onClick = onToggle)
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Checkbox Circle
        Box(
            modifier = Modifier
                .size(22.dp)
                .clip(CircleShape)
                .background(
                    if (todo.completed) colors.text else colors.bg,
                )
                .border(
                    width = 1.5.dp,
                    color = if (todo.completed) colors.text else colors.textMuted,
                    shape = CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            if (todo.completed) {
                Text("✓", color = colors.bg, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                todo.text,
                style = MaterialTheme.typography.bodyMedium,
                color = if (todo.completed) colors.textMuted else colors.text,
                textDecoration = if (todo.completed) TextDecoration.LineThrough else null,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            Row(
                modifier = Modifier.padding(top = 3.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Category tag
                Box(
                    modifier = Modifier
                        .background(colors.input, RoundedCornerShape(10.dp))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(
                        todo.category.label,
                        fontFamily = SpaceMono,
                        fontSize = 8.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = colors.textSecondary,
                        letterSpacing = 0.5.sp
                    )
                }

                // Date
                todo.date?.let { date ->
                    Text(
                        date.format(DateTimeFormatter.ofPattern("dd. MMM")),
                        fontFamily = SpaceMono,
                        fontSize = 9.sp,
                        color = colors.textMuted
                    )
                }
            }
        }

        // Delete button
        Box(
            modifier = Modifier
                .size(28.dp)
                .clip(CircleShape)
                .clickable(onClick = onDelete),
            contentAlignment = Alignment.Center
        ) {
            Text("×", color = colors.textMuted, fontSize = 16.sp, fontFamily = SpaceMono)
        }
    }
}

