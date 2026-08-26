# MindTrack 1.0.0 — Production Release Candidate

Offline-first React Native / Expo application for daily memory, cognitive-development
and focus/prayer routine tracking.

## Stack
- Expo SDK 57
- React Native 0.86
- React 19.2.3
- TypeScript
- Zustand
- expo-sqlite
- EAS Build / Submit

## Run locally
```bash
npm install
npx expo install --fix
npx expo-doctor
npx expo start
```

## Production builds
See `STORE_RELEASE_CHECKLIST.md`.

```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

## Important before store submission
Replace the placeholder privacy/support URLs in `app.json` with real public HTTPS
URLs and host `PRIVACY_POLICY.md`.

Current identifiers:
- Android: `com.sevkiuzun.mindtrack`
- iOS: `com.sevkiuzun.mindtrack`

Confirm these identifiers before first publication.
