# NiagaPilot AI

NiagaPilot AI is a mobile-friendly financial workspace for Malaysian microbusiness owners. It supports Firebase Email/Password sign-in, user-owned business profiles, expense and sales tracking, and a dashboard based on actual records. AI connection testing and evidence-backed business briefings use Vercel Functions and NVIDIA Nemotron through Nebius Token Factory. Receipt uploads are not implemented in this checkout.

## Technology stack

- React, Vite, JavaScript/JSX, React Router, Tailwind CSS, Lucide React, and Recharts
- Firebase Authentication and Cloud Firestore (modular JavaScript SDK); Firebase Admin SDK in Vercel Functions only
- Vercel Functions and Nebius Token Factory for authenticated AI requests
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

   For AI endpoints, also set the **server-only** values in `.env.local` for local Vercel development and in Vercel Project Settings → Environment Variables for deployment:

   ```text
   FIREBASE_PROJECT_ID=
   FIREBASE_CLIENT_EMAIL=
   FIREBASE_PRIVATE_KEY=
   NEBIUS_API_KEY=
   NEBIUS_MODEL=nvidia/nemotron-3-super-120b-a12b
   NEBIUS_BASE_URL=https://api.tokenfactory.us-central1.nebius.com/v1/
   ```

   Use the Firebase service account's project ID, client email, and private key for the **same** Firebase project used by the web app. Paste the private key as one quoted value with literal `\n` line breaks; the server converts them to real newlines. Never prefix server values with `VITE_`. Store the key in Vercel's encrypted environment settings, never in source control. A service-account JSON file is unnecessary.

3. In Firebase Console, create a web app, enable **Authentication → Sign-in method → Email/Password**, add your development and deployment domains under **Authentication → Settings → Authorized domains**, and create a Cloud Firestore database.
4. Review and publish [firestore.rules](firestore.rules). The rules are closed by default and validate user profiles, businesses, expenses, and sales under `users/{uid}`. Only the owner may read saved AI briefings; clients cannot write them. A Firebase web API key is client configuration, not a privileged server key or a substitute for rules.
5. Run `npm run dev` for the React app only. To test React and `/api/ai/*` together, link this directory to a Vercel project with `npx vercel link`, then run `npm run dev:full`. That command loads the server-only settings from `.env.local` into the local Vercel Function process and serves Vite and the API on one origin. Running `npx vercel dev` directly uses the linked Vercel project's Development environment, which may omit your local server credentials. Restart the development server whenever environment variables change. `npm run dev` by itself does not serve the API routes.

If sign-in succeeds but the app cannot load your workspace, verify that **Cloud Firestore is enabled** in the same Firebase project as `.env.local` and that its **`(default)` database** has been created. The app reads `users/{uid}` before choosing the business setup or dashboard route. A missing or disabled Firestore API can make that read fail even when Firebase Authentication works. After creating the database, publish `firestore.rules`, wait a few minutes for Google Cloud changes to propagate, then sign in again. If registration already created your Authentication account before the Firestore write failed, sign in with that email instead of registering a second time.

If Firestore reports that its API is disabled, open the [Cloud Firestore API page for `niagapilot`](https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=niagapilot), enable it, then create the `(default)` database in [Firebase Console](https://console.firebase.google.com/project/niagapilot/firestore) if it is not already present. Choose a permanent database location appropriate for your users. The repository's `.firebaserc` defines an explicit `production` alias for `niagapilot` and intentionally has no default project, so CLI commands need `--project production`. After signing in with `npx firebase login`, publish rules with `npx firebase deploy --only firestore:rules --project production` only when you intend to change the live project's rules.

`.env.local` is ignored by Git. Never place service-account JSON, server API keys, or AI provider keys in frontend variables. If the login screen lists missing Firebase variables, complete `.env.local` and restart. If Firebase returns `CONFIGURATION_NOT_FOUND`, open Firebase Authentication in the Console, click **Get started** if offered, and enable Email/Password.

## Data and features

- Registration creates `users/{uid}` with UID, name, email, and server timestamps. Browser-local Firebase Auth persistence restores sign-in state after refresh.
- Business setup creates `users/{uid}/businesses/{businessId}`. One active business is selected for the MVP; its ID is loaded from the signed-in user's Firestore data on each session. Settings can edit its details.
- Expense records live at `users/{uid}/expenses/{expenseId}` and include an immutable business ID, integer `amountCents`, a local `YYYY-MM-DD` transaction date, and server timestamps. The Expenses page provides create, read, update, delete with confirmation, search, category/payment/date filters, sorting, totals, and category breakdown. A Firestore real-time listener updates the list.
- Sales records live at `users/{uid}/sales/{saleId}` with immutable business ID and source, integer `amountCents`, local transaction date, description, optional customer/payment/notes, and server timestamps. The Sales page supports validated create, read, update, delete with confirmation, search, payment filtering, sorting, and totals. A business-scoped listener updates the page and dashboard.
- The Dashboard shares one business-scoped expense listener across its cards, month comparison, date trend, category distribution, and recent transactions. Add Expense shortcuts open the existing form at `/expenses?add=1`.
- `/ai-insights` calls authenticated `/api/ai/financial-analysis`, `/api/ai/briefing`, `/api/ai/history`, and `/api/ai/test` routes. The server verifies the Firebase ID token and checks `users/{uid}/businesses/{businessId}` before reading or writing AI data. The dashboard displays the latest saved briefing without triggering a model call. `/insights` redirects to the new route.
- The financial engine reads only the authenticated user's selected-business sales and expenses, validates integer cents and transaction dates, and calculates revenue, expenses, estimated cash-based surplus, category shares, and period comparisons in code. **Last 7 days** means a rolling seven-day window including today, compared with the preceding seven days. **This month** compares month-to-date with the same calendar days of the prior month, capped at that month's end. **Last month** compares two completed calendar months. Dates use `Asia/Kuala_Lumpur`.
- The insight rules use configurable thresholds in `server/insightRules.js`: expense increase 15%, revenue decrease 15%, category increase 20%, spending concentration 40%, surplus decrease 15%, and a minimum RM100 change and three comparable transactions where applicable. These are application signals, not universal financial standards. Revenue and surplus observations use verified Sales records.
- Nemotron receives aggregate metrics and structured observations, not names, descriptions, merchants, or notes. Its JSON narrative is validated against server-generated observation IDs before saving. Briefings are stored at `users/{uid}/businesses/{businessId}/aiBriefings/{briefingId}` with server timestamps, model/provider, language, financial snapshot, and a data fingerprint. History is paginated in pages of ten. A matching fingerprint, period, language, and model reuses a saved briefing instead of calling the provider again. Opening a saved briefing checks whether its current financial fingerprint has changed.
- Revenue and estimated cash-based surplus remain **unavailable** for a business until it records its first sale. Thereafter the figures represent only recorded transactions; a zero-sales period can correctly show zero revenue. Surplus is never called accounting net profit. The informal health indicator remains `insufficient_data` when selected periods lack enough records.
- AI calls are bounded to 3 connection tests and 10 briefings per user per UTC day, with 60-second and 120-second cooldowns respectively. Firestore transactions enforce these limits in `users/{uid}/aiRateLimits`; clients cannot write that path under the current rules. A reserved request counts even if the provider later fails. Request bodies are capped at 8 KiB; expense and sales reads are each capped at 2,000 records per business. The model request has a timeout and bounded output budget. No endpoint proxies Nebius without authentication.
- Missing Firebase setup, loading, empty data, and permission errors have explicit UI states. No financial records are fabricated.

Earlier prototype business documents at `businesses/{uid}` are not migrated because they lack the required category. If you used that prototype, complete the current business setup form.

## Local commands and tests

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite locally |
| `npm run dev:full` | Start Vite and Vercel API routes with server credentials loaded from ignored `.env.local` |
| `npm run check:config` | Validate local Firebase and Nebius environment variable structure without printing values |
| `npm run check:config -- --online` | Also verify Firebase Authentication and Firestore connectivity with server credentials |
| `npm run check:config -- --provider` | Make one small paid Nebius model request to verify the key and model ID |
| `npm run import:service-account -- <path-to-json>` | Import a downloaded Firebase service account into ignored `.env.local` without printing credentials |
| `npx vercel dev` | Start Vite and API routes using the linked Vercel project's Development variables; configure those separately first |
| `npm run lint` | Run ESLint |
| `npm run test -- --run` | Run application and calculation tests |
| `npm run build` | Build production files into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run test:rules:emulator` | Start the Firestore emulator, run rules tests, then stop it |

Rules tests use `@firebase/rules-unit-testing` and the Firebase Emulator Suite with the demo project `demo-niagapilot`. Install Java 21+ and make `java` available on `PATH` before running `npm run test:rules:emulator`. The command runs only a local emulator; it does not contact or modify your production Firestore data. The tests explicitly check permitted owner actions and permission-denied results for unauthenticated access, cross-user access, invalid data, and immutable fields. The Firestore emulator port is 8080; change it in both `firebase.json` and `tests/firestore.rules.test.mjs` if that port is occupied.

On Windows, if Java reports `Unable to establish loopback connection`, set `TEMP` and `TMP` to a short writable directory and set `JAVA_TOOL_OPTIONS=-Djava.io.tmpdir=<same-directory>` for the test command.

If the page says **Firebase Admin is not configured**, stop old Vercel/Vite processes and start a fresh `npm run dev:full`; open the URL printed by that command. `npx vercel dev` uses the linked project's Development environment, which can be empty even when `.env.local` and Production settings contain credentials. Run `npm run check:config` to check local settings without printing secrets. A missing API route usually means the app was started with `npm run dev` alone. Nebius credential, model, rate-limit, and connectivity errors are reported separately by the API.

## Deployment

1. Run `npm run lint`, `npm run test -- --run`, `npm run test:rules:emulator`, and `npm run build`.
2. Create a Vercel Hobby project from this repository. The checked-in `vercel.json` builds Vite to `dist/`, serves `api/ai/*.js` as Node functions, and sends other client-side routes to `index.html`. Set all six `VITE_FIREBASE_*` variables for the frontend build and the server-only variables above for Functions. `NEBIUS_BASE_URL` is optional; it is constrained to an HTTPS Nebius Token Factory `/v1/` origin. Keep the Vercel region appropriate for your users and provider latency. For an existing project, use `npx vercel deploy --environment preview` to target Preview explicitly. Vercel's **first deployment of a new project may become Production even without `--prod`**; check the command output before deploying a new project if you require Preview only.
3. Add the deployed Vercel domain to Firebase Authentication's authorized domains. Firebase Authentication and Cloud Firestore remain in your Firebase project; no Firebase Cloud Functions deployment or Blaze upgrade is required for these Vercel endpoints.
4. Review and publish the updated `firestore.rules` with Firebase Console or `firebase deploy --only firestore:rules --project production`. The new rules allow only owner reads of saved AI briefings; client writes are denied. Publishing rules replaces the project's current rules, so inspect the target project first.

The repository changes and local tests do not deploy or publish anything automatically.

## Known limitations and planned work

- The MVP uses one active business per account. There is no business switcher or business deletion.
- The `firebase-admin` dependency uses a scoped `jwks-rsa` override because Vercel's Node 24 function runtime could not load the upstream CommonJS/ESM combination. Keep this override under review when upgrading Firebase Admin; validate the deployed `/api/ai/test` endpoint after any dependency change.
- Expense filtering and dashboard aggregation load the active business's full expense collection into the client. Pagination or server-side aggregation may be needed when a business has many records.
- Expense dates use the browser's local calendar; the app does not store a separate business timezone.
- Historical businesses with no sales records show revenue and surplus as unavailable until a sale is entered. Recorded sales and expenses do not include tax, inventory adjustments, depreciation, or accrual accounting; estimated cash-based surplus is not net profit.
- Model recommendations are suggestions, not financial advice. The server rejects malformed JSON, unsupported observation references, and numeric claims in generated narrative, but semantic interpretation still requires user judgment. Automated tests mock the provider. A protected Vercel Preview was tested with real Nemotron responses in English and Bahasa Melayu using temporary sales and expenses that were removed afterward. A real user's browser sign-in flow was not exercised on the protected Preview.
- The service-account key previously pasted into chat was rotated, then disabled and deleted from Google IAM. The replacement is in ignored `.env.local` and Vercel environment settings. Rotate it again if it is ever exposed.
- Receipt upload/OCR remains planned. AI credentials stay on the Vercel backend, never in the React bundle.
