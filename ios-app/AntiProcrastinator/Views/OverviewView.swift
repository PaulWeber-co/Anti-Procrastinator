import SwiftUI

/// OverviewView — Oben (Swipe nach unten von ToDo)
/// Pixel-Design Uhr, Wetter, Planer (Uni/Schule/Bachelor/Master/Provadis)
struct OverviewView: View {
    @ObservedObject var viewModel: TodoViewModel
    @State private var currentTime = Date()
    @State private var weather: WeatherData? = StorageService.shared.getCachedWeather()
    @State private var planerMode: PlanerMode? = StorageService.shared.getPlanerMode()
    @State private var planerData: [PlanerPeriod] = StorageService.shared.getPlanerData()

    private let colors = ThemeColors.dark
    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Text("ÜBERSICHT")
                    .font(.system(.caption, design: .monospaced))
                    .fontWeight(.bold)
                    .foregroundColor(colors.textMuted)
                    .tracking(3)
                    .padding(.top, 60)

                // ══════════════════════════════════════
                // Pixel Clock — Dot-Matrix Stil
                // ══════════════════════════════════════
                VStack(spacing: 12) {
                    // Analog Pixel Clock
                    Canvas { context, size in
                        drawPixelClock(context: context, size: size, time: currentTime)
                    }
                    .frame(width: 140, height: 140)

                    // Digital Display
                    let formatter = DateFormatter()
                    Text({
                        formatter.dateFormat = "HH:mm:ss"
                        formatter.timeZone = TimeZone(identifier: "Europe/Berlin")
                        return formatter.string(from: currentTime)
                    }())
                    .font(.system(size: 28, design: .monospaced))
                    .fontWeight(.light)
                    .foregroundColor(colors.text)
                    .tracking(2)

                    Text({
                        formatter.locale = Locale(identifier: "de_DE")
                        formatter.dateFormat = "EEEE, dd. MMMM yyyy"
                        return formatter.string(from: currentTime).uppercased()
                    }())
                    .font(.system(size: 9, design: .monospaced))
                    .foregroundColor(colors.textMuted)
                    .tracking(1)
                }
                .padding(24)
                .frame(maxWidth: .infinity)
                .background(colors.card)
                .cornerRadius(20)
                .overlay(RoundedRectangle(cornerRadius: 20).stroke(colors.border, lineWidth: 1))
                .onReceive(timer) { _ in currentTime = Date() }

                // ══════════════════════════════════════
                // Weather
                // ══════════════════════════════════════
                if let w = weather {
                    HStack {
                        VStack(alignment: .leading) {
                            Text("\(w.temp)°")
                                .font(.system(size: 40, design: .monospaced))
                                .fontWeight(.light)
                                .foregroundColor(colors.text)
                            Text(w.desc)
                                .font(.system(size: 11, design: .monospaced))
                                .foregroundColor(colors.textMuted)
                        }
                        Spacer()
                        VStack(alignment: .trailing) {
                            Text(w.city)
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(colors.text)
                            if !w.dailyMax.isEmpty {
                                Text("H:\(w.dailyMax[0])° L:\(w.dailyMin[0])°")
                                    .font(.system(size: 10, design: .monospaced))
                                    .foregroundColor(colors.textMuted)
                            }
                        }
                    }
                    .padding(16)
                    .background(colors.card)
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(colors.border, lineWidth: 1))
                }

                // ══════════════════════════════════════
                // Planer
                // ══════════════════════════════════════
                if let mode = planerMode {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text(mode.label.uppercased())
                                .font(.system(size: 10, design: .monospaced))
                                .fontWeight(.bold)
                                .foregroundColor(colors.textMuted)
                                .tracking(2)
                            Spacer()
                            Button(action: {
                                StorageService.shared.setPlanerMode(nil)
                                StorageService.shared.savePlanerData([])
                                planerMode = nil
                                planerData = []
                            }) {
                                Text("⟳")
                                    .font(.system(size: 12, design: .monospaced))
                                    .foregroundColor(colors.textMuted)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 4)
                                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(colors.border, lineWidth: 1))
                            }
                        }

                        if planerData.isEmpty {
                            Text("Noch keine Daten")
                                .font(.system(size: 11, design: .monospaced))
                                .foregroundColor(colors.textMuted)
                        } else {
                            ForEach(planerData) { period in
                                Text("\(mode.periodLabel) \(period.period) — \(period.modules.count) \(mode.isSchule ? "Fächer" : "Module")")
                                    .font(.system(size: 11, design: .monospaced))
                                    .foregroundColor(colors.text)
                            }
                        }
                    }
                    .padding(16)
                    .background(colors.card)
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(colors.border, lineWidth: 1))
                } else {
                    // ── Planer Mode Select ──
                    VStack(spacing: 12) {
                        Text("PLANER")
                            .font(.system(size: 9, design: .monospaced))
                            .fontWeight(.bold)
                            .foregroundColor(colors.textMuted)
                            .tracking(3)

                        Text("Wähle deinen Planer")
                            .font(.system(size: 10, design: .monospaced))
                            .foregroundColor(colors.textMuted)
                            .tracking(2)

                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                            ForEach(PlanerMode.allCases, id: \.self) { mode in
                                Button(action: {
                                    StorageService.shared.setPlanerMode(mode)
                                    planerMode = mode
                                    HapticManager.shared.buttonPress()
                                }) {
                                    VStack(spacing: 8) {
                                        ZStack {
                                            RoundedRectangle(cornerRadius: 12)
                                                .stroke(colors.border, lineWidth: 1.5)
                                                .frame(width: 48, height: 48)
                                            Text(mode.icon)
                                                .font(.system(size: 12, design: .monospaced))
                                                .fontWeight(.bold)
                                                .foregroundColor(colors.text)
                                        }
                                        Text(mode.label.components(separatedBy: " ").first?.uppercased() ?? "")
                                            .font(.system(size: 11, design: .monospaced))
                                            .fontWeight(.bold)
                                            .foregroundColor(colors.text)
                                            .tracking(1)
                                        Text(mode.desc)
                                            .font(.system(size: 9))
                                            .foregroundColor(colors.textMuted)
                                            .multilineTextAlignment(.center)
                                    }
                                    .padding(20)
                                    .frame(maxWidth: .infinity)
                                    .background(colors.card)
                                    .cornerRadius(16)
                                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(colors.border, lineWidth: 1.5))
                                }
                            }
                        }
                    }
                }

                Spacer().frame(height: 40)
            }
            .padding(.horizontal, 20)
        }
        .background(colors.bg.ignoresSafeArea())
    }

    // ── Pixel Clock Drawing ──

    private func drawPixelClock(context: GraphicsContext, size: CGSize, time: Date) {
        let cx = size.width / 2
        let cy = size.height / 2
        let radius = size.width / 2 - 12

        // Dot grid background
        let dotStep: CGFloat = 8
        let dotSize: CGFloat = 2
        for gx in stride(from: CGFloat(0), to: size.width, by: dotStep) {
            for gy in stride(from: CGFloat(0), to: size.height, by: dotStep) {
                let dist = sqrt((gx - cx) * (gx - cx) + (gy - cy) * (gy - cy))
                if dist < radius + 4 {
                    let rect = CGRect(x: gx, y: gy, width: dotSize, height: dotSize)
                    context.fill(Path(rect), with: .color(colors.border.opacity(0.3)))
                }
            }
        }

        // Hour markers
        for i in 1...12 {
            let angle = Double(i * 30 - 90) * .pi / 180
            let nx = cx + CGFloat(cos(angle)) * (radius - 4)
            let ny = cy + CGFloat(sin(angle)) * (radius - 4)
            let dR: CGFloat = i % 3 == 0 ? 4 : 2.5
            let rect = CGRect(x: nx - dR/2, y: ny - dR/2, width: dR, height: dR)
            let markerColor = i % 3 == 0 ? colors.text : colors.textMuted
            context.fill(Path(rect), with: .color(markerColor))
        }

        // Time in Berlin
        let calendar = Calendar.current
        var comps = calendar.dateComponents(in: TimeZone(identifier: "Europe/Berlin")!, from: time)
        let h = comps.hour ?? 0
        let m = comps.minute ?? 0
        let s = comps.second ?? 0

        // Hour hand
        let hAngle = Double((h % 12) * 30 + m / 2 - 90) * .pi / 180
        drawDotHand(context: context, cx: cx, cy: cy, angle: hAngle, length: radius * 0.5, dotSize: 4, color: colors.text)

        // Minute hand
        let mAngle = Double(m * 6 + s / 10 - 90) * .pi / 180
        drawDotHand(context: context, cx: cx, cy: cy, angle: mAngle, length: radius * 0.72, dotSize: 3, color: colors.text)

        // Second hand
        let sAngle = Double(s * 6 - 90) * .pi / 180
        drawDotHand(context: context, cx: cx, cy: cy, angle: sAngle, length: radius * 0.8, dotSize: 2, color: colors.textMuted)

        // Center
        let centerRect = CGRect(x: cx - 3, y: cy - 3, width: 6, height: 6)
        context.fill(Path(centerRect), with: .color(colors.text))
    }

    private func drawDotHand(context: GraphicsContext, cx: CGFloat, cy: CGFloat, angle: Double, length: CGFloat, dotSize: CGFloat, color: Color) {
        let step = dotSize + 2
        let numDots = Int(length / step)
        for d in 1...numDots {
            let dist = CGFloat(d) * step
            let x = cx + CGFloat(cos(angle)) * dist
            let y = cy + CGFloat(sin(angle)) * dist
            let s = dotSize * (0.7 + 0.3 * CGFloat(d) / CGFloat(numDots))
            let rect = CGRect(x: x - s/2, y: y - s/2, width: s, height: s)
            context.fill(Path(rect), with: .color(color))
        }
    }
}

