![Cardinal logo](./src/assets/cardinal_logo.svg)

<h1>My Cardinal-powered e-health React app</h1>

A Vite + React + TypeScript starter for the [Cardinal SDK](https://docs.icure.com/). It comes with a working email + one-time-code authentication flow, plus the Redux/storage plumbing you'd otherwise spend a day wiring up yourself.

For the architectural tour (auth state machine, encryption model, where to add new features), see [`ARCHITECTURE.md`](./ARCHITECTURE.md).


## 1. Scaffold a new project

Pick whichever flow fits your workflow:

### Option A — "Use this template" (GitHub)

Click **Use this template → Create a new repository** at the top of [the repository page](https://github.com/icure/cardinal-sdk-react-js-template). GitHub creates a fresh repo under your account with a single initial commit. Then:

```
git clone git@github.com:<you>/<your-new-repo>.git my-health-tech-app
cd my-health-tech-app
yarn install
```

After cloning, update `package.json#name` (and `#description`) to match your new project — GitHub templates don't substitute these.

### Option B — `degit` (no GitHub repo on your side)

```
npx degit icure/cardinal-sdk-react-js-template my-health-tech-app
cd my-health-tech-app
yarn install
```

`degit` makes a fresh local checkout with no git history. Initialise your own:

```
git init && git add . && git commit -m "Initial commit"
```


## 2. Configure your environment

Copy `.env.default` to `.env` and fill in the values:

```
cp .env.default .env
```

- **VITE_PROJECT_ID** — your Cardinal project / application identifier.
- **VITE_EXTERNAL_SERVICES_SPEC_ID** — identifier the message gateway uses to dispatch the one-time-code email.
- **VITE_EMAIL_AUTHENTICATION_PROCESS_ID** (and/or **VITE_SMS_AUTHENTICATION_PROCESS_ID**) — identifies which authentication process template to run.
- **VITE_PARENT_ORGANISATION_ID** — the parent healthcare-party id new users will be attached to.

You obtain all of these from the [Cockpit Portal](https://cockpit.icure.cloud/). The [Cardinal Quick Start](https://docs.icure.com/how-to/index) walks you through it.

> **Without these values, authentication will not complete.** The app will load but you will not be able to log in or register.


## 3. Run the app

```
yarn dev
```

The dev server starts at <http://localhost:5173>. Vite handles HMR and Less compilation natively — edit a `.less` file and it hot-reloads.

Other scripts:

| Command        | What it does                                               |
|----------------|------------------------------------------------------------|
| `yarn dev`     | Run the Vite dev server with HMR.                          |
| `yarn build`   | Produce an optimized production bundle in `build/`.        |
| `yarn preview` | Serve the built bundle locally (smoke-test before deploy). |
| `yarn lint`    | Run ESLint over `src/`.                                    |
| `yarn test`    | Run the Vitest suite.                                      |


## 4. Requirements

- [Node.js](https://nodejs.org/en) 20 or newer (24 recommended).
- [Yarn](https://yarnpkg.com/getting-started/install) (the project pins `yarn@4.0.1` via `packageManager`).


## 5. What you get out of the box

- **Authentication** — both email-link signup and returning-user login via the Cardinal SDK 2.x two-stage init (`CardinalBaseSdk` → `.toFullSdk(...)`). See [`src/core/services/auth.api.ts`](./src/core/services/auth.api.ts).
- **Persisted "remember me"** — a long-lived token (30 days) stored in IndexedDB via `redux-persist` + `localForage`, replayed automatically on reload through [`src/layout/Layout`](./src/layout/Layout/index.tsx).
- **Captcha integration** — Kerberus proof-of-work resolved client-side (no extra site key required). See [`src/components/authentication/KerberusCaptcha`](./src/components/authentication/KerberusCaptcha/index.tsx).
- **End-to-end encryption plumbing** — `TemplateCryptoStrategies` generates an RSA keypair on first signup, surfaces the resulting recovery key via [`NewRecoveryKeyBanner`](./src/components/authentication/NewRecoveryKeyBanner/index.tsx), and prompts for it on returning login through [`RecoveryKeyPrompt`](./src/components/authentication/RecoveryKeyPrompt/index.tsx).
- **Routing & gating** — public/authenticated layouts in [`src/layout/`](./src/layout/) bracket route groups; the only authenticated page so far is `/home` ([`DashboardPage`](./src/pages/DashboardPage/index.tsx)).
- **One example domain query** — [`src/core/api/practitionerApi.ts`](./src/core/api/practitionerApi.ts) shows the RTK Query + `queryFn` + `guard()` pattern to follow for every other Cardinal API.


## 6. Stack

- [Vite](https://vitejs.dev/) for dev server and bundling
- [React 19](https://react.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/) for state and async thunks
- [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) for SDK-backed queries
- [redux-persist](https://github.com/rt2zz/redux-persist) + [localForage](https://github.com/localForage/localForage) for the credential persistence layer
- [Ant Design 6](https://ant.design/) for UI
- [React Router 7](https://reactrouter.com/) for routing
- [Less](https://lesscss.org/), compiled by Vite natively
- [Vitest](https://vitest.dev/) for tests
- The Cardinal SDK ([`@icure/cardinal-sdk`](https://www.npmjs.com/package/@icure/cardinal-sdk)) for everything Cardinal-related, including its built-in Kerberus captcha

You can swap any of these — none of the Cardinal integration is locked to a specific UI/state-management library.


## 7. Where to go from here

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — the rationale for each layer, the auth state machine, what's implemented vs. what you still have to build (multi-group selector, SMS auth, domain APIs, logout UX, …).
- [Cardinal SDK docs](https://docs.icure.com/) — full API reference and how-tos.
- [Cardinal How-Tos](https://docs.icure.com/how-to/index) — recipe-style guides for common tasks (creating patients, adding health elements, sharing data, etc.).


## 8. Help

- [Cardinal website](https://cardinalsdk.com/en)
- [Help Centre](https://icure.atlassian.net/servicedesk/customer/user/login?destination=portals)
- [Vite docs](https://vitejs.dev/guide/) for anything Vite-specific (env vars, deployment, plugins, …).
