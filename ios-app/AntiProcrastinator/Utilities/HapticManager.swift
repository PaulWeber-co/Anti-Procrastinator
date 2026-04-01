import UIKit

/// HapticManager — Kreatives haptisches Feedback mit Apple Taptic Engine
/// Je mehr To-Dos pro Tag abgehakt werden, desto stärker und kreativer die Vibration.
///
/// Stufe 1 (1-2 Tasks):   Leichtes Tick — UIImpactFeedbackGenerator(.light)
/// Stufe 2 (3-5 Tasks):   Mittlerer Impact — UIImpactFeedbackGenerator(.medium)
/// Stufe 3 (6-9 Tasks):   Schwerer Impact + Erfolgs-Notification
/// Stufe 4 (10+ Tasks):   Custom Triple-Tap Pattern — Belohnungs-Gefühl!

class HapticManager {
    static let shared = HapticManager()

    private let lightImpact = UIImpactFeedbackGenerator(style: .light)
    private let mediumImpact = UIImpactFeedbackGenerator(style: .medium)
    private let heavyImpact = UIImpactFeedbackGenerator(style: .heavy)
    private let rigidImpact = UIImpactFeedbackGenerator(style: .rigid)
    private let softImpact = UIImpactFeedbackGenerator(style: .soft)
    private let notification = UINotificationFeedbackGenerator()
    private let selection = UISelectionFeedbackGenerator()

    private init() {
        // Pre-prepare generators for faster response
        lightImpact.prepare()
        mediumImpact.prepare()
        heavyImpact.prepare()
    }

    /// Hauptmethode: Wird aufgerufen wenn ein ToDo abgehakt wird.
    /// todayCount = Anzahl der heute bereits abgehakten ToDos
    func todoChecked(todayCount: Int) {
        switch todayCount {
        case 0...2:
            lightTick()
        case 3...5:
            mediumTap()
        case 6...9:
            heavySuccess()
        default:
            celebrationBurst()
        }
    }

    // ── Stufe 1: Leichtes Tick ──
    private func lightTick() {
        selection.selectionChanged()
    }

    // ── Stufe 2: Mittlerer Tap ──
    private func mediumTap() {
        mediumImpact.impactOccurred(intensity: 0.7)
    }

    // ── Stufe 3: Schwerer Impact + Erfolgs-Notification ──
    private func heavySuccess() {
        heavyImpact.impactOccurred(intensity: 1.0)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            self.notification.notificationOccurred(.success)
        }
    }

    // ── Stufe 4: Celebration Triple-Burst ──
    // Kreatives Pattern mit der Taptic Engine:
    // Schnelles Rigid-Soft-Rigid Pattern das sich wie "Applaus" anfühlt
    private func celebrationBurst() {
        // Burst 1: Rigid
        rigidImpact.impactOccurred(intensity: 0.8)

        // Burst 2: Heavy (nach kurzer Pause)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) {
            self.heavyImpact.impactOccurred(intensity: 1.0)
        }

        // Burst 3: Soft "Nachklingen"
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
            self.softImpact.impactOccurred(intensity: 0.5)
        }

        // Burst 4: Finaler Success
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            self.notification.notificationOccurred(.success)
        }
    }

    // ── Utility Haptics ──

    func swipeFeedback() {
        softImpact.impactOccurred(intensity: 0.3)
    }

    func buttonPress() {
        lightImpact.impactOccurred(intensity: 0.5)
    }

    func error() {
        notification.notificationOccurred(.error)
    }

    func warning() {
        notification.notificationOccurred(.warning)
    }
}

