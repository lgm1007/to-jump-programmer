This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Project notes (To Jump Programmer)

- Learning content: the full set lives in a **private** repo (`../to-jump-content`, override with `TJ_CONTENT_DIR`); this public repo only ships `src/content/sample/`. `npm run content:sync` copies full content (or the sample when the private repo is absent) into `src/content/data/` (gitignored, but uploaded to EAS via `.easignore`; keep `.easignore` in sync with `.gitignore`). Never commit full content to this repo. Schema: `src/content/types.ts`, writing rules: `docs/CONTENT_GUIDE.md`. After editing content run `npm run content:sync && npm run validate` (problems: all 5 reference solutions are executed against every test; Spring's Kotlin review code lives in `review/spring-kotlin.ts` variants keyed by pattern/challenge id); refresh the sample with `npm run content:sample`.
- `production` EAS builds fail unless `src/content/data` holds the full content (`eas-build-post-install` → `content-sync.mjs --eas`).
- Code execution: `src/features/runner/` — Python/JS run on-device in a module Web Worker (hidden WebView on native, browser on web; worker/manager code are plain-JS strings so they survive Hermes). Java/Kotlin/C++ go to a Piston-compatible server (`infra/runner`, dev: `node scripts/dev-runner.mjs`). Production Piston runs Kotlin 1.8.20 on JDK 8 — keep Kotlin harness code and reference solutions within that (validate with `KOTLINC`/`KOTLIN_JAVA_HOME` pointing at that toolchain). Harness generators in `runner/core` are shared with the Node validator — keep them free of React Native imports.
- The code editor is CodeMirror 6 bundled into `src/features/editor/editor-html.generated.ts`; edit `editor/src/main.ts` then run `npm run build:editor`.
- Ads: Google AdMob via `react-native-google-mobile-ads` in `src/features/ads/` (`index.tsx` native, `index.web.tsx` no-op). The library is `require`d lazily so Expo Go (no native module) still runs without ads — never import `react-native-google-mobile-ads` outside `ads/google.tsx`. AdMob IDs come from `ADMOB_*` env vars read in `app.config.ts` (test IDs when unset; `__DEV__` always uses test units). Interstitial frequency: `INTERSTITIAL_POLICY` in `ads/config.ts`.
- `plugins/with-ios-scene-lifecycle.js` adds the UIScene life cycle (SceneDelegate → `ExpoAppSceneDelegate`) that the iOS 27 SDK requires; the SDK 57 template lacks it. It no-ops once the template already has it (SDK 58+), so remove it after upgrading.
- On iOS the native `SafeAreaView` reports zero insets on the first `fullScreenModal` presentation after launch (quiz/cards overlapped the status bar). Full-screen modals and `Footer` use `InsetView` (`components/ui/screen.tsx`, insets from the root provider) — don't switch them back to `SafeAreaView`.
- Local iOS builds fail with a codesign "detritus" error while the project sits in an iCloud-synced folder (`~/Documents`, `~/Desktop`); build from a non-synced copy/location.
- Before finishing: `npm run typecheck`, `npm run lint`, `npm test`.
