package expo.modules.cuevibration

import android.content.Context
import android.os.Build
import android.os.VibrationAttributes
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * A timer cue vibration. Android files an untagged vibration under the "touch feedback"
 * setting, which many people switch off, so this one is tagged as an alarm: it follows the
 * alarm vibration setting instead and still fires with touch feedback off.
 */
class CueVibrationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("CueVibration")

    Function("vibrate") { milliseconds: Int ->
      val context = appContext.reactContext ?: return@Function
      val vibrator: Vibrator =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          val manager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
          manager.defaultVibrator
        } else {
          @Suppress("DEPRECATION")
          context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
      if (!vibrator.hasVibrator()) return@Function
      val effect = VibrationEffect.createOneShot(milliseconds.toLong(), VibrationEffect.DEFAULT_AMPLITUDE)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        vibrator.vibrate(effect, VibrationAttributes.createForUsage(VibrationAttributes.USAGE_ALARM))
      } else {
        vibrator.vibrate(effect)
      }
    }
  }
}
