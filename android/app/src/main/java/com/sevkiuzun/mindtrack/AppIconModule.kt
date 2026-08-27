package com.sevkiuzun.mindtrack

import android.content.ComponentName
import android.content.pm.PackageManager
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AppIconModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "MindTrackAppIcon"

  private val aliases = mapOf(
    "zen-blue" to "IconZenBlue",
    "midnight" to "IconMidnight",
    "pure-light" to "IconPureLight",
    "solar-sunset" to "IconSolarSunset"
  )

  @ReactMethod
  fun setIcon(iconId: String, promise: Promise) {
    val selectedAlias = aliases[iconId]
    if (selectedAlias == null) {
      promise.reject("INVALID_ICON", "Unknown icon: $iconId")
      return
    }
    try {
      val packageManager = context.packageManager
      val packageName = context.packageName
      packageManager.setComponentEnabledSetting(
        ComponentName(packageName, "$packageName.$selectedAlias"),
        PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
        PackageManager.DONT_KILL_APP
      )
      promise.resolve(null)
      Handler(Looper.getMainLooper()).postDelayed({
        aliases.values.filter { it != selectedAlias }.forEach { alias ->
          packageManager.setComponentEnabledSetting(
            ComponentName(packageName, "$packageName.$alias"),
            PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
            PackageManager.DONT_KILL_APP
          )
        }
      }, 300)
    } catch (error: Exception) {
      promise.reject("ICON_CHANGE_FAILED", error)
    }
  }
}
