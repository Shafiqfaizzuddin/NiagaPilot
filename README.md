# NiagaPilot AI

NiagaPilot AI is a mobile-friendly financial workspace for Malaysian microbusiness owners. The current application supports Firebase Email/Password sign-in, a user-owned business profile, expense tracking, and a dashboard based on actual expense records. Sales, receipt uploads, and AI analysis are planned for later phases.

## Technology stack

- React, Vite, JavaScript/JSX, React Router, Tailwind CSS, Lucide React, and Recharts
- Firebase Authentication and Cloud Firestore (modular JavaScript SDK)
- React Hook Form and Zod for forms; Vitest and Firebase Rules Unit Testing for tests

## Install and configure

1. Install Node.js 20.19+ on the Node 20 line, or Node 22/24 LTS, and npm; then run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the Firebase web app settings:

   ```text
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```

3. In Firebase Console, create a web app, enable **Authentication → Sign-in method → Email/Password**, add your development and deployment domains under **Authentication → Settings → Authorized domains**, and create a Cloud Firestore database.
4. Review and publish [firestore.rules](firestore.rules). The rules are closed by default and validate user profiles, businesses, and expenses under `users/{uid}`. A Firebase web API key is client configuration, not a privileged server key or a substitute for rules.
5. Run `npm run dev`. Restart Vite whenever `.env.local` changes.

If sign-in succeeds but the app cannot load your workspace, verify that **Cloud Firestore is enabled** in the same Firebase project as `.env.local` and that its **`(default)` database** has been created. The app reads `users/{uid}` before choosing the business setup or dashboard route. A missing or disabled Firestore API can make that read fail even when Firebase Authentication works. After creating the database, publish `firestore.rules`, wait a few minutes for Google Cloud changes to propagate, then sign in again. If registration already created your Authentication account before the Firestore write failed, sign in with that email instead of registering a second time.

For this project, the Firestore API currently responds that it is disabled. Open the [Cloud Firestore API page for `niagapilot`](https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=niagapilot), enable it, then create the `(default)` database in [Firebase Console](https://console.firebase.google.com/project/niagapilot/firestore) if it is not already present. Choose a permanent database location appropriate for your users. The repository's `.firebaserc` defines an explicit `production` alias for `niagapilot` and intentionally has no default project, so CLI commands need `--project production`. After signing in with `npx firebase login`, publish rules with `npx firebase deploy --only firestore:rules --project production` only when you intend to change the live project's rules.

`.env.local` is ignored by Git. Never place service-account JSON, server API keys, or AI provider keys in frontend variables. If the login screen lists missing Firebase variables, complete `.env.local` and restart. If Firebase returns `CONFIGURATION_NOT_FOUND`, open Firebase Authentication in the Console, click **Get started** if offered, and enable Email/Password.

## Data and features

- Registration creates `users/{uid}` with UID, name, email, and server timestamps. Browser-local Firebase Auth persistence restores sign-in state after refresh.
- Business setup creates `users/{uid}/businesses/{businessId}`. One active business is selected for the MVP; its ID is loaded from the signed-in user's Firestore data on each session. Settings can edit its details.
- Expense records live at `users/{uid}/expenses/{expenseId}` and include an immutable business ID, integer `amountCents`, a local `YYYY-MM-DD` transaction date, and server timestamps. The Expenses page provides create, read, update, delete with confirmation, search, category/payment/date filters, sorting, totals, and category breakdown. A Firestore real-time listener updates the list.
- The Dashboard shares one business-scoped expense listener across its cards, month comparison, date trend, category distribution, and recent transactions. Add Expense shortcuts open the existing form at `/expenses?add=1`.
- Missing Firebase setup, loading, empty data, and permission errors have explicit UI states. No financial records are fabricated.

Earlier prototype business documents at `businesses/{uid}` are not migrated because they lack the required category. If you used that prototype, complete the current business setup form.

## Local commands and tests

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite locally |
| `npm run lint` | Run ESLint |
| `npm run test -- --run` | Run application and calculation tests |
| `npm run build` | Build production files into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run test:rules:emulator` | Start the Firestore emulator, run rules tests, then stop it |

Rules tests use `@firebase/rules-unit-testing` and the Firebase Emulator Suite with the demo project `demo-niagapilot`. Install Java 21+ and make `java` available on `PATH` before running `npm run test:rules:emulator`. The command runs only a local emulator; it does not contact or modify your production Firestore data. The tests explicitly check permitted owner actions and permission-denied results for unauthenticated access, cross-user access, invalid data, and immutable fields. The Firestore emulator port is 8080; change it in both `firebase.json` and `tests/firestore.rules.test.mjs` if that port is occupied.

On Windows, if Java reports `Unable to establish loopback connection`, set `TEMP` and `TMP` to a short writable directory and set `JAVA_TOOL_OPTIONS=-Djava.io.tmpdir=<same-directory>` for the test command.

## Deployment

1. Run `npm run lint`, `npm run test -- --run`, `npm run test:rules:emulator`, and `npm run build`.
2. Deploy `dist/` to a static host configured to serve `index.html` for React Router paths such as `/dashboard` and `/expenses`. Set the six Vite Firebase variables in the host's build environment and add the host domain to Firebase Authentication's authorized domains.
3. Publish the reviewed rules with Firebase Console or `firebase deploy --only firestore:rules --project <your-project-id>`. Deploying rules replaces the project's current rules; inspect the target project before doing so.

The repository changes and local tests do not deploy or publish anything automatically.

## Known limitations and planned work

- The MVP uses one active business per account. There is no business switcher or business deletion.
- Expense filtering and dashboard aggregation load the active business's full expense collection into the client. Pagination or server-side aggregation may be needed when a business has many records.
- Expense dates use the browser's local calendar; the app does not store a separate business timezone.
- Receipt upload/OCR, AI financial recommendations, sales tracking, and profit reporting are planned. AI credentials must stay on a future trusted backend, never in the React bundle.
