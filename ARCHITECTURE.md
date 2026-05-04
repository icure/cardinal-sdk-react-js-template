# ARCHITECTURE.md

A guide for developers picking up this repo. Explains *why* things are shaped the way they are, *what already works*, and *what you still have to build* to ship a real product on top of this template.

For end-user / template-consumer instructions, see [`README.md`](./README.md).

## 1. What this repo is

A **Vite + React + TypeScript starter** for an e-health frontend backed by the [Cardinal SDK](https://docs.icure.com/). End users scaffold a new app via degit:

```
npx degit icure/cardinal-sdk-react-js-template my-health-tech-app
```

The repo root is the app. The starter ships email + one-time-code authentication, encrypted-data plumbing, and a single example domain query. Everything else is built on top of the patterns shown here.

## 2. Project layout

```
.
├── index.html              # Vite entry point
├── vite.config.ts          # Vite + Vitest config; LESS preprocessor; output → build/
├── eslint.config.js        # ESLint 10 flat config
├── tsconfig.json
├── .env.default            # VITE_* env var template
├── public/                 # static assets copied verbatim into the build
└── src/
    ├── App.tsx
    ├── index.tsx           # Redux Provider + Router mount
    ├── core/
    │   ├── services/auth.api.ts       # apiCache, auth thunks, CryptoStrategies
    │   ├── api/practitionerApi.ts     # example RTK Query endpoint
    │   ├── app/index.ts               # persisted "savedCredentials" slice
    │   ├── store.ts
    │   ├── reducer.ts
    │   └── hooks.ts                   # typed useAppDispatch/useAppSelector
    ├── layout/             # Public + Authenticated layouts; route gating
    ├── navigation/Router.tsx
    ├── pages/              # LoginPage, RegisterPage, DashboardPage
    ├── components/         # Header, SpinLoader, authentication/*
    └── style/              # Antd theme + LESS utilities
```

## 3. Big-picture architecture

```
React UI (Antd + Less)
    │  dispatch / useSelector
    ▼
Redux store (Redux Toolkit)
    │
    ├── slice "app"            ── persisted via redux-persist + localForage
    │     └── savedCredentials = { login, token, tokenTimestamp }
    │
    ├── slice "cardinalApi"    ── NOT persisted; non-serializable; auth state machine
    │     └── thunks: startAuthentication → completeAuthentication
    │              login / logout
    │              recoveryKeyRequest, newlyCreatedRecoveryKey
    │
    └── RTK Query slice "practitionerApi"
          └── queryFn → cardinalApi(getState) → SDK call
                              │
                              ▼
                    module-level apiCache
                    Map<groupId/userId, CardinalSdk>
                              │
                              ▼
                    @icure/cardinal-sdk
                    (CardinalBaseSdk → toFullSdk → CardinalSdk)
                              │
                              └── Cardinal Cloud
                                  api.icure.cloud + msg-gw.icure.cloud
```

The single most important thing to internalise: **the SDK is non-serializable, so it lives in a module-level `apiCache` keyed by `${groupId}/${userId}` and is never put in Redux**. Redux only holds serializable identifiers; any code that needs the live SDK calls `cardinalApi(getState)` to look it up. This is also why the store is configured with `serializableCheck: false, immutableCheck: false` in `src/core/store.ts` — the `authProcess` field on the auth slice holds an SDK handle for the brief window between starting and completing email-code authentication.

## 4. Authentication state machine (the heart of the template)

Two flows. Both end with a fully-initialised `CardinalSdk` cached in `apiCache` and `cardinalApi.online === true`.

### 4.1 Signup / first login (process-based)

1. The user enters their email (and first/last name on signup). On form mount, `KerberusCaptcha` fetches a `Challenge` from `${MSG_GW_URL}/${SPEC_ID}/challenge` and resolves it in the browser via `resolveChallenge`, producing a `Solution` (a small proof-of-work).
2. `startAuthentication` thunk fires:
   ```
   CardinalBaseSdk.initializeWithProcess(
     applicationId, baseUrl, msgGwUrl, specId, processId,
     AuthenticationProcessTelecomType.Email, email,
     new CaptchaOptions.Kerberus.Computed({ solution }),
     { firstName, lastName },
     { groupSelector }
   )
   ```
   It returns a `BaseAuthenticationWithProcessStep` that the slice stores as `cardinalApi.authProcess`. The user receives a six-digit code by email.
3. The user types the code. `completeAuthentication` thunk:
   - calls `authProcess.completeAuthentication(shortToken)` → `CardinalBaseSdk`
   - calls `baseSdk.toFullSdk(StorageFacade.usingBrowserLocalStorage(), { useHierarchicalDataOwners: false, cryptoStrategies: new TemplateCryptoStrategies() })` → full `CardinalSdk`
   - On a brand-new account, `TemplateCryptoStrategies.generateNewKeyForDataOwner` returns `true`, the SDK creates an RSA key, then `notifyNewKeyCreated` is invoked: it generates a recovery key via `apis.recovery.createRecoveryInfoForAvailableKeyPairs`, base32-encodes it as `xxxx-xxxx-…`, and dispatches `setNewlyCreatedRecoveryKey({ recoveryKey })` so the `NewRecoveryKeyBanner` shows it.
   - obtains a long-lived token via `api.user.getToken(user.id, 'rememberMe', { tokenValidity: 30*24*3600 })` and persists `{ login, token, tokenTimestamp }` to `app.savedCredentials`.
   - caches the SDK in `apiCache` and flips `online: true`.

### 4.2 Returning login (credentials-based)

1. On mount, the public `Layout` reads `app.savedCredentials` from the persisted store and dispatches `setEmail` → `setToken` → `login()`.
2. `login` thunk:
   ```
   CardinalBaseSdk.initialize(
     applicationId, baseUrl,
     new AuthenticationMethod.UsingCredentials.UsernamePassword(email, longLivedToken),
     { groupSelector }
   ).toFullSdk(storage, { ..., cryptoStrategies: new TemplateCryptoStrategies() })
   ```
3. If the device is missing some encryption keys, `TemplateCryptoStrategies.recoverAndVerifySelfHierarchyKeys` opens the `RecoveryKeyPrompt` modal (by dispatching `askForRecoveryKey`) and pauses on `store.subscribe(...)` until the user either submits (`setRecoveryKeys`) or skips (`clearRecoveryKeyRequest`). If submitted keys are valid, `keyPairRecoverer.recoverWithRecoveryKey(...)` decrypts them.

## 5. Why `redux-persist` whitelists only `app`

The `cardinalApi` slice contains:
- `authProcess`: a non-serializable `BaseAuthenticationWithProcessStep` (live SDK handle).
- ephemeral UI state like `waitingForToken`, `recoveryKeyRequest`.

Persisting any of that would corrupt rehydration and could leak privileged objects to disk. Only `app.savedCredentials` (login id + long-lived token + timestamp) is persisted. On reload everything else starts empty and is rebuilt by the `login` thunk.

Configured in `src/core/app/index.ts` and `src/core/reducer.ts`.

## 6. Routing and gating

Two layouts in `src/layout/` bracket each route group:

- `Layout` (public) — auto-attempts silent login from `app.savedCredentials`; bounces to `/home` once `online`.
- `AuthenticatedLayout` — bounces to `/` when `online` is false.

New routes go in `src/navigation/Router.tsx` and get wrapped in the appropriate layout. **Don't gate per-page.**

Both layouts also mount `<NewRecoveryKeyBanner />` and `<RecoveryKeyPrompt />` near the `<Outlet />`, so those overlays are visible across every route without each page having to import them.

## 7. Encryption model (CryptoStrategies, why it matters)

Cardinal stores patient data end-to-end encrypted with each data owner's RSA keypair. Keys live in browser local storage via `StorageFacade.usingBrowserLocalStorage()`. The SDK delegates three callbacks to user code; the template's `TemplateCryptoStrategies` (in `src/core/services/auth.api.ts`) implements them:

| Callback                                                             | What the template does                                                                                                                                                                                                                                   |
|----------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `generateNewKeyForDataOwner(self, primitives)`                       | Returns `true` only when the data owner has no public keys (first-time signup), otherwise `false`. The SDK then mints a new keypair.                                                                                                                     |
| `notifyNewKeyCreated(apis, key, primitives)`                         | Generates a `RecoveryDataKey`, base32-formats it, and dispatches `setNewlyCreatedRecoveryKey` so the banner can display it.                                                                                                                              |
| `recoverAndVerifySelfHierarchyKeys(keysData, primitives, recoverer)` | Opens the recovery prompt via `askForRecoveryKey`, waits for `setRecoveryKeys` or `clearRecoveryKeyRequest` via `store.subscribe`, then tries each entered key against `recoverer.recoverWithRecoveryKey`. Aggregates successes into `RecoveredKeyData`. |

**Without a saved recovery key, a user logging in from a new device cannot decrypt their old data.** The banner makes saving the key a deliberate, visible step. There is intentionally no automatic email-the-recovery-key escape hatch — that would defeat end-to-end encryption.

## 8. Captcha (Kerberus)

The 2.x SDK accepts `CaptchaOptions.Kerberus.Computed({ solution })`. The browser:
1. fetches a `Challenge` from `${MSG_GW_URL}/${SPEC_ID}/challenge`,
2. proof-of-works it via `resolveChallenge(challenge, specId, undefined, onProgress)`,
3. passes the resulting `Solution` to `CardinalBaseSdk.initializeWithProcess(...)`.

The `KerberusCaptcha` component (`src/components/authentication/KerberusCaptcha/`) encapsulates fetch + resolve + progress reporting and is mounted inside both `LoginForm` and `SignupForm`. It auto-resolves on mount and renders an Antd `<Progress>` while computing; submit is disabled until `Solution` arrives. If the user takes too long to submit, you can force a re-resolve by bumping the optional `refreshCounter` prop.

## 9. Where to add a new Cardinal-backed feature

The single existing example, `src/core/api/practitionerApi.ts`, is the pattern to copy:

```ts
export const practitionerApiRtk = createApi({
  reducerPath: 'practitionerApi',
  baseQuery: fetchBaseQuery({ baseUrl: '' }), // unused; we use queryFn
  endpoints: (builder) => ({
    getPractitioner: builder.query<HealthcareParty | undefined, string>({
      async queryFn(id, { getState }) {
        const practitionerApi = (await cardinalApi(getState))?.healthcareParty
        return guard([practitionerApi], async () => practitionerApi!.getHealthcareParty(id))
      },
    }),
  }),
})
```

To add a new domain API:
1. Create a new file under `src/core/api/`.
2. Pick the right SDK namespace (`patient`, `healthElement`, `contact`, `document`, `message`, `agenda`, …) on `CardinalSdk` (= `CardinalApis`).
3. Use `queryFn` (not `query`) — wrap each call in `guard(...)` to short-circuit on missing inputs and convert thrown errors to `FetchBaseQueryError`.
4. Register the new `reducerPath` in `src/core/reducer.ts` (`combineReducers`) and `.middleware` in `src/core/store.ts`.
5. UI consumes via the auto-generated `useGet…Query` / `useUpdate…Mutation` hooks.

Never re-instantiate `CardinalSdk` outside `auth.api.ts`. Always go through `cardinalApi(getState)` → the cached instance.

## 10. Implemented vs. to-build

### Already implemented (the starter foundation)

- SDK init for both flows: `CardinalBaseSdk.initializeWithProcess` + `.toFullSdk`, and `CardinalBaseSdk.initialize` + `.toFullSdk`.
- Persisted long-lived token via `api.user.getToken(..., 'rememberMe', { tokenValidity })`.
- Full Kerberus captcha integration with progress UI.
- Key generation when a data owner has none, with a recovery-key banner.
- Recovery-key prompt on returning login when keys are missing on the device.
- Public/authenticated routing via two `<Outlet>`-based layouts.
- Single example RTK Query (`practitionerApi`) showing the SDK + `guard` pattern.
- Antd theming (`src/style/antd/antdTheme.ts`); LESS compiled natively by Vite at dev/build time.

### You'll need to build for a real product

- **Multi-group / environment selection UI.** The template auto-picks the first group in `groupSelector` and warns to console.
- **Parent-HCP key bootstrap** if your product has parent organisations whose keys need recovery alongside the user's own.
- **SMS authentication.** Only the email path is wired. The SDK supports `AuthenticationProcessTelecomType.Mobile` and `VITE_SMS_AUTHENTICATION_PROCESS_ID`.
- **Domain features.** `practitionerApi.ts` is the only example. Real apps need `Patient`, `HealthElement`, `Contact`/`Service`, `Document`, `Message`, `Agenda`/`CalendarItem`, etc.
- **Internationalisation.** No i18n library is wired; you can easily add `react-i18next`.
- **Logout UX.** The `logout` thunk exists but no Header button is rendered.
- **Error / notification surface.** Errors are `console.error`'d. Wire a toast library (Antd's `notification` API works fine).
- **Token refresh / expiry UX.** Long-lived token expires after 30 days; nothing reminds the user. Either implement silent refresh (re-call `user.getToken` periodically) or surface a re-login banner.
- **Account self-service.** No flows for changing email, rotating recovery key, or revoking sessions.
- **Test setup.** Only Vitest is wired with no real tests yet. Add component tests, an integration suite, and Playwright/Cypress for the Kerberus + email-code flow.
- **CI.** `.github/workflows/` only has `licenses-report.yml`. Add typecheck/build/test on PR.

## 11. Conventions

- **Code style:** ESLint + Prettier from `eslint.config.js` and `.prettierrc`. No semicolons, single quotes, trailing commas, `printWidth: 180`, 2-space indent.
- **Component layout:** `Component/index.tsx` with a sibling `index.less`. Vite compiles LESS natively — no separate watcher and no committed `.css` files.
- **Typed Redux:** import `useAppDispatch` / `useAppSelector` from `core/hooks.ts`, never the raw `react-redux` versions.
- **SDK access:** always go through `cardinalApi(getState)` → `apiCache`. Never re-instantiate `CardinalSdk` outside `auth.api.ts`.
- **Adding new state:** if it's serializable and survives reload (e.g. user preferences), put it in the `app` slice and add to the `whitelist` in `core/app/index.ts`. Otherwise add it to the `cardinalApi` slice.

## 12. External docs and reference repos

- Cardinal SDK docs: https://docs.icure.com/
- Cockpit (admin portal where you obtain `applicationId`, `specId`, `processId`, etc.): https://cockpit.icure.cloud/
- Cardinal SDK on npm: https://www.npmjs.com/package/@icure/cardinal-sdk
