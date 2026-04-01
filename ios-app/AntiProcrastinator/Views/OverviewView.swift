import SwiftUI

/// OverviewView — Oben (Swipe nach unten von ToDo)
/// Pixel-Design Uhr, Wetter und erweiterter Planer
struct OverviewView: View {
    @ObservedObject var viewModel: TodoViewModel
    @State private var currentTime = Date()
    @State private var weather: WeatherData? = StorageService.shared.getCachedWeather()
    @State private var planerMode: PlanerMode? = StorageService.shared.getPlanerMode()
    @State private var planerData: [PlanerPeriod] = []
    @State private var selectedPeriod: Int = 1
    @State private var newModuleName = ""

    private let colors = ThemeColors.dark
    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Text("UBERSICHT")
                    .font(.system(.caption, design: .monospaced))
                    .fontWeight(.bold)
                    .foregroundColor(colors.textMuted)
                    .tracking(3)
                    .padding(.top, 60)

                clockCard
                weatherCard
                plannerCard

                Spacer().frame(height: 40)
            }
            .padding(.horizontal, 20)
        }
        .background(colors.bg.ignoresSafeArea())
        .onAppear {
            let mode = planerMode ?? .schule
            planerMode = mode
            selectedPeriod = mode.periodRange.lowerBound
            loadPlanner(for: mode)
        }
    }

    private var clockCard: some View {
        VStack(spacing: 12) {
            Canvas { context, size in
                drawPixelClock(context: context, size: size, time: currentTime)
            }
            .frame(width: 140, height: 140)

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
    }

    @ViewBuilder
    private var weatherCard: some View {
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
    }

    private var plannerCard: some View {
        let mode = planerMode ?? .schule
        return VStack(alignment: .leading, spacing: 12) {
            Text("PLANER")
                .font(.system(size: 9, design: .monospaced))
                .fontWeight(.bold)
                .foregroundColor(colors.textMuted)
                .tracking(3)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(PlanerMode.allCases, id: \.self) { m in
                        let active = m == mode
                        Button(action: {
                            activateMode(m)
                        }) {
                            Text(m.label)
                                .font(.system(size: 10, design: .monospaced))
                                .fontWeight(.bold)
                                .foregroundColor(active ? colors.bg : colors.textMuted)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(active ? colors.text : colors.input)
                                .cornerRadius(14)
                        }
                    }
                }
            }

            HStack {
                Text("\(mode.periodLabel):")
                    .font(.system(size: 10, design: .monospaced))
                    .foregroundColor(colors.textMuted)
                Picker(mode.periodLabel, selection: $selectedPeriod) {
                    ForEach(Array(mode.periodRange), id: \.self) { period in
                        Text("\(period)").tag(period)
                    }
                }
                .pickerStyle(.menu)
                .onChange(of: selectedPeriod) { value in
                    ensurePeriodExists(value, for: mode)
                }
                Spacer()
                Text("SCHNITT \(averageText(for: mode))")
                    .font(.system(size: 10, design: .monospaced))
                    .fontWeight(.bold)
                    .foregroundColor(colors.text)
            }

            if let periodIdx = indexForPeriod(selectedPeriod) {
                ForEach(planerData[periodIdx].modules.indices, id: \.self) { moduleIdx in
                    HStack(spacing: 10) {
                        TextField(mode.isSchule ? "Fach" : "Modul", text: bindingForModuleName(periodIdx, moduleIdx, mode))
                            .font(.system(size: 12, design: .monospaced))
                            .foregroundColor(colors.text)

                        HStack(spacing: 6) {
                            Button(action: { changeGrade(periodIdx: periodIdx, moduleIdx: moduleIdx, delta: -0.1, mode: mode) }) {
                                Text("-")
                                    .font(.system(size: 14, design: .monospaced))
                                    .frame(width: 28, height: 28)
                                    .foregroundColor(colors.textMuted)
                            }
                            Text(gradeLabel(periodIdx: periodIdx, moduleIdx: moduleIdx))
                                .font(.system(size: 11, design: .monospaced))
                                .foregroundColor(colors.text)
                                .frame(width: 38)
                            Button(action: { changeGrade(periodIdx: periodIdx, moduleIdx: moduleIdx, delta: 0.1, mode: mode) }) {
                                Text("+")
                                    .font(.system(size: 14, design: .monospaced))
                                    .frame(width: 28, height: 28)
                                    .foregroundColor(colors.textMuted)
                            }
                        }

                        Button(action: { deleteModule(moduleIdx, in: periodIdx, for: mode) }) {
                            Text("X")
                                .font(.system(size: 10, design: .monospaced))
                                .foregroundColor(colors.textMuted)
                                .frame(width: 28, height: 28)
                        }
                    }
                    .padding(10)
                    .background(colors.input)
                    .cornerRadius(10)
                }
            }

            HStack(spacing: 8) {
                TextField(mode.isSchule ? "Neues Fach" : "Neues Modul", text: $newModuleName)
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundColor(colors.text)
                Button(action: { addModule(for: mode) }) {
                    Text("+ HINZUFUGEN")
                        .font(.system(size: 9, design: .monospaced))
                        .fontWeight(.bold)
                        .foregroundColor(colors.textMuted)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(colors.border, lineWidth: 1))
                }
            }
        }
        .padding(16)
        .background(colors.card)
        .cornerRadius(16)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(colors.border, lineWidth: 1))
    }

    private func loadPlanner(for mode: PlanerMode) {
        planerData = StorageService.shared.getPlanerData(for: mode)
        ensurePeriodExists(selectedPeriod, for: mode)
    }

    private func ensurePeriodExists(_ period: Int, for mode: PlanerMode) {
        guard indexForPeriod(period) == nil else { return }
        planerData.append(PlanerPeriod(period: period, modules: mode.defaultModules(for: period)))
        planerData.sort { $0.period < $1.period }
        StorageService.shared.savePlanerData(planerData, for: mode)
    }

    private func indexForPeriod(_ period: Int) -> Int? {
        planerData.firstIndex(where: { $0.period == period })
    }

    private func addModule(for mode: PlanerMode) {
        let name = newModuleName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty, let periodIdx = indexForPeriod(selectedPeriod) else { return }
        let module = PlanerModule(name: name, points: mode.isSchule ? 0 : 5, noten: mode.isSchule ? SchulNoten() : nil, status: .offen)
        planerData[periodIdx].modules.append(module)
        StorageService.shared.savePlanerData(planerData, for: mode)
        newModuleName = ""
    }

    private func deleteModule(_ moduleIndex: Int, in periodIndex: Int, for mode: PlanerMode) {
        guard planerData.indices.contains(periodIndex), planerData[periodIndex].modules.indices.contains(moduleIndex) else { return }
        planerData[periodIndex].modules.remove(at: moduleIndex)
        StorageService.shared.savePlanerData(planerData, for: mode)
    }

    private func bindingForModuleName(_ periodIndex: Int, _ moduleIndex: Int, _ mode: PlanerMode) -> Binding<String> {
        Binding(
            get: {
                guard planerData.indices.contains(periodIndex), planerData[periodIndex].modules.indices.contains(moduleIndex) else { return "" }
                return planerData[periodIndex].modules[moduleIndex].name
            },
            set: { newValue in
                guard planerData.indices.contains(periodIndex),
                      planerData[periodIndex].modules.indices.contains(moduleIndex) else { return }
                planerData[periodIndex].modules[moduleIndex].name = newValue
                StorageService.shared.savePlanerData(planerData, for: mode)
            }
        )
    }

    private func gradeLabel(periodIdx: Int, moduleIdx: Int) -> String {
        guard planerData.indices.contains(periodIdx), planerData[periodIdx].modules.indices.contains(moduleIdx) else { return "-" }
        guard let grade = planerData[periodIdx].modules[moduleIdx].grade else { return "-" }
        return String(format: "%.1f", grade)
    }

    private func changeGrade(periodIdx: Int, moduleIdx: Int, delta: Double, mode: PlanerMode) {
        guard planerData.indices.contains(periodIdx), planerData[periodIdx].modules.indices.contains(moduleIdx) else { return }
        let current = planerData[periodIdx].modules[moduleIdx].grade ?? 3.0
        let changed = min(6.0, max(1.0, current + delta))
        planerData[periodIdx].modules[moduleIdx].grade = (changed * 10).rounded() / 10
        StorageService.shared.savePlanerData(planerData, for: mode)
    }

    private func averageText(for mode: PlanerMode) -> String {
        guard let idx = indexForPeriod(selectedPeriod) else { return "-" }
        let grades = planerData[idx].modules.compactMap { $0.grade }
        guard !grades.isEmpty else { return "-" }
        let avg = grades.reduce(0, +) / Double(grades.count)
        return String(format: "%.2f", avg)
    }

    private func activateMode(_ mode: PlanerMode) {
        planerMode = mode
        StorageService.shared.setPlanerMode(mode)
        selectedPeriod = mode.periodRange.lowerBound
        loadPlanner(for: mode)
        newModuleName = ""
        HapticManager.shared.buttonPress()
    }

    private func drawPixelClock(context: GraphicsContext, size: CGSize, time: Date) {
        let cx = size.width / 2
        let cy = size.height / 2
        let radius = size.width / 2 - 12

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

        for i in 1...12 {
            let angle = Double(i * 30 - 90) * .pi / 180
            let nx = cx + CGFloat(cos(angle)) * (radius - 4)
            let ny = cy + CGFloat(sin(angle)) * (radius - 4)
            let dR: CGFloat = i % 3 == 0 ? 4 : 2.5
            let rect = CGRect(x: nx - dR / 2, y: ny - dR / 2, width: dR, height: dR)
            let markerColor = i % 3 == 0 ? colors.text : colors.textMuted
            context.fill(Path(rect), with: .color(markerColor))
        }

        let calendar = Calendar.current
        let comps = calendar.dateComponents(in: TimeZone(identifier: "Europe/Berlin")!, from: time)
        let h = comps.hour ?? 0
        let m = comps.minute ?? 0
        let s = comps.second ?? 0

        let hAngle = Double((h % 12) * 30 + m / 2 - 90) * .pi / 180
        drawDotHand(context: context, cx: cx, cy: cy, angle: hAngle, length: radius * 0.5, dotSize: 4, color: colors.text)

        let mAngle = Double(m * 6 + s / 10 - 90) * .pi / 180
        drawDotHand(context: context, cx: cx, cy: cy, angle: mAngle, length: radius * 0.72, dotSize: 3, color: colors.text)

        let sAngle = Double(s * 6 - 90) * .pi / 180
        drawDotHand(context: context, cx: cx, cy: cy, angle: sAngle, length: radius * 0.8, dotSize: 2, color: colors.textMuted)

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
            let rect = CGRect(x: x - s / 2, y: y - s / 2, width: s, height: s)
            context.fill(Path(rect), with: .color(color))
        }
    }
}




