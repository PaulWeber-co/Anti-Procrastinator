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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.antiprocrastinator.app.AntiProcrastinatorApp
import com.antiprocrastinator.app.data.model.*
import com.antiprocrastinator.app.ui.theme.AppTheme
import com.antiprocrastinator.app.ui.theme.SpaceMono
import kotlinx.coroutines.delay
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.*
import kotlin.math.cos
import kotlin.math.sin

/**
 * Overview Page — Oben (Swipe nach unten von ToDo)
 * Uhr (Pixel-Design), Wetter, Planer (Uni/Schule/Bachelor/Master/Provadis)
 * Touch-optimiert für Handy
 */
@Composable
fun OverviewPage() {
    val colors = AppTheme.colors
    val prefs = AntiProcrastinatorApp.instance.preferenceManager
    var weather by remember { mutableStateOf(prefs.getCachedWeather()) }
    var planerMode by remember { mutableStateOf(prefs.getPlanerMode()) }
    var planerData by remember { mutableStateOf(prefs.getPlanerData()) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bg)
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(24.dp))

        Text(
            "ÜBERSICHT",
            style = MaterialTheme.typography.labelLarge,
            color = colors.textMuted,
            letterSpacing = 3.sp
        )

        Spacer(Modifier.height(24.dp))

        // ══════════════════════════════════════
        // Pixel Clock (Dot-Matrix Design)
        // ══════════════════════════════════════
        PixelClock()

        Spacer(Modifier.height(24.dp))

        // ══════════════════════════════════════
        // Weather Widget
        // ══════════════════════════════════════
        weather?.let { w ->
            WeatherCard(w)
            Spacer(Modifier.height(16.dp))
        }

        // ══════════════════════════════════════
        // Planer Selection / View
        // ══════════════════════════════════════
        if (planerMode == null) {
            PlanerModeSelect { mode ->
                prefs.setPlanerMode(mode)
                planerMode = mode
            }
        } else {
            PlanerQuickView(
                mode = planerMode!!,
                data = planerData,
                onReset = {
                    prefs.setPlanerMode(null)
                    prefs.savePlanerData(emptyList())
                    planerMode = null
                    planerData = emptyList()
                }
            )
        }

        Spacer(Modifier.height(40.dp))
    }
}

// ══════════════════════════════════════════════════════════
// Pixel Clock — Dot-Matrix Stil
// ══════════════════════════════════════════════════════════

@Composable
private fun PixelClock() {
    val colors = AppTheme.colors
    var time by remember { mutableStateOf(LocalTime.now(ZoneId.of("Europe/Berlin"))) }
    var date by remember { mutableStateOf(LocalDate.now(ZoneId.of("Europe/Berlin"))) }

    LaunchedEffect(Unit) {
        while (true) {
            time = LocalTime.now(ZoneId.of("Europe/Berlin"))
            date = LocalDate.now(ZoneId.of("Europe/Berlin"))
            delay(1000)
        }
    }

    val timeStr = time.format(DateTimeFormatter.ofPattern("HH:mm:ss"))
    val dateStr = date.format(DateTimeFormatter.ofPattern("EEEE, dd. MMMM yyyy", Locale.GERMAN))

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(colors.card, RoundedCornerShape(20.dp))
            .border(1.dp, colors.border, RoundedCornerShape(20.dp))
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            // Analoge Uhr mit Dot-Matrix
            Canvas(
                modifier = Modifier.size(140.dp)
            ) {
                val cx = size.width / 2
                val cy = size.height / 2
                val radius = size.width / 2 - 12

                // Dot grid background
                val dotStep = 8f
                val dotSize = 2f
                for (gx in 0..((size.width / dotStep).toInt())) {
                    for (gy in 0..((size.height / dotStep).toInt())) {
                        val px = gx * dotStep
                        val py = gy * dotStep
                        val dist = kotlin.math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy))
                        if (dist < radius + 4) {
                            drawRect(
                                color = colors.border.copy(alpha = 0.3f),
                                topLeft = Offset(px, py),
                                size = androidx.compose.ui.geometry.Size(dotSize, dotSize)
                            )
                        }
                    }
                }

                // Hour markers
                for (i in 1..12) {
                    val angle = Math.toRadians((i * 30 - 90).toDouble())
                    val nx = cx + cos(angle).toFloat() * (radius - 4)
                    val ny = cy + sin(angle).toFloat() * (radius - 4)
                    val dR = if (i % 3 == 0) 4f else 2.5f
                    drawRect(
                        color = if (i % 3 == 0) colors.text else colors.textMuted,
                        topLeft = Offset(nx - dR / 2, ny - dR / 2),
                        size = androidx.compose.ui.geometry.Size(dR, dR)
                    )
                }

                val h = time.hour
                val m = time.minute
                val s = time.second

                // Hour hand
                val hAngle = Math.toRadians(((h % 12) * 30.0 + m * 0.5 - 90))
                drawDotHand(cx, cy, hAngle.toFloat(), radius * 0.5f, 4f, colors.text)

                // Minute hand
                val mAngle = Math.toRadians((m * 6.0 + s * 0.1 - 90))
                drawDotHand(cx, cy, mAngle.toFloat(), radius * 0.72f, 3f, colors.text)

                // Second hand
                val sAngle = Math.toRadians((s * 6.0 - 90))
                drawDotHand(cx, cy, sAngle.toFloat(), radius * 0.8f, 2f, colors.textMuted)

                // Center dot
                drawRect(colors.text, Offset(cx - 3, cy - 3), androidx.compose.ui.geometry.Size(6f, 6f))
            }

            Spacer(Modifier.height(12.dp))

            // Digital time
            Text(
                timeStr,
                fontFamily = SpaceMono,
                fontSize = 28.sp,
                fontWeight = FontWeight.Light,
                color = colors.text,
                letterSpacing = 2.sp
            )
            Spacer(Modifier.height(4.dp))
            Text(
                dateStr.uppercase(),
                fontFamily = SpaceMono,
                fontSize = 9.sp,
                color = colors.textMuted,
                letterSpacing = 1.sp
            )
        }
    }
}

private fun DrawScope.drawDotHand(cx: Float, cy: Float, angle: Float, length: Float, dotSize: Float, color: Color) {
    val step = dotSize + 2
    val numDots = (length / step).toInt()
    for (d in 1..numDots) {
        val dist = d * step
        val x = cx + cos(angle.toDouble()).toFloat() * dist
        val y = cy + sin(angle.toDouble()).toFloat() * dist
        val s = dotSize * (0.7f + 0.3f * (d.toFloat() / numDots))
        drawRect(color, Offset(x - s / 2, y - s / 2), androidx.compose.ui.geometry.Size(s, s))
    }
}

// ══════════════════════════════════════════════════════════
// Weather Card
// ══════════════════════════════════════════════════════════

@Composable
private fun WeatherCard(weather: WeatherData) {
    val colors = AppTheme.colors

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
                Text(
                    "${weather.temp}°",
                    fontFamily = SpaceMono,
                    fontSize = 40.sp,
                    fontWeight = FontWeight.Light,
                    color = colors.text
                )
                Text(weather.desc, fontSize = 11.sp, color = colors.textMuted, fontFamily = SpaceMono)
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(weather.city, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = colors.text)
                if (weather.dailyMax.isNotEmpty()) {
                    Text(
                        "H:${weather.dailyMax[0]}° L:${weather.dailyMin[0]}°",
                        fontFamily = SpaceMono, fontSize = 10.sp, color = colors.textMuted
                    )
                }
            }
        }
    }
}

// ══════════════════════════════════════════════════════════
// Planer Mode Select
// ══════════════════════════════════════════════════════════

@Composable
private fun PlanerModeSelect(onSelect: (PlanerMode) -> Unit) {
    val colors = AppTheme.colors

    Column {
        Text(
            "PLANER",
            fontFamily = SpaceMono,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            color = colors.textMuted,
            letterSpacing = 3.sp,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        Text(
            "Wähle deinen Planer",
            fontFamily = SpaceMono,
            fontSize = 10.sp,
            color = colors.textMuted,
            letterSpacing = 2.sp,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        val modes = listOf(
            PlanerMode.SCHULE to ".:S:." to "Klassen 5-13",
            PlanerMode.BACHELOR to ".:B:." to "6 Semester · 180 ECTS",
            PlanerMode.MASTER to ".:M:." to "4 Semester · 120 ECTS",
            PlanerMode.PROVADIS to ".:P:." to "Informatik B.Sc."
        )

        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            modes.chunked(2).forEach { row ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    row.forEach { (modeIcon, desc) ->
                        val (mode, icon) = modeIcon
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(16.dp))
                                .background(colors.card)
                                .border(1.5.dp, colors.border, RoundedCornerShape(16.dp))
                                .clickable { onSelect(mode) }
                                .padding(20.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Box(
                                    modifier = Modifier
                                        .size(48.dp)
                                        .border(1.5.dp, colors.border, RoundedCornerShape(12.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(icon, fontFamily = SpaceMono, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = colors.text)
                                }
                                Spacer(Modifier.height(8.dp))
                                Text(
                                    mode.label.substringBefore(" ").uppercase(),
                                    fontFamily = SpaceMono,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = colors.text,
                                    letterSpacing = 1.sp
                                )
                                Text(desc, fontSize = 9.sp, color = colors.textMuted, textAlign = TextAlign.Center)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ══════════════════════════════════════════════════════════
// Planer Quick View
// ══════════════════════════════════════════════════════════

@Composable
private fun PlanerQuickView(mode: PlanerMode, data: List<PlanerPeriod>, onReset: () -> Unit) {
    val colors = AppTheme.colors

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
                    mode.label.uppercase(),
                    fontFamily = SpaceMono,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.textMuted,
                    letterSpacing = 2.sp
                )
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .border(1.dp, colors.border, RoundedCornerShape(8.dp))
                        .clickable(onClick = onReset)
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text("⟳", fontFamily = SpaceMono, fontSize = 12.sp, color = colors.textMuted)
                }
            }

            Spacer(Modifier.height(12.dp))

            if (data.isEmpty()) {
                Text("Noch keine Daten", color = colors.textMuted, fontSize = 11.sp, fontFamily = SpaceMono)
            } else {
                data.forEach { period ->
                    Text(
                        "${mode.periodLabel} ${period.period} — ${period.modules.size} ${if (mode.isSchule) "Fächer" else "Module"}",
                        fontFamily = SpaceMono,
                        fontSize = 11.sp,
                        color = colors.text,
                        modifier = Modifier.padding(vertical = 3.dp)
                    )
                }
            }
        }
    }
}

