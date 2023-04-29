import React

@objc(AssetsModule)
class AssetsModule: NSObject {
    @objc var bundleManager: RCTBundleManager!

    @objc
    static func requiresMainQueueSetup() -> Bool {
      return true
    }

    @objc
    func constantsToExport() -> [String: Any]! {
      let bundlePath = Bundle.main.bundlePath
      let scriptUrl = bundleManager.bundleURL.absoluteURL.deletingLastPathComponent()
      let jsonUrl = scriptUrl.appendingPathComponent("changed.json")
      
      
      if FileManager.default.fileExists(atPath: jsonUrl.path) {
        do {
            let data = try String(contentsOf: jsonUrl)
            return [
              "mainBundlePath": bundlePath,
              "changed": data
            ]
        } catch {
          return [
            "mainBundlePath": bundlePath,
            "changed": ""
          ]
        }
      }
      
      return [
        "mainBundlePath": bundlePath,
        "changed": ""
      ]
    }
}
