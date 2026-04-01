package com.antiprocrastinator.app.navigation

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.*
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.antiprocrastinator.app.ui.components.rememberHapticManager
import com.antiprocrastinator.app.ui.pages.*
import com.antiprocrastinator.app.ui.theme.AppTheme
import kotlinx.coroutines.launch
import kotlin.math.absoluteValue
import kotlin.math.roundToInt

/**
 * Snapchat-Style Cross-Navigation:
 *
 *              [Overview]    (oben – Uhr, Wetter, Planer)
 *                  ↑
 * [Summary] ← [To-Do] → [Calendar]
 *                  ↓
 *           [Visualizations]  (unten – Charts, Fortschritt)
 *
 * Horizontal: Summary ← ToDo → Calendar
 * Vertical: Overview ↑ ToDo ↓ Visualizations
 */
@Composable
fun SwipeNavigation() {
    val colors = AppTheme.colors

    // Current page: 0=Summary, 1=ToDo(center), 2=Calendar
    var horizontalPage by remember { mutableIntStateOf(1) }
    // Vertical offset from center: -1=Overview, 0=ToDo, 1=Visualizations
    var verticalPage by remember { mutableIntStateOf(0) }

    val coroutineScope = rememberCoroutineScope()
    val configuration = LocalConfiguration.current
    val screenWidthPx = with(LocalDensity.current) { configuration.screenWidthDp.dp.toPx() }
    val screenHeightPx = with(LocalDensity.current) { configuration.screenHeightDp.dp.toPx() }

    // Animated offsets
    val horizontalOffset = remember { Animatable(0f) }
    val verticalOffset = remember { Animatable(0f) }

    // Navigation state
    val isAtCenter = horizontalPage == 1 && verticalPage == 0

    // Page indicator dots
    val pageIndicatorAlpha by animateFloatAsState(
        targetValue = if (isAtCenter) 0.6f else 0f,
        animationSpec = tween(300), label = "indicator"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bg)
            .pointerInput(horizontalPage, verticalPage) {
                detectDragGestures(
                    onDragEnd = {
                        coroutineScope.launch {
                            val hOff = horizontalOffset.value
                            val vOff = verticalOffset.value

                            // Determine dominant axis
                            if (hOff.absoluteValue > vOff.absoluteValue) {
                                // Horizontal swipe
                                val threshold = screenWidthPx * 0.25f
                                when {
                                    hOff > threshold && horizontalPage > 0 -> {
                                        horizontalPage--
                                    }
                                    hOff < -threshold && horizontalPage < 2 -> {
                                        horizontalPage++
                                    }
                                }
                            } else {
                                // Vertical swipe (nur auf der Center-Page)
                                if (horizontalPage == 1) {
                                    val threshold = screenHeightPx * 0.2f
                                    when {
                                        vOff > threshold && verticalPage > -1 -> {
                                            verticalPage--
                                        }
                                        vOff < -threshold && verticalPage < 1 -> {
                                            verticalPage++
                                        }
                                    }
                                }
                            }
                            // Snap back
                            horizontalOffset.animateTo(0f, spring(stiffness = Spring.StiffnessLow))
                            verticalOffset.animateTo(0f, spring(stiffness = Spring.StiffnessLow))
                        }
                    },
                    onDrag = { change, dragAmount ->
                        change.consume()
                        coroutineScope.launch {
                            // Determine primary drag direction
                            if (dragAmount.x.absoluteValue > dragAmount.y.absoluteValue) {
                                // Horizontal - apply resistance at edges
                                val resistance = when {
                                    horizontalPage == 0 && dragAmount.x > 0 -> 0.3f
                                    horizontalPage == 2 && dragAmount.x < 0 -> 0.3f
                                    else -> 1f
                                }
                                horizontalOffset.snapTo(horizontalOffset.value + dragAmount.x * resistance)
                            } else if (horizontalPage == 1) {
                                // Vertical only on center page
                                val resistance = when {
                                    verticalPage == -1 && dragAmount.y > 0 -> 0.3f
                                    verticalPage == 1 && dragAmount.y < 0 -> 0.3f
                                    else -> 1f
                                }
                                verticalOffset.snapTo(verticalOffset.value + dragAmount.y * resistance)
                            }
                        }
                    }
                )
            }
    ) {
        // ── Background pages (pre-render for smooth transitions) ──

        // Calculate page offset for smooth transitions
        val hProgress = horizontalOffset.value / screenWidthPx
        val vProgress = verticalOffset.value / screenHeightPx

        // Render current page
        Box(
            modifier = Modifier
                .fillMaxSize()
                .offset { IntOffset(horizontalOffset.value.roundToInt(), verticalOffset.value.roundToInt()) }
        ) {
            when {
                horizontalPage == 0 -> SummaryPage()
                horizontalPage == 2 -> CalendarPage()
                verticalPage == -1 -> OverviewPage()
                verticalPage == 1 -> VisualizationsPage()
                else -> TodoPage()
            }
        }

        // Render peek of next pages (parallax effect)
        if (isAtCenter) {
            // Left peek (Summary)
            if (horizontalOffset.value > 0) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .offset { IntOffset((-screenWidthPx + horizontalOffset.value).roundToInt(), 0) }
                        .alpha((horizontalOffset.value / screenWidthPx).coerceIn(0f, 1f) * 0.9f + 0.1f)
                ) {
                    SummaryPage()
                }
            }

            // Right peek (Calendar)
            if (horizontalOffset.value < 0) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .offset { IntOffset((screenWidthPx + horizontalOffset.value).roundToInt(), 0) }
                        .alpha((-horizontalOffset.value / screenWidthPx).coerceIn(0f, 1f) * 0.9f + 0.1f)
                ) {
                    CalendarPage()
                }
            }

            // Top peek (Overview)
            if (verticalOffset.value > 0) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .offset { IntOffset(0, (-screenHeightPx + verticalOffset.value).roundToInt()) }
                        .alpha((verticalOffset.value / screenHeightPx).coerceIn(0f, 1f) * 0.9f + 0.1f)
                ) {
                    OverviewPage()
                }
            }

            // Bottom peek (Visualizations)
            if (verticalOffset.value < 0) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .offset { IntOffset(0, (screenHeightPx + verticalOffset.value).roundToInt()) }
                        .alpha((-verticalOffset.value / screenHeightPx).coerceIn(0f, 1f) * 0.9f + 0.1f)
                ) {
                    VisualizationsPage()
                }
            }
        }

        // ── Page Indicator Dots ──
        if (pageIndicatorAlpha > 0.01f) {
            // Horizontal indicator (bottom center)
            Row(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 40.dp)
                    .alpha(pageIndicatorAlpha),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                for (i in 0..2) {
                    Box(
                        modifier = Modifier
                            .size(if (i == horizontalPage) 8.dp else 5.dp)
                            .background(
                                color = if (i == horizontalPage) colors.text else colors.textMuted,
                                shape = androidx.compose.foundation.shape.CircleShape
                            )
                    )
                }
            }

            // Vertical indicator (right center)
            Column(
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = 12.dp)
                    .alpha(pageIndicatorAlpha),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                for (i in -1..1) {
                    Box(
                        modifier = Modifier
                            .size(if (i == verticalPage) 8.dp else 5.dp)
                            .background(
                                color = if (i == verticalPage) colors.text else colors.textMuted,
                                shape = androidx.compose.foundation.shape.CircleShape
                            )
                    )
                }
            }
        }
    }
}

