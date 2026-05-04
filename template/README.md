![Cardinal logo](./src/assets/cardinal_logo.svg)

<h1>My Cardinal-powered e-health React app</h1>

This project was bootstrapped with [Create React App](https://create-react-app.dev/) using the [`@icure/cra-template-typescript-cardinal-sdk`](https://www.npmjs.com/package/@icure/cra-template-typescript-cardinal-sdk) template. It comes with a working email + one-time-code authentication flow against the [Cardinal SDK](https://docs.icure.com/), plus the Redux/storage plumbing you'd otherwise spend a day wiring up yourself.

For the architectural tour (auth state machine, encryption model, where to add new features), see [`ARCHITECTURE.md`](./ARCHITECTURE.md).


## 1. Configure your environment

Copy `.env.default` to `.env` and fill in the four values:

```
cp .env.default .env
```

- **REACT_APP_APPLICATION_ID** — your Cardinal project / application identifier.
- **REACT_APP_EXTERNAL_SERVICES_SPEC_ID** — identifier the message gateway uses to dispatch the one-time-code email.
- **REACT_APP_EMAIL_AUTHENTICATION_PROCESS_ID** (and/or **REACT_APP_SMS_AUTHENTICATION_PROCESS_ID**) — identifies which authentication process template to run.
- **REACT_APP_PARENT_ORGANISATION_ID** — the parent healthcare-party id new users will be attached to.

You obtain all four from the [Cockpit Portal](https://cockpit.icure.cloud/). The [Cardinal Quick Start](https://docs.icure.com/how-to/index) walks you through it.

> **Without these values, authentication will not complete.** The app will load but you will not be able to log in or register.


## 2. Run the app

```
yarn install
yarn start
```

The dev server starts at <http://localhost:3000>. The `start` script runs `react-scripts start` and `less-watch-compiler` concurrently, so any change to a `.less` file recompiles to its sibling `.css` while you work.

Other scripts:

| Command | What it does |
|---|---|
| `yarn start` | Run the dev server (CRA + Less watcher). |
| `yarn build` | Produce an optimized production bundle in `build/`. |
| `yarn test` | Run Jest in watch mode (CRA default). `yarn test --watchAll=false MyComponent` runs once. |
| `yarn eject` | Eject CRA configuration (one-way, only if you need to customise webpack). |


## 3. Requirements

- [Node.js](https://nodejs.org/en) 16 or newer.
- [Yarn](https://yarnpkg.com/getting-started/install) (the project pins `yarn@4.0.1` via `packageManager`).


## 4. What you get out of the box

- **Authentication** — both email-link signup and returning-user login via the Cardinal SDK 2.x two-stage init (`CardinalBaseSdk` → `.toFullSdk(...)`). See [`src/core/services/auth.api.ts`](./src/core/services/auth.api.ts).
- **Persisted "remember me"** — a long-lived token (30 days) stored in IndexedDB via `redux-persist` + `localForage`, replayed automatically on reload through [`src/layout/Layout`](./src/layout/Layout/index.tsx).
- **Captcha integration** — Kerberus proof-of-work resolved client-side (no extra site key required). See [`src/components/authentication/KerberusCaptcha`](./src/components/authentication/KerberusCaptcha/index.tsx).
- **End-to-end encryption plumbing** — `TemplateCryptoStrategies` generates an RSA keypair on first signup, surfaces the resulting recovery key via [`NewRecoveryKeyBanner`](./src/components/authentication/NewRecoveryKeyBanner/index.tsx), and prompts for it on returning login through [`RecoveryKeyPrompt`](./src/components/authentication/RecoveryKeyPrompt/index.tsx).
- **Routing & gating** — public/authenticated layouts in [`src/layout/`](./src/layout/) bracket route groups; the only authenticated page so far is `/home` ([`DashboardPage`](./src/pages/DashboardPage/index.tsx)).
- **One example domain query** — [`src/core/api/practitionerApi.ts`](./src/core/api/practitionerApi.ts) shows the RTK Query + `queryFn` + `guard()` pattern to follow for every other Cardinal API.


## 5. Stack

- [React 18](https://react.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/) for state and async thunks
- [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) for SDK-backed queries
- [redux-persist](https://github.com/rt2zz/redux-persist) + [localForage](https://github.com/localForage/localForage) for the credential persistence layer
- [Ant Design](https://ant.design/) for UI
- [React Router 6](https://reactrouter.com/) for routing
- [Less](https://lesscss.org/) compiled to CSS via `less-watch-compiler`
- The Cardinal SDK ([`@icure/cardinal-sdk`](https://www.npmjs.com/package/@icure/cardinal-sdk)) for everything Cardinal-related, including its built-in Kerberus captcha

You can swap any of these — none of the Cardinal integration is locked to a specific UI/state-management library.


## 6. Where to go from here

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — the rationale for each layer, the auth state machine, what's implemented vs. what you still have to build (multi-group selector, SMS auth, domain APIs, logout UX, …).
- [Cardinal SDK docs](https://docs.icure.com/) — full API reference and how-tos.
- [Cardinal How-Tos](https://docs.icure.com/how-to/index) — recipe-style guides for common tasks (creating patients, adding health elements, sharing data, etc.).


## 7. Help

- [Cardinal website](https://cardinalsdk.com/en)
- [Help Centre](https://icure.atlassian.net/servicedesk/customer/user/login?destination=portals)
- [Create React App docs](https://create-react-app.dev/) for anything CRA-specific (testing, environment variables, deployment, …).
