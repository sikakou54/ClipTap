import Expo
import FirebaseCore
import FirebaseCore
import React
import ReactAppDependencyProvider

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
// @generated begin @react-native-firebase/app-didFinishLaunchingWithOptions - expo prebuild (DO NOT MODIFY) sync-10e8520570672fd76b2403b7e1e27f5198a6349a
FirebaseApp.configure()
// @generated end @react-native-firebase/app-didFinishLaunchingWithOptions
// @generated begin @react-native-firebase/app-didFinishLaunchingWithOptions - expo prebuild (DO NOT MODIFY) sync-10e8520570672fd76b2403b7e1e27f5198a6349a
FirebaseApp.configure()
// @generated end @react-native-firebase/app-didFinishLaunchingWithOptions
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    // NotificationCenter経由でApp Groupへの保存通知を受け取る
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleSubscriptionUpdate),
      name: NSNotification.Name("SubscriptionStatusUpdated"),
      object: nil
    )

    // 注意：自動テストデータ書き込みは削除しました
    // 開発者メニューから手動で期限内/期限切れを切り替えてください

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  @objc private func handleSubscriptionUpdate(_ notification: Notification) {
    NSLog("[AppDelegate] 🔵 Received subscription notification")

    guard let userInfo = notification.userInfo,
          let isPremium = userInfo["isPremium"] as? Bool else {
      NSLog("[AppDelegate] ⚠️ Invalid subscription notification")
      return
    }

    let expiryDateString = userInfo["expiryDate"] as? String

    // App Groupに保存
    if let defaults = UserDefaults(suiteName: "group.com.sikakou.cliptap") {
      defaults.set(isPremium, forKey: "is_premium_subscriber")
      defaults.set(expiryDateString, forKey: "subscription_expiry_date")
      defaults.set(Date().timeIntervalSince1970, forKey: "subscription_last_updated")
      defaults.synchronize()

      NSLog("[AppDelegate] ✅ Saved subscription to App Group: isPremium=\(isPremium), expiryDate=\(expiryDateString ?? "nil")")
    } else {
      NSLog("[AppDelegate] ❌ Failed to access App Group")
    }
  }


  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
// @generated begin @react-native-firebase/auth-openURL - expo prebuild (DO NOT MODIFY)
    if url.host?.lowercased() == "firebaseauth" {
      // invocations for Firebase Auth are handled elsewhere and should not be forwarded to Expo Router
      return false
    }
// @generated end @react-native-firebase/auth-openURL
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
