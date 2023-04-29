import {
  Image,
  ImageResolvedAssetSource,
  NativeModules,
  Platform,
} from 'react-native';

const {AssetsModule} = NativeModules;
let changed: string[] | null = null;
let changedJson: string | null = __DEV__ ? null : AssetsModule?.changed ?? null;
const mainBundlePath: string | null = __DEV__
  ? null
  : AssetsModule?.mainBundlePath ?? null;

if (changedJson) {
  try {
    changed = JSON.parse(changedJson);
  } catch (error) {
    changed = null;
  }
}

// See https://github.com/facebook/react-native/blob/v0.71.7/Libraries/Image/AssetSourceResolver.js#L53
interface AssetSourceResolver {
  defaultAsset(): ImageResolvedAssetSource;
  resourceIdentifierWithoutScale(): ImageResolvedAssetSource;
  scaledAssetPath(): ImageResolvedAssetSource;
}

function isChanged(changedUris: string[], uri: string): boolean {
  return changedUris.some(changedUri => uri.endsWith(changedUri));
}

const codePushTransformer =
  (uris: string[]) =>
  (resolver: AssetSourceResolver): ImageResolvedAssetSource => {
    const asset = resolver.defaultAsset();

    if (isChanged(uris, asset.uri)) {
      return asset;
    }

    if (Platform.OS === 'android') {
      return resolver.resourceIdentifierWithoutScale();
    }

    if (Platform.OS === 'ios') {
      // Resolves to just the scaled asset filename
      // E.g. 'assets/AwesomeModule/icon@2x.png'
      const iosAsset = resolver.scaledAssetPath();
      return {
        ...iosAsset,
        uri: `${mainBundlePath}/${iosAsset.uri}`,
      };
    }

    return asset;
  };

const setCustomSourceTransformer =
  // @ts-expect-error
  Image.resolveAssetSource.setCustomSourceTransformer;

if (__DEV__ && typeof setCustomSourceTransformer !== 'function') {
  throw new Error('There is not setCustomSourceTransformer frunction');
}

if (changed) {
  setCustomSourceTransformer(codePushTransformer(changed));
}
