# Firebase Storage Setup

## Firebase console

1. Create or open a Firebase project.
2. Add a Web app and copy its configuration values.
3. Enable **Authentication -> Sign-in method -> Google** and **Anonymous**.
4. Create **Storage** in production mode.
5. Deploy the repository's `storage.rules` file in the Firebase Storage Rules editor.

## Vercel environment variables

Set these variables on the frontend Vercel project. They are public web-app identifiers, not server secrets:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

The donor registration page uploads profile photos to `avatars/{anonymous-user-id}/` and stores the returned download URL in the current user profile entry. Without Firebase variables, it keeps the existing browser-local fallback.

The Firebase web configuration must not contain service-account credentials. Never put a Firebase Admin private key in the frontend or commit it to Git.

## Django Google sign-in verification

The backend verifies the Firebase ID token before creating the normal Django session. Configure this backend variable in Vercel or the server environment:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

Use the downloaded Firebase Admin service-account JSON as the value. For local development, `GOOGLE_APPLICATION_CREDENTIALS` may be used instead. Never expose these credentials as `VITE_` variables or commit a service-account JSON file.