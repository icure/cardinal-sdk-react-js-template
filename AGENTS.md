# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this repo is

A **Vite + React + TypeScript starter** for apps using the iCure Cardinal SDK, distributed via degit:

```
npx degit icure/cardinal-sdk-react-js-template my-app
```

The repo root is the app. There is no separate template directory — what you're editing is exactly what end users get.

## Dev workflow

All commands run at the repo root:

```sh
yarn install
yarn dev          # Vite dev server with HMR; LESS handled natively
yarn build
yarn preview
yarn lint
yarn test         # vitest
```

## Critical architecture: the `apiCache`

**`CardinalSdk` is non-serializable and must never enter Redux.** It lives in a module-level map:

```ts
// src/core/services/auth.api.ts
const apiCache: { [key: string]: CardinalSdk } = {}  // key = "${groupId}/${userId}"
```

Any code needing the live SDK calls `cardinalApi(getState)` (exported from `auth.api.ts`). This is why `store.ts` sets `serializableCheck: false, immutableCheck: false` — keep those off.

## Adding a new SDK-backed feature

Copy `src/core/api/practitionerApi.ts`:

```ts
export const myFeatureApiRtk = createApi({
  reducerPath: 'myFeatureApi',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),   // unused; always use queryFn
  endpoints: (builder) => ({
    getItem: builder.query<MyType, string>({
      async queryFn(id, { getState }) {
        const api = (await cardinalApi(getState))?.patient  // pick the right SDK namespace
        return guard([api], async () => api!.getPatient(id))
      },
    }),
  }),
})
```

Then register in **both**:
- `src/core/reducer.ts` — add to `combineReducers`
- `src/core/store.ts` — add to `.middleware`

## Auth state machine (two flows)

Both flows end with `apiCache` populated and Redux `cardinalApi.online === true`.

- **Signup/first-login:** `CardinalBaseSdk.initializeWithProcess(...)` → stores `BaseAuthenticationWithProcessStep` in Redux as `authProcess` → `authProcess.completeAuthentication(code)` → `.toFullSdk(...)` → cache SDK.
- **Returning login:** `CardinalBaseSdk.initialize(..., new AuthenticationMethod.UsingCredentials.UsernamePassword(email, token), ...)` → `.toFullSdk(...)` → cache SDK.

The long-lived token (`api.user.getToken(id, 'rememberMe')`) is saved to `app.savedCredentials` and rehydrated on reload by `Layout/index.tsx` which dispatches `setEmail → setToken → login()`.

## Redux persistence rules

`redux-persist` whitelists **only the `app` slice** (in `core/reducer.ts`). Never move `cardinalApi` state into `app`; never add non-serializable objects to any persisted slice.

- Serializable, survives reload → `app` slice (`core/app/index.ts`)
- Non-serializable or ephemeral → `cardinalApi` slice (`core/services/auth.api.ts`)

## Routing and layout gating

Gate routes via layouts in `src/layout/`, not per-page:
- `Layout` (public) — auto-login; redirects to `/home` when `online`
- `AuthenticatedLayout` — redirects to `/` when not `online`

Add routes in `src/navigation/Router.tsx`.

## Env vars

Read with `import.meta.env.VITE_*`, never `process.env.*`. The full set is declared in `.env.default` and typed in `src/vite-env.d.ts`.

## Code style

From `eslint.config.js` / `.prettierrc`: no semicolons, single quotes, trailing commas, `printWidth: 180`, 2-space indent. Use `useAppDispatch` / `useAppSelector` from `core/hooks.ts`, never raw `react-redux` versions.

## Key files

| File | Role |
|------|------|
| `src/core/services/auth.api.ts` | SDK lifecycle, auth thunks, `apiCache`, `guard()`, `TemplateCryptoStrategies` |
| `src/core/api/practitionerApi.ts` | Pattern for all new RTK Query + SDK endpoints |
| `src/core/store.ts` | Redux store; RTK Query middleware registration |
| `src/core/reducer.ts` | `combineReducers`; `redux-persist` whitelist |
| `src/layout/Layout/index.tsx` | Auto-login on reload from persisted credentials |
| `src/vite-env.d.ts` | Typed `ImportMetaEnv` for `VITE_*` vars |
| `vite.config.ts` | Vite + Vitest config; LESS preprocessor; build output to `build/` |
