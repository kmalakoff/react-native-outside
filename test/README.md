# Compatibility tests

Use Node 26 for development tooling. Each browser profile installs its own lockfile with npm ci and uses one current Chromium through WTR. The profiles vary React dependencies, not browser versions.

| Command | Coverage |
| --- | --- |
| `npm test` | Isolated consumer types, minimum/current browser assertions, then Node helper/export checks |
| `npm run test:engines` | Already-built package smoke checks on exact Node 16.0.0; no DOM or renderer on old Node |
| `npm run test:browser:checkpoints` | Optional React/ReactDOM 17.0.2 and 18.3.1 checks for compatibility-sensitive changes or releases |

Routine browser endpoints pin React and ReactDOM together at 16.8.0 and 19.3.0. React Native Web is pinned to 0.13.18 for minimum/React 17 and 0.21.2 for current/React 18. These are web tests, not native device tests. All profiles use the same behavioral assertions. React 16/17 use legacy mounting; React 18/19 use createRoot. Local bundled bridges keep one React instance and avoid CDN conversion.

The React 16.8 profile supports synchronous `act` callbacks only, and the current tests use synchronous callbacks. Async callbacks require a React version with async `act` support and are not covered by this matrix.

The Node 16 check verifies native export resolution only; it does not execute React Native. Consumer declaration limitations and the explicit RN declaration condition are documented in [types/README.md](types/README.md).

Outside integration must use the reviewed sibling candidates. The CI workflow checks out pinned sibling commits, builds tarballs, and installs those artifacts before validation. A same-version registry package may not contain those changes; ordinary npm ci alone does not prepare the coordinated candidate set. Preserve or reproduce the candidate installation steps from [.github/workflows/main.yml](../.github/workflows/main.yml) for local integration runs.

## Local native testing

Native projects live in `test/native/current` and `test/native/minimum`, with shared assertions in `test/native/shared`. Run Android and iOS locally first. Current RN 0.87.1 pairs with React 19.2.3. Minimum RN 0.59.10 pairs with React 16.8.3 and remains exploratory because the declared RN peer range rejects it. A forced installation or a Metro bundle pass does not establish native compatibility.

Use a manifest and candidate tarballs for all four cooperating libraries. `test/integration/native/package-candidates.ts` creates these from exact repository revisions for CI; local runs can reuse those artifacts or hash-verified local candidate packages. `prepare-fixture.ts` checks archive hashes and installed package resolution before running the fixture. Never substitute same-version registry packages for candidate artifacts.

Prepare each platform in its own disposable directory. Run this from the package root, replacing the manifest and package directory with the candidate artifacts being tested:

```sh
node test/integration/native/prepare-fixture.ts --profile current --fixture .tmp/native/fixtures/local-android-current --manifest .tmp/native/candidate-manifest.json --packages .tmp/native/packages
node test/integration/native/prepare-fixture.ts --profile current --fixture .tmp/native/fixtures/local-ios-current --manifest .tmp/native/candidate-manifest.json --packages .tmp/native/packages
```

Fixture destinations must be direct children of `.tmp/native/fixtures`. Preparation replaces only the selected fixture. Keep Android and iOS builds sequential on the same Mac.

### Android

Install the Android SDK, platform tools, required build tools and an emulator image appropriate to the Mac's architecture. Make `adb`, Java and `maestro` available on PATH. Start one emulator, or set `ANDROID_SERIAL` to select an online device. The runner confirms the device identity and uses the same device for installation and Maestro:

```sh
node test/integration/native/run-platform.ts --platform android --fixture .tmp/native/fixtures/local-android-current
```

For the legacy fixture, prepare `--profile minimum` in `.tmp/native/fixtures/local-android-minimum`. Use Java 17 for Maestro and provide Java 8 for Gradle 5.4.1:

```sh
NODE_OPTIONS=--openssl-legacy-provider node test/integration/native/run-platform.ts --platform android --fixture .tmp/native/fixtures/local-android-minimum --android-gradle-java-home "$LEGACY_JAVA_HOME"
```

`LEGACY_JAVA_HOME` is the installed Java 8 home selected for this run. The runner bundles JavaScript, builds and installs the app, then executes every Maestro assertion.

### iOS

Install full Xcode with an iOS simulator runtime, CocoaPods and Maestro. Xcode command-line tools alone do not contain `simctl` or the simulator SDK. Select and boot a simulator, then pass its UDID explicitly:

```sh
SIMULATOR_UDID=<booted-simulator-udid> node test/integration/native/run-platform.ts --platform ios --fixture .tmp/native/fixtures/local-ios-current
```

Run the minimum fixture separately after checking that its old native toolchain can build on the selected Mac. Android success does not establish iOS compatibility. Preserve build, install and interaction results separately, including the exact candidate identities and device/toolchain versions.

## Optional native CI

Pushes and pull requests run package checks on Ubuntu and Windows. Native jobs run only when explicitly selected in a manual **CI** workflow dispatch. In GitHub Actions, choose **Run workflow**, enable `run_native`, then select `native_profile` and `native_platform`. Native testing is not a routine required check.

The CLI equivalent for the current Android fixture is:

```sh
gh workflow run main.yml --repo kmalakoff/react-native-outside --ref <candidate-branch> -f run_native=true -f native_profile=current -f native_platform=android
```

Use `ios` or `both` for the platform, and `minimum` or `all` for exploratory legacy coverage. The older `minimum-android` profile selects only legacy Android and rejects an `ios` platform selection. Minimum results remain exploratory until the peer contract and native behavior are both qualified.

A canonical outside dispatch may also supply `native_candidate_manifest` with exact repository/SHA entries for all four packages. Without that input, the workflow uses the tracked sibling baseline plus the selected branch's outside candidate. Each run records packaged artifact identities and reports requested cells separately from excluded cells. An excluded platform is not a passing result.
