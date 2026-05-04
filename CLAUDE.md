# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For deeper architectural context (auth state machine, encryption model, what's implemented vs. to-build), see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Repository purpose

A **Vite + React + TypeScript starter** for e-health apps using the iCure Cardinal SDK. End users consume it via degit:

```
npx degit icure/cardinal-sdk-react-js-template my-app
```

The repo root *is* the app. There is no separate template directory or publishing manifest — the codebase you're looking at is exactly what a user gets.

## Common commands

All commands run at the repo root:

```
yarn install
yarn dev            # Vite dev server with HMR; LESS handled natively
yarn build          # production bundle to build/
yarn preview        # serve the built bundle locally
yarn lint           # eslint .
yarn test           # vitest
```

ESLint is configured via the flat config in `eslint.config.js` (ESLint 10) — no `.eslintrc` JSON. Style: `semi: never`, `max-len: 180`, `prettier` plugin, single quotes, trailing commas, 2-space indent.

## Required env before running

Copy `.env.default` → `.env` and fill in:
- `VITE_PROJECT_ID`
- `VITE_EXTERNAL_SERVICES_SPEC_ID`
- `VITE_EMAIL_AUTHENTICATION_PROCESS_ID` (and/or `VITE_SMS_AUTHENTICATION_PROCESS_ID`)
- `VITE_PARENT_ORGANISATION_ID`

Without these, authentication will not complete. See https://docs.icure.com/how-to/index and the Cockpit Portal at https://cockpit.icure.cloud/.

Env vars are read via `import.meta.env.VITE_*` (Vite convention). Types are declared in `src/vite-env.d.ts`.

## Architecture

The app is a single-page React 19 + Redux Toolkit 2 app whose only domain feature is the Cardinal SDK auth flow. The pieces that span files:

### Cardinal SDK lifecycle and the `apiCache`

`src/core/services/auth.api.ts` is the heart of the app. It exposes a Redux Toolkit slice (`api`) plus thunks (`startAuthentication`, `completeAuthentication`, `login`, `logout`).

A **module-level `apiCache: { [key]: CardinalSdk }`** keyed by `${user.groupId}/${user.id}` holds live SDK instances. The SDK is *intentionally not stored in Redux* — only serializable state (email, token, user, flags) lives in the store. Any code that needs the SDK calls `cardinalApi(getState)` / `getApiFromState(...)` to look it up.

This is why `store.ts` configures Redux with `serializableCheck: false, immutableCheck: false` — keep those off if you store further non-serializable handles in Redux state, otherwise toolkit will throw in dev.

### Two SDK init paths

- **First-time / signup flow** → `CardinalSdk.initializeWithProcess(...)` (with Kerberus solution, telecom type, auth process ID). Returns an `AuthenticationWithProcessStep` stored as `authProcess` in state; later `authProcess.completeAuthentication(token)` produces the SDK instance.
- **Returning user** → `CardinalSdk.initialize(..., new AuthenticationMethod.UsingCredentials.UsernamePassword(email, longLivedToken), ...)`. The long-lived token is obtained via `api.user.getToken(user.id, 'rememberMe')` after first login and persisted (see below).

### Persistence

`src/core/app/index.ts` defines a small `app` slice holding `savedCredentials = { login, token, tokenTimestamp }`. `redux-persist` is configured in `core/reducer.ts` with `localForage` as storage and **whitelist `['app']`** — so only the `rememberMe` credential survives reload, never the full `cardinalApi` state.

On reload, `src/layout/Layout/index.tsx` reads `app.savedCredentials` and dispatches `setEmail` → `setToken` → `login()` automatically, which reconstructs the SDK and flips `online: true`.

### Routing & layouts

`src/navigation/Router.tsx` defines three routes: `/` (login), `/register`, `/home`. Layouts gate access:
- `Layout` (public) — auto-login from persisted creds; navigates to `/home` when `online` becomes true.
- `AuthenticatedLayout` — bounces to `/` when `online` is false.

When adding routes, decide which layout wraps them; do not implement gating per-page.

### RTK Query against the SDK (not HTTP)

`src/core/api/practitionerApi.ts` shows the pattern for new SDK-backed queries: `createApi` with a dummy `fetchBaseQuery`, every endpoint defined via `queryFn` that pulls the live SDK from `apiCache` via `cardinalApi(getState)`, then wraps the call in the `guard(...)` helper from `auth.api.ts` (which short-circuits if any input is falsy and converts thrown errors to `FetchBaseQueryError`). Add new APIs by following this file's shape and registering them in `core/store.ts` middleware **and** `core/reducer.ts` `combineReducers`.

### Styles

Components ship a sibling `index.less`. Vite compiles LESS natively at dev/build time via the `less` dev dep — no separate watcher and no committed `.css` files.

Ant Design theming lives in `src/style/antd/antdTheme.ts` and is applied via `<ConfigProvider theme={...}>` in `App.tsx`.

## Conventions worth following

- Match the existing ESLint/Prettier style: no semicolons, single quotes, trailing commas, `printWidth: 180`, 2-space indent.
- Typed Redux: import `useAppSelector` / `useAppDispatch` from `core/hooks.ts`, not the raw `react-redux` versions.
- New SDK calls go through the `apiCache` + `guard()` pattern; do not re-instantiate `CardinalSdk` outside `auth.api.ts`.
- Read env vars with `import.meta.env.VITE_*`, never `process.env.*`.
