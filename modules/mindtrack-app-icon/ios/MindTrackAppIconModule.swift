import ExpoModulesCore
import UIKit

public final class MindTrackAppIconModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MindTrackAppIcon")

    AsyncFunction("setIcon") { (iconId: String, promise: Promise) in
      let names: [String: String?] = [
        "zen-blue": nil,
        "midnight": "AppIcon-Midnight",
        "pure-light": "AppIcon-PureLight",
        "solar-sunset": "AppIcon-SolarSunset"
      ]

      guard names.keys.contains(iconId) else {
        promise.reject("INVALID_ICON", "Unknown icon: \(iconId)")
        return
      }

      DispatchQueue.main.async {
        guard UIApplication.shared.supportsAlternateIcons else {
          promise.reject("UNSUPPORTED", "Alternate icons are not supported on this device")
          return
        }
        UIApplication.shared.setAlternateIconName(names[iconId] ?? nil) { error in
          if let error { promise.reject("ICON_CHANGE_FAILED", error.localizedDescription) }
          else { promise.resolve(nil) }
        }
      }
    }
  }
}
