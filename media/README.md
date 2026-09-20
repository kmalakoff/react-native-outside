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

Routine local and primary CI checks install sibling integrations from the published versions recorded in `package-lock.json`; use `npm ci` to reproduce that integration. Optional native compatibility runs remain candidate-based and use a manifest with tarballs for all four cooperating libraries. `test/integration/native/package-candidates.ts` creates these from exact repository revisions for CI; local runs can use those artifacts or hash-verified local candidate packages. `prepare-fixture.ts` checks archive hashes and installed package resolution before running the fixture. Never substitute same-version registry packages for candidate artifacts in native compatibility runs.

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

`LEGACY_JAVA_HOME` is the installed Java 8 home selected for this run. Use a maintained Java 8 build: local validation used Temurin 8u504; 8u112 failed certificate validation while downloading Gradle. Keep Java 17 as the default for Maestro. The runner bundles JavaScript, builds and installs the app, then executes every Maestro assertion.

Register native host views with boundary refs. The shared portal fixture registers a `View` around its button because RN 0.59's `TouchableOpacity` ref exposes a component instance rather than the native view required for containment.

### iOS

Install full Xcode with an iOS simulator runtime, CocoaPods and Maestro. Xcode command-line tools alone do not contain `simctl` or the simulator SDK. Select and boot a simulator, then pass its UDID explicitly:

```sh
SIMULATOR_UDID=<booted-simulator-udid> node test/integration/native/run-platform.ts --platform ios --fixture .tmp/native/fixtures/local-ios-current
```

Run the minimum fixture separately after checking that its old native toolchain can build on the selected Mac. Android success does not establish iOS compatibility. Preserve build, install and interaction results separately, including the exact candidate identities and device/toolchain versions.

The RN 0.59.10 iOS probe requires explicit compiler compatibility on modern Xcode:

```sh
NODE_OPTIONS=--openssl-legacy-provider SIMULATOR_UDID=<booted-simulator-udid> node test/integration/native/run-platform.ts --platform ios --fixture .tmp/native/fixtures/local-ios-minimum --legacy-ios-xcode-compat
```

This opt-in verifies the RN source hash and corrects one Objective-C generic annotation in the disposable installation. It builds Release with an iOS 15 deployment target and legacy compiler warning settings. Release avoids RN 0.59's debug fishhook crash on modern iOS. The fixture uses a single scene and embeds its JavaScript bundle. All interaction assertions remain enabled. A passing result proves this patched-RN probe, not an unmodified RN 0.59 iOS installation or compatibility with historical iOS versions. The RN peer override remains exploratory.

## Run Android and iOS manually on GitHub Actions

Native CI is **manual only**. Pushes and pull requests run the Ubuntu/Windows package checks. A manual run also runs those checks and adds only the native profiles/platforms you select.

### GitHub website

1. Open [Actions → CI](https://github.com/kmalakoff/react-native-outside/actions/workflows/main.yml).
2. Choose **Run workflow**, then select `worktree-compatibility-matrix` under **Use workflow from**. These changes are on that branch; use `master` after they are merged.
3. Enable **run_native**.
4. Set **native_platform** to `android`, `ios`, or `both`.
5. Set **native_profile** using the table below, then click **Run workflow**.

| Profile | What runs |
| --- | --- |
| `current` | RN 0.87.1 / React 19.2.3 |
| `minimum` | Legacy RN 0.59.10 / React 16.8.3, with the compatibility setup described above |
| `all` | Both dependency profiles |

`minimum-android` is an older alias for legacy Android only. Prefer `minimum` plus `native_platform=android`.

### GitHub CLI

Authenticate with `gh auth login` and use an account with permission to run this repository's workflows. Run either command independently:

```sh
# Android, current React Native
gh workflow run main.yml --repo kmalakoff/react-native-outside --ref worktree-compatibility-matrix -f run_native=true -f native_profile=current -f native_platform=android

# iOS, current React Native
gh workflow run main.yml --repo kmalakoff/react-native-outside --ref worktree-compatibility-matrix -f run_native=true -f native_profile=current -f native_platform=ios

# Android and iOS, both current and legacy React Native
gh workflow run main.yml --repo kmalakoff/react-native-outside --ref worktree-compatibility-matrix -f run_native=true -f native_profile=all -f native_platform=both
```

After dispatch, find the run and follow it:

```sh
gh run list --repo kmalakoff/react-native-outside --workflow main.yml --branch worktree-compatibility-matrix --event workflow_dispatch --limit 5
gh run watch RUN_ID --repo kmalakoff/react-native-outside --exit-status
```

Replace `RUN_ID` with the ID from the list. The final native status must pass for every selected combination. Jobs for excluded platforms/profiles are skipped intentionally. Open a failed job's logs and download its diagnostic artifacts from the run page.

The workflow installs native tooling on GitHub's Android/Linux and iOS/macOS runners. Your local emulator or simulator does not need to be running. Legacy iOS automatically uses the explicit compiler-compatibility option; no manual RN patch is needed on the runner.

The same inputs are available in `react-native-event`, `react-native-contains`, and `react-ref-boundary`. Dispatch in the repository whose candidate you want to test: its commit is combined with the pinned cooperating packages and shared fixture.

For a coordinated run replacing all four packages, outside also accepts `native_candidate_manifest` with exact repository/SHA entries. Without that input, outside uses the tracked sibling baseline plus the selected branch's own candidate. Each run records package identities and archive hashes.

## What the completed matrix proves

Both profiles passed all 30 native assertions and 22 taps locally on Android and iOS. Current native testing uses the standard RN installation. Legacy iOS uses the documented compiler correction and modern test-app host so RN 0.59 can run with current Xcode. This is a test configuration, not a change to the packages' advertised support ranges. `react-native-outside` continues to declare RN >=0.82.1; installing it into the legacy test fixture deliberately overrides that declaration.

The manual CI entry points are implemented. The latest native changes were validated locally; no new hosted native run was requested. Earlier hosted results do not replace validation of a newly dispatched run.
