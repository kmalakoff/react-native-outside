# Native outside fixture

The fixture uses React Native 0.87.1, React 19.2.3, Fabric, and
react-native-test-app 5.4.9. Maestro 2.7.0 drives real taps through Active,
ActiveBoundary, registered portals, and unrelated content.

From the repository root, build the package:

```sh
npm ci
npm run build
cd examples/native-test-app
npm ci
npm run validate
```

The local package is copied during fixture installation. Re-run `npm ci` in
this directory after rebuilding the root package.

For iOS, from the fixture directory:

```sh
npm run build:ios
pod install --project-directory=ios
npm run ios -- --no-packager --udid <simulator-udid>
maestro --device <simulator-udid> test ../../test/integration/maestro/native-outside.yaml
```

For Android, start an API 35 emulator, then run from the fixture directory:

```sh
npm run build:android
bash ../../test/integration/run-android.sh
```

The Android script builds and installs the app, runs Maestro, and captures
adb diagnostics before the emulator exits. Both platforms require their
native SDKs and Maestro on PATH.

## Testing unpublished sibling changes

CI builds the exact sibling commits recorded in `.github/workflows/main.yml`,
then installs their tarballs into both the root and fixture without changing
the lockfiles. This avoids testing older published event, containment, or
boundary implementations. To reproduce that setup locally, pack each
reviewed sibling with `npm pack --ignore-scripts` after building it, then
install all three tarballs together in both directories with:

```sh
npm install --ignore-scripts --no-save --package-lock=false <contains.tgz> <event.tgz> <boundary.tgz>
```

Install root candidates before its build, and fixture candidates after its
`npm ci`, before validation and bundling. One copy of each context-bearing
package must resolve from the fixture.
