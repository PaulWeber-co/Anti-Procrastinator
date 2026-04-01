import SwiftUI

// ══════════════════════════════════════════════════════════
// App Theme — Nothing Dot Design Style
// ══════════════════════════════════════════════════════════

struct AppTheme {
    // ── Light ──
    static let lightBg = Color(hex: "F2F2F2")
    static let lightCard = Color.white
    static let lightInput = Color(hex: "F7F7F7")
    static let lightText = Color(hex: "0A0A0A")
    static let lightTextSecondary = Color(hex: "555555")
    static let lightTextMuted = Color(hex: "999999")
    static let lightBorder = Color(hex: "E0E0E0")
    static let lightRed = Color(hex: "D42020")

    // ── Dark ──
    static let darkBg = Color(hex: "0A0A0A")
    static let darkCard = Color(hex: "141414")
    static let darkInput = Color(hex: "1A1A1A")
    static let darkText = Color(hex: "E8E8E8")
    static let darkTextSecondary = Color(hex: "888888")
    static let darkTextMuted = Color(hex: "555555")
    static let darkBorder = Color(hex: "252525")
    static let darkRed = Color(hex: "FF4444")
}

// Environment-based colors
struct ThemeColors {
    let bg: Color
    let card: Color
    let input: Color
    let text: Color
    let textSecondary: Color
    let textMuted: Color
    let border: Color
    let red: Color
    let isDark: Bool

    static let light = ThemeColors(
        bg: AppTheme.lightBg, card: AppTheme.lightCard, input: AppTheme.lightInput,
        text: AppTheme.lightText, textSecondary: AppTheme.lightTextSecondary,
        textMuted: AppTheme.lightTextMuted, border: AppTheme.lightBorder,
        red: AppTheme.lightRed, isDark: false
    )

    static let dark = ThemeColors(
        bg: AppTheme.darkBg, card: AppTheme.darkCard, input: AppTheme.darkInput,
        text: AppTheme.darkText, textSecondary: AppTheme.darkTextSecondary,
        textMuted: AppTheme.darkTextMuted, border: AppTheme.darkBorder,
        red: AppTheme.darkRed, isDark: true
    )
}

// Color from hex string
extension Color {
    init(hex: String) {
        let scanner = Scanner(string: hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted))
        var hexNumber: UInt64 = 0
        scanner.scanHexInt64(&hexNumber)
        let r = Double((hexNumber & 0xFF0000) >> 16) / 255
        let g = Double((hexNumber & 0x00FF00) >> 8) / 255
        let b = Double(hexNumber & 0x0000FF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

// Environment key for theme
struct ThemeColorsKey: EnvironmentKey {
    static let defaultValue = ThemeColors.light
}

extension EnvironmentValues {
    var themeColors: ThemeColors {
        get { self[ThemeColorsKey.self] }
        set { self[ThemeColorsKey.self] = newValue }
    }
}

