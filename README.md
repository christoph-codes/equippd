# Equippd Mobile Foundation (Expo + React Native)

This repository now contains the Equippd mobile app foundation built with **Expo**, **React Native**, and **TypeScript**.

## Implemented foundation

- Authentication (sign up, log in, log out, persisted session)
- Firebase Authentication + Firestore service layer
- User profile upsert after signup
- Group seed and default member assignment (`The Fellas`)
- Dashboard with welcome, groups, recent notes, music preview, and shop preview
- Group list + group detail + studies list + study detail
- Study content driven by local MDX content structure
- Personal note create/edit flow bound to user/group/study
- Admin-aware read access for super users across groups, studies, and notes
- Music discovery section with starter cards
- Shop polished coming soon section
- Settings with logout and setup visibility
- Reusable UI components and typed models

## Routes (Expo Router)

- `/login`
- `/signup`
- `/(app)/dashboard`
- `/(app)/groups`
- `/(app)/groups/[groupSlug]`
- `/(app)/groups/[groupSlug]/studies`
- `/(app)/groups/[groupSlug]/studies/[studySlug]`
- `/(app)/notes/[noteId]`
- `/(app)/music`
- `/(app)/account`
- `/(app)/shop`
- `/(app)/settings`

## Content structure

- `/content/studies`
- `/content/music`
- `/content/articles`
- `/content/devotions`
- `/content/shop`

Sample study files:

- `/content/studies/the-fellas/isaiah-47.mdx`
- `/content/studies/the-fellas/sample-study.mdx`

## Firebase setup

Create a `.env` file with:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# Development emulator settings (recommended)
EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true
EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1
EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT=9099
EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST=127.0.0.1
EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_PORT=8080
EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1
EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT=9199
```

For EAS builds, define the same `EXPO_PUBLIC_*` values in your EAS environment so `app.config.ts` can forward them into the app build. For production, set `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=false`.

Firestore rules draft is in:

- `/firebase/firestore.rules`

## Firebase emulators (recommended for development)

To avoid editing cloud Firebase records while developing, this app automatically connects to Auth + Firestore emulators in development by default.

Start the emulators:

```bash
npx firebase-tools emulators:start --only auth,firestore,storage
```

Then run the app:

```bash
npm run web
```

Notes:

- You can force cloud Firebase in development by setting `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=false`.
- On physical devices, `127.0.0.1` points to the device itself. Set emulator host env vars to your machine LAN IP when needed.

## Admin super user

Provision the admin account in Firebase Authentication for each environment, then grant one of these server-controlled markers:

- Preferred for production: set a Firebase custom claim on the user, either `admin: true` or `role: "admin"`.
- Supported for dev and production: set the Firestore user profile document at `/users/{uid}` to include `role: "admin"`.

The client detects either marker after login. Firestore rules allow admins to read all users, group memberships, and notes, while regular users can only read their own private data.

## Run locally

```bash
npm install
npm run lint
npm run typecheck
npm run web
```

## Seed helper

Create The Fellas group in Firestore:

```bash
npm run seed:group
```

## Architecture notes

- `src/components` reusable app UI
- `src/context` auth context provider
- `src/hooks` app hooks
- `src/models` shared typed models
- `src/services/firebase` auth + firestore services
- `src/services/content` MDX frontmatter/content loaders

## TODO (next features)

- Render full MDX (not just markdown body) with native-safe component mappings
- Add deep linking and persistent bottom navigation
- Add optimistic note saving and offline support
- Add richer roles/permissions for leaders/admin
- Add music provider integrations (Spotify/Apple)
- Build product catalog + checkout for shop
- Add unit/integration test coverage for services and critical screens
