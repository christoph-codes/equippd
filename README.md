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
```

Firestore rules draft is in:
- `/firebase/firestore.rules`

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
