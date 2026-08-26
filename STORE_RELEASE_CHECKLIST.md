# MindTrack 1.0.0 — Store Release Checklist

## Identity
- App name: MindTrack
- Android package: com.sevkiuzun.mindtrack
- iOS bundle identifier: com.sevkiuzun.mindtrack
- Public version: 1.0.0
- Android versionCode: managed by EAS after first build
- iOS buildNumber: managed by EAS after first build

IMPORTANT: Confirm the package/bundle IDs before first store submission.
Changing them later normally creates a different app identity.

## Before building
1. Replace `YOUR-DOMAIN.example` values in app.json with real HTTPS URLs.
2. Host PRIVACY_POLICY.md as a public web page.
3. Add a real support/contact URL.
4. Review app icon and splash artwork.
5. Test on at least one physical Android device and one physical iPhone/iPad.
6. Run `npx expo install --fix`.
7. Run `npx expo-doctor`.

## EAS setup
```bash
npm install -g eas-cli
eas login
eas build:configure
```

The project already contains `eas.json`.

## Android production build
```bash
eas build --platform android --profile production
```

Expected store artifact: `.aab`

## iOS production build
```bash
eas build --platform ios --profile production
```

Expected store artifact: signed iOS build for App Store Connect.

## Submit
```bash
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

Store accounts, legal agreements, tax/banking details where applicable, app privacy
forms, content/age ratings, screenshots and public store metadata must still be
completed in Google Play Console and App Store Connect.

## Suggested listing
Name: MindTrack

Short description:
Hafıza, bilişsel egzersiz ve odak rutinlerini günlük olarak takip et.

Long description:
MindTrack günlük hafıza, bilişsel gelişim ve odak/dua çalışmalarını sade bir
program içinde takip etmenizi sağlar. Günlük görevlerinizi görün, tamamladıkça
işaretleyin ve haftalık, aylık ve yıllık ilerlemenizi takip edin.

The current release works offline and does not require an account.

## Current v1.0.0 scope
- Daily automatic tasks
- Completion checkboxes
- Daily minutes and completion rate
- 7-day plan
- Weekly/monthly/yearly progress summaries
- Offline SQLite storage
- Privacy/About screen
