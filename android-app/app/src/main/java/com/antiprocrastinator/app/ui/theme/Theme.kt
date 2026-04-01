package com.antiprocrastinator.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Wir verwenden system monospace als Fallback
val SpaceMono = FontFamily.Monospace
val SpaceGrotesk = FontFamily.SansSerif

// ══════════════════════════════════════════════════════════
// App-spezifische Farben (erweitert Material)
// ══════════════════════════════════════════════════════════

data class AppColors(
    val bg: Color,
    val card: Color,
    val input: Color,
    val text: Color,
    val textSecondary: Color,
    val textMuted: Color,
    val border: Color,
    val accent: Color,
    val red: Color,
    val isDark: Boolean
)

val LocalAppColors = staticCompositionLocalOf {
    AppColors(
        bg = LightBg, card = LightCard, input = LightInput,
        text = LightText, textSecondary = LightTextSecondary, textMuted = LightTextMuted,
        border = LightBorder, accent = LightAccent, red = LightRed, isDark = false
    )
}

val LightAppColors = AppColors(
    bg = LightBg, card = LightCard, input = LightInput,
    text = LightText, textSecondary = LightTextSecondary, textMuted = LightTextMuted,
    border = LightBorder, accent = LightAccent, red = LightRed, isDark = false
)

val DarkAppColors = AppColors(
    bg = DarkBg, card = DarkCard, input = DarkInput,
    text = DarkText, textSecondary = DarkTextSecondary, textMuted = DarkTextMuted,
    border = DarkBorder, accent = DarkAccent, red = DarkRed, isDark = true
)

// ══════════════════════════════════════════════════════════
// Typography
// ══════════════════════════════════════════════════════════

val AppTypography = Typography(
    headlineLarge = TextStyle(
        fontFamily = SpaceMono,
        fontWeight = FontWeight.Bold,
        fontSize = 36.sp,
        letterSpacing = 2.sp
    ),
    headlineMedium = TextStyle(
        fontFamily = SpaceMono,
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        letterSpacing = 1.sp
    ),
    titleLarge = TextStyle(
        fontFamily = SpaceMono,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        letterSpacing = 1.5.sp
    ),
    titleMedium = TextStyle(
        fontFamily = SpaceMono,
        fontWeight = FontWeight.SemiBold,
        fontSize = 13.sp,
        letterSpacing = 1.5.sp
    ),
    bodyLarge = TextStyle(
        fontFamily = SpaceGrotesk,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = SpaceGrotesk,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp
    ),
    bodySmall = TextStyle(
        fontFamily = SpaceGrotesk,
        fontWeight = FontWeight.Normal,
        fontSize = 10.sp
    ),
    labelLarge = TextStyle(
        fontFamily = SpaceMono,
        fontWeight = FontWeight.Bold,
        fontSize = 10.sp,
        letterSpacing = 2.sp
    ),
    labelMedium = TextStyle(
        fontFamily = SpaceMono,
        fontWeight = FontWeight.SemiBold,
        fontSize = 9.sp,
        letterSpacing = 1.5.sp
    ),
    labelSmall = TextStyle(
        fontFamily = SpaceMono,
        fontWeight = FontWeight.SemiBold,
        fontSize = 8.sp,
        letterSpacing = 1.sp
    )
)

// ══════════════════════════════════════════════════════════
// Theme Composable
// ══════════════════════════════════════════════════════════

@Composable
fun AntiProcrastinatorTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val appColors = if (darkTheme) DarkAppColors else LightAppColors

    val colorScheme = if (darkTheme) {
        darkColorScheme(
            background = DarkBg,
            surface = DarkCard,
            onBackground = DarkText,
            onSurface = DarkText,
            primary = DarkAccent,
            onPrimary = DarkBg,
            error = DarkRed
        )
    } else {
        lightColorScheme(
            background = LightBg,
            surface = LightCard,
            onBackground = LightText,
            onSurface = LightText,
            primary = LightAccent,
            onPrimary = LightBg,
            error = LightRed
        )
    }

    CompositionLocalProvider(LocalAppColors provides appColors) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = AppTypography,
            content = content
        )
    }
}

// Extension für einfachen Zugriff
object AppTheme {
    val colors: AppColors
        @Composable get() = LocalAppColors.current
}

