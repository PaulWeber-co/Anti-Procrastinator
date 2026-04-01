package com.antiprocrastinator.app.ui.components

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext

/**
 * HapticManager — Haptisches Feedback beim Abhaken von To-Dos.
 * Je mehr To-Dos pro Tag abgehakt werden, desto stärker die Vibration.
 *
 * Stufe 1 (1-2 Tasks):   Leichtes Tick
 * Stufe 2 (3-5 Tasks):   Mittleres Feedback
 * Stufe 3 (6-9 Tasks):   Starkes Feedback
 * Stufe 4 (10+ Tasks):   Doppel-Burst – Belohnungsgefühl!
 */
class HapticManager(private val context: Context) {

    private val vibrator: Vibrator by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val manager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            manager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }

    fun todoChecked(todayCount: Int) {
        if (!vibrator.hasVibrator()) return

        when {
            todayCount <= 2 -> lightTick()
            todayCount <= 5 -> mediumImpact()
            todayCount <= 9 -> heavyImpact()
            else -> celebrationBurst()
        }
    }

    private fun lightTick() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            vibrator.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_TICK))
        } else {
            vibrator.vibrate(VibrationEffect.createOneShot(30, 40))
        }
    }

    private fun mediumImpact() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            vibrator.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK))
        } else {
            vibrator.vibrate(VibrationEffect.createOneShot(50, 120))
        }
    }

    private fun heavyImpact() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            vibrator.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_HEAVY_CLICK))
        } else {
            vibrator.vibrate(VibrationEffect.createOneShot(80, 200))
        }
    }

    private fun celebrationBurst() {
        // Doppel-Burst Pattern: vibrate-pause-vibrate-pause-vibrate
        val timings = longArrayOf(0, 60, 60, 80, 60, 120)
        val amplitudes = intArrayOf(0, 180, 0, 220, 0, 255)
        vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
    }
}

@Composable
fun rememberHapticManager(): HapticManager {
    val context = LocalContext.current
    return remember { HapticManager(context) }
}

