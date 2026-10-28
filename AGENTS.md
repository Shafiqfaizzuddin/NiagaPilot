# NiagaPilot AI development guidelines

- Use React functional components, hooks, JavaScript, and JSX. Keep components focused and reusable.
- Keep Firebase initialization in `src/config/firebase.js` and Firebase operations in `src/services/`.
- Keep page components in `src/pages/`, shared UI in `src/components/`, schemas in `src/validations/`, and small helpers in `src/utils/`.
- Use React Router declarative routes. Authenticated pages share `AppLayout`.
- Use Tailwind CSS utilities and the palette: emerald `#059669`, slate text `#0F172A`, background `#F8FAFC`, white cards, and borders `#E2E8F0`.
- Design mobile first, with accessible labels, visible focus states, comfortable touch targets, and no horizontal overflow.
- Handle loading, empty, and error states honestly. Never insert fake financial records or claim Firebase is connected when it is not configured.
- Authentication uses Firebase Email/Password and per-user Firestore profiles. Keep client routes and Firestore rules aligned.
- Business data lives in `users/{uid}/businesses/{businessId}`. Derive `uid` from Firebase Auth in the service, validate all editable fields, and use `BusinessContext` for the active business.
- Expense transactions live in `users/{uid}/expenses/{expenseId}`, with integer cents and an immutable business ID. Keep expense reads scoped to the active business.
- Do not implement Sales, AI Insights, or receipt extraction until requested.
- Use async/await for asynchronous operations, readable names, and comments only for non-obvious logic.
- Before delivery, run `npm run lint`, `npm run test`, and `npm run build`.
