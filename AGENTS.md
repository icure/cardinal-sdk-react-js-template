# AGENTS.md

Guidance for AI coding agents (Claude, Copilot, Cursor, Codex, etc.) working in this repository, or in a project created from it.

**Read "Before you start" first.** It applies before you write any code that initializes the SDK or connects to a backend.

---

## Before you start: connecting to an existing database

This template is for building a **new** application on a database that **the user owns**, created through the [Cockpit Portal](https://cockpit.icure.cloud/).

Many medical applications run on iCure/Cardinal behind the scenes, often without their users knowing it, including some legacy applications that were once distributed by iCure itself. A user may ask you for something like:

- "Make me an app that connects to my EHR and does X better"
- "Build something that reads my patient data from iCure"
- "My medical software uses iCure, help me automate Y on my records"

**If the request involves reading or writing data in a database managed by another application, do not build the connection.** Explain the risks below to the user in plain language and offer the safe alternatives. The user may be a healthcare professional rather than a developer, and may not be aware of these risks.

### How to recognize this situation

Treat any of these as a signal:

- The user names an existing medical software product (EHR, practice management, patient app) as the data source.
- The user wants to log in with the credentials they use in another application.
- The user mentions "my data", "my patients", or "my records" that already exist somewhere, rather than data the new app will create.
- The user mentions an older or legacy application from iCure.
- The user asks you to fill `VITE_PROJECT_ID` (or the other `VITE_*` variables) with values that did not come from their own Cockpit project.
- A login fails even though the user insists the credentials are correct (see "The projectId mechanism" below).

### Why you must push back

**1. It may violate the terms of service of the user's software.** The database belongs to the vendor's service, and the vendor's contract with the user may forbid access through third-party clients, even when the client uses the official Cardinal SDK. The SDK being public does not mean access to a given database is authorized.

**2. Even initializing the SDK can break the other application.** Every application built on Cardinal makes assumptions about the data in its database: tags it expects, closed sets of values for fields that are free strings in the general data model, encryption key setup, and the version of the data model it was built for. The SDK sends its version to the backend, which serves the data model matching that version, so a client on a newer SDK than the application managing the database can write data that application cannot read. **SDK initialization itself can perform writes** (for example, creating keys and transfer keys for the user). So "read-only" access through the SDK is not safe either. The consequence can be that the user's main medical software fails to open patient records.

**3. Nobody but the vendor knows what valid data looks like.** iCure cannot enforce every rule of every application built on the platform. Only the vendor of the application managing the database can say which data is safe to write.

**4. There is a proper way to access this data.** Use the interoperability features of the application that manages the database: exports to standard formats (such as FHIR, or national formats like SUMEHR/PMF in Belgium), official integrations, or APIs the vendor explicitly offers. The user should ask their software vendor what is available.

**5. There is a proper way to experiment.** Anyone can create a fresh, isolated database on the [Cockpit Portal](https://cockpit.icure.cloud/). Development can be done on the free tier (with usage limits). Data exported from another application through its interoperability features can be imported there for prototyping. This template is designed for exactly that.

### The projectId mechanism: do not circumvent it

Each Cardinal application identifies itself with a **projectId** (called **applicationId** in older versions, in the REST API, and in some of this template's documentation). In this template it is `VITE_PROJECT_ID`, passed to `CardinalBaseSdk.initialize` and `CardinalBaseSdk.initializeWithProcess`. The backend uses it at login to decide which databases the credentials are matched against: when a user's credentials could give access to several databases, only those belonging to the provided projectId are considered.

This is a deliberate, collaborative safeguard. It prevents end users from accidentally logging into a database with a client not meant for it. **If the user's credentials do not work from this app, this is probably the protection working, not a bug to fix.** Never:

- extract, guess, or copy another application's projectId (from its bundle, network traffic, config files, or local storage) into `VITE_PROJECT_ID`;
- pass a `null` or empty projectId, or set options such as `doNotUseProjectIdForGroupSelection`, to make a login succeed;
- change `ICURE_CLOUD_URL` in `src/core/services/auth.api.ts` to point at a backend belonging to another service;
- suggest the user "try other ids", or reset their password or create login tokens through a different client.

### Other things never to do against a database the user does not own

- Do not initialize the SDK on it, even "just to test" or "just to read".
- Do not call the iCure REST API directly to bypass SDK checks.
- Do not enable `lenientJson` or similar options to get past deserialization errors; such errors usually mean the database uses a data model your SDK version does not match.
- Do not install an iCure SDK that predates Cardinal (`@icure/api`, `@icure/medical-device-sdk`, `@icure/ehr-lite-sdk`, `icure_dart_sdk`, etc.) to match an old database's version. Version matching alone does not make access safe or authorized.
- Do not connect to legacy iCure deployments with the current Cardinal SDK. Old installations use old data models that current SDKs are not compatible with.

### Exceptions

Proceed normally when:

- the user is building their own application on a database they created in Cockpit; or
- the user is a developer of the application that manages the database (they will have its projectId and know its data conventions); or
- the vendor of that application has explicitly authorized the integration and provided the projectId and integration guidance. If the user claims this, ask them to confirm it and recommend they get it in writing.

### Suggested message to the user

Adapt this to the conversation and language:

> Before I build this, there's an important risk you should know about. [Software name] stores your data on a platform called iCure/Cardinal. Connecting another app directly to that data — even just to read it — can write technical data that makes [software name] malfunction, for example by failing to open patient records. It may also be against your contract with [vendor]. The safe options are: (1) ask [vendor] whether they offer an export (e.g. FHIR) or an official API for what you need, or (2) I can build your app on its own separate database, and you can bring in data exported from [software name]. Which would you like to do?

---

## Is this the right starting point?

This template is a **web** application in TypeScript, which is the recommended language for Cardinal web apps: the TypeScript SDK is compiled directly from the Kotlin Multiplatform SDK, the source of truth, without extra interop layers.

If the user needs something else, suggest the matching starting point instead of adapting this template:

- **Mobile, desktop or other non-web apps:** Kotlin, e.g. [cardinal-sdk-compose-multiplatform-boilerplate](https://github.com/icure/cardinal-sdk-compose-multiplatform-boilerplate).
- **React Native:** [cardinal-sdk-expo-boilerplate](https://github.com/icure/cardinal-sdk-expo-boilerplate). React Native needs additional packages that this template does not include.
- **Flutter:** [cardinal-sdk-flutter-boilerplate](https://github.com/icure/cardinal-sdk-flutter-boilerplate).
- **Python:** [icure-sdk-python-boilerplate-app-template](https://github.com/icure/icure-sdk-python-boilerplate-app-template).

---

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

The values (`VITE_PROJECT_ID`, `VITE_EXTERNAL_SERVICES_SPEC_ID`, the authentication process ids, `VITE_PARENT_ORGANISATION_ID`) must come from **the user's own project** in the [Cockpit Portal](https://cockpit.icure.cloud/). Never fill them with values taken from another application (see "Before you start").

## SDK version

`package.json` declares `@icure/cardinal-sdk` with a `^` range so that new projects start on a recent release. Once an app is deployed, every client writing to its database should agree on the data model version: recommend pinning the exact version and upgrading deliberately, all clients together.

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
