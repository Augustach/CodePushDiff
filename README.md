### Code Push Diff example
[Code push](https://github.com/microsoft/react-native-code-push) provides the way update your react-native application bypassing android/ios stores.

The documentation says:
> The CodePush client supports differential updates, so even though you are releasing your JS bundle and assets on every update, your end users will only actually download the files they need. The service handles this automatically so that you can focus on creating awesome apps and we can worry about optimizing end user downloads.

But it works only since your first codepush bundle. And Codepush loads whole bundle after every increasing of app version.

So this exapmle is to attempt to fix this problem to load only changes even for first bundle from the codepush server.

It consists from the four parts:

### #1
[codepush script](scripts/codepush.js) which builds bundles for two passed commits, calculates diff, deploys diff to the code push server, and crates `changed.json` file passed to js via native modules.

### #2
[android](android/app/src/main/java/com/codepushdiff/AssetsModule.kt) or [ios](ios/AssetsModule.swift) native modules which are only needed for passing  file with information about changed assets to js part.

### #3
[asset-resolver](src/assets-resolver.ts) implements the source transformer to determine where image should be loaded from (code push bundle or native assets).
It uses undocemented react-native's api (https://github.com/facebook/react-native/blob/main/packages/react-native/Libraries/Image/resolveAssetSource.js#L77). **Thanks to this api you don't need to patch Image component somehow!** Also this api is used in [expo-asset](https://github.com/expo/expo/blob/sdk-48/packages/expo-asset/src/Asset.fx.ts#L7) in similar way.

### #4
Finally it is needed to import `asset-resolver` into your root file to [override](/App.tsx) resource transformer.

You can check full commit with all needed changes: https://github.com/Augustach/CodePushDiff/commit/ce17c697e096c7b0d559b85e3c0eb5dd8b7cbfbb


## Example of usage
So you made some commits and now you want to release you changes.
You just need to run `yarn codepush -p android -a i.kuchaev/AwesomeProject -b tags/v1.0`. It will build bundle and deploy it to the codepush server.

where:
- `-p` is `android` or `ios` platforms
- `-a` is your aplication name in codepush
- `-b` is base commit for which you want to calculate diff (it can be you previos release branch or tag)
