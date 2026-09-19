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

Outside integration must use the reviewed sibling candidates. The CI workflow checks out pinned sibling commits, builds tarballs, and installs those artifacts before validation. A same-version registry package may not contain those changes; ordinary npm ci alone does not prepare the coordinated candidate set. Preserve or reproduce the candidate installation steps from [.github/workflows/main.yml](../.github/workflows/main.yml) for local integration runs.\n\nNative projects live in test/native/current and test/native/minimum with shared assertions in test/native/shared. The reusable native pilot is explicitly selected through workflow_dispatch. Current RN 0.87.1 pairs with React 19.2.3. Minimum RN 0.59.10 pairs with React 16.8.3 and remains exploratory: the declared RN peer range rejects it. A forced installation or a web pass is not legacy native compatibility evidence.\n
