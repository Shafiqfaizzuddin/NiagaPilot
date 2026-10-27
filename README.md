# NiagaPilot AI

A mobile-friendly financial workspace for Malaysian microbusiness owners. This phase provides the app shell, navigation, Firebase Authentication foundation, and honest empty states for expense tracking. Expense entry, sales, receipts, and AI features are not implemented yet.

## Requirements

- Node.js 20.19+ or a current LTS release
- npm
- A Firebase project for sign in

## Setup

1. Run `npm install`.
2. Copy `.env.example` to `.env.local`.
3. In the Firebase console, create a web app and fill in the four `VITE_FIREBASE_*` values in `.env.local`.
4. Enable **Authentication → Sign-in method → Email/Password**.
5. Create a **Cloud Firestore** database for future expense data. No Firestore records are created by this phase.
6. Run `npm run dev` and open the local URL shown by Vite.

Without Firebase values, the app opens in an interface preview and displays a setup notice. Sign in and registration are disabled until configured. Restart Vite after changing environment variables.

## Commands

- `npm run dev` — local development server
- `npm run lint` — ESLint
- `npm run test` — Vitest
- `npm run build` — production build
- `npm run preview` — preview the production build

## Structure

`src/components` contains reusable UI and layout; `src/pages` contains routes; `src/config` initializes Firebase; `src/services` holds Firebase operations; `src/contexts` manages authentication; `src/validations` contains Zod schemas.

## Current scope

Dashboard, Expenses, Business Setup, and Settings are page foundations. Sales and AI Insights are visibly marked as coming later. Financial amounts are intentionally blank until real expense data exists.
