import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Unsubscribe } from 'redux'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'

import {
  AuthenticationMethod,
  AuthenticationProcessTelecomType,
  BasicSdkOptions,
  BasicToFullSdkOptions,
  CaptchaOptions,
  CardinalApis,
  CardinalBaseSdk,
  CardinalSdk,
  CryptoStrategies,
  DataOwnerWithType,
  KeyPairRecoverer,
  KeypairFingerprintV1String,
  RecoveryDataKey,
  RecoveryDataUseFailureReason,
  RecoveryKeyOptions,
  RecoveryKeySize,
  RecoveryResult,
  Solution,
  SpkiHexString,
  StorageFacade,
  User,
  UserGroup,
  XCryptoService,
  XRsaKeypair,
  spkiHexKeyToFingerprintV1,
} from '@icure/cardinal-sdk'

import { revertAll, setSavedCredentials } from '../app'
import { store } from '../store'

const ICURE_CLOUD_URL = 'https://api.icure.cloud'
const MSG_GW_URL = 'https://msg-gw.icure.cloud'
const REMEMBER_ME_TOKEN_VALIDITY_SECONDS = 30 * 24 * 3600

const apiCache: { [key: string]: CardinalSdk } = {}

/**
 * `CryptoStrategies` controls how the SDK handles RSA key generation and recovery for end-to-end
 * encrypted data. The template's implementation:
 * - Generates a new key on first login when the data owner has none.
 * - On new-key creation, generates a recovery key and dispatches it to Redux so the UI can
 *   show it once. The user is responsible for storing it; without it, data on this device
 *   cannot be recovered after switching devices.
 * - On returning login from a new device, prompts the user via Redux state for a stored
 *   recovery key and tries to use it.
 *
 * For a richer reference (parent-HCP key bootstrap, fine-grained verification flows), see
 * `../retinobridge/src/core/services/auth.api.ts`.
 */
export class TemplateCryptoStrategies extends CryptoStrategies {
  generateNewKeyForDataOwner(self: DataOwnerWithType, _cryptoPrimitives: XCryptoService): Promise<boolean | XRsaKeypair | 'keyless' | 'parent-delegator'> {
    const dataOwner = self.dataOwner
    const hasNoKey = dataOwner.publicKeysForOaepWithSha256.length === 0 && Object.keys(dataOwner.aesExchangeKeys).length === 0 && dataOwner.publicKey == null
    return Promise.resolve(hasNoKey)
  }

  async notifyNewKeyCreated(apis: CardinalApis, _key: XRsaKeypair, _cryptoPrimitives: XCryptoService): Promise<void> {
    const recoveryKey = await apis.recovery.createRecoveryInfoForAvailableKeyPairs({
      recoveryKeyOptions: new RecoveryKeyOptions.Generate({ recoveryKeySize: RecoveryKeySize.Bytes32 }),
    })

    const formattedKey = recoveryKey
      .asBase32()
      .match(/.{1,4}/g)
      ?.join('-')

    if (formattedKey) {
      store.dispatch(setNewlyCreatedRecoveryKey({ recoveryKey: formattedKey }))
    }
  }

  async recoverAndVerifySelfHierarchyKeys(
    keysData: Array<CryptoStrategies.KeyDataRecoveryRequest>,
    _cryptoPrimitives: XCryptoService,
    keyPairRecoverer: KeyPairRecoverer,
  ): Promise<{ [dataOwnerId: string]: CryptoStrategies.RecoveredKeyData }> {
    const aggregate: { [dataOwnerId: string]: { [pub: SpkiHexString]: XRsaKeypair } } = {}

    const stillMissing = keysData.some((kd) => kd.unavailableKeys.length > 0)
    if (!stillMissing) {
      return this.buildRecoveryResult(keysData, aggregate)
    }

    const reasonCount = Math.max(
      1,
      keysData.reduce((sum, kd) => sum + kd.unavailableKeys.length, 0),
    )
    const reasons = Array.from({ length: reasonCount }, () => RecoveryDataUseFailureReason.Missing)
    const recoveryKeys = await this.promptUserForRecoveryKeys(reasons)

    if (recoveryKeys?.length) {
      await this.tryRecoverKeys(recoveryKeys, keyPairRecoverer, aggregate)
    }

    return this.buildRecoveryResult(keysData, aggregate)
  }

  private async tryRecoverKeys(
    recoveryKeys: string[],
    keyPairRecoverer: KeyPairRecoverer,
    aggregate: { [dataOwnerId: string]: { [pub: SpkiHexString]: XRsaKeypair } },
  ): Promise<void> {
    for (const rk of recoveryKeys) {
      let decoded: RecoveryDataKey | undefined
      try {
        decoded = RecoveryDataKey.fromBase32(rk)
      } catch (e) {
        console.warn('Invalid recovery key, skipping:', e)
        continue
      }

      const res = await keyPairRecoverer.recoverWithRecoveryKey(decoded, false)
      if (res instanceof RecoveryResult.Success) {
        const data = res.data
        for (const dataOwnerId of Object.keys(data)) {
          aggregate[dataOwnerId] = aggregate[dataOwnerId] ?? {}
          const perOwner = data[dataOwnerId]
          for (const pub of Object.keys(perOwner)) {
            aggregate[dataOwnerId][pub as SpkiHexString] = perOwner[pub as SpkiHexString]
          }
        }
      }
    }
  }

  private buildRecoveryResult(
    keysData: Array<CryptoStrategies.KeyDataRecoveryRequest>,
    aggregate: { [dataOwnerId: string]: { [pub: SpkiHexString]: XRsaKeypair } },
  ): { [dataOwnerId: string]: CryptoStrategies.RecoveredKeyData } {
    const result: { [dataOwnerId: string]: CryptoStrategies.RecoveredKeyData } = {}
    for (const recoveryRequest of keysData) {
      const dataOwnerId = recoveryRequest.dataOwnerDetails.dataOwner.id
      const perOwnerRecovered = aggregate[dataOwnerId]

      const recoveredForThisOwner: { [fp: KeypairFingerprintV1String]: XRsaKeypair } = {}
      if (perOwnerRecovered) {
        for (const unavailable of recoveryRequest.unavailableKeys) {
          const recoveredKey = perOwnerRecovered[unavailable.publicKey]
          if (recoveredKey) {
            recoveredForThisOwner[spkiHexKeyToFingerprintV1(unavailable.publicKey) as KeypairFingerprintV1String] = recoveredKey
          }
        }
      }

      result[dataOwnerId] = {
        recoveredKeys: recoveredForThisOwner,
        keyAuthenticity: {},
      }
    }
    return result
  }

  // Subscribe to the store and resolve once the user submits keys (via setRecoveryKeys) or
  // dismisses the prompt (via clearRecoveryKeyRequest). This is the bridge between the SDK's
  // async `recoverAndVerifySelfHierarchyKeys` callback and the React UI.
  private async promptUserForRecoveryKeys(reasons: RecoveryDataUseFailureReason[]): Promise<string[] | undefined> {
    const promise = new Promise<string[] | undefined>((resolve) => {
      // eslint-disable-next-line prefer-const
      let unsubscribe: Unsubscribe | undefined
      const handleChange = () => {
        const {
          cardinalApi: { recoveryKeys, recoveryKeyRequest },
        } = store.getState()
        if (!recoveryKeys?.length) {
          if (!recoveryKeyRequest) {
            resolve(undefined)
            unsubscribe?.()
          }
          return
        }
        const normalized = recoveryKeys.map((k) => k.replace(/-/g, '').replace(/0/g, 'O').replace(/1/g, 'I').replace(/8/g, 'B'))
        resolve(normalized)
        unsubscribe?.()
      }
      unsubscribe = store.subscribe(handleChange)
    })

    store.dispatch(askForRecoveryKey({ reasons: reasons.map((r) => r.toString()) }))
    return promise
  }
}

const groupSelector = (availableGroups: Array<UserGroup>): Promise<string> => {
  if (availableGroups.length > 1) {
    console.warn(`User belongs to ${availableGroups.length} groups; auto-selecting the first. See ../retinobridge/src/core/services/auth.api.ts for an env-selection UI.`)
  }
  const groupId = availableGroups[0]?.groupId
  return Promise.resolve(groupId ?? '')
}

const baseSdkOptions = (): BasicSdkOptions => ({ groupSelector })

const toFullSdkOptions = (): BasicToFullSdkOptions => ({
  useHierarchicalDataOwners: false,
  cryptoStrategies: new TemplateCryptoStrategies(),
})

export interface CardinalApiState {
  email?: string
  shortToken?: string
  user?: User
  authProcess?: CardinalBaseSdk.BaseAuthenticationWithProcessStep
  online: boolean
  invalidEmail: boolean
  invalidToken: boolean
  waitingForToken: boolean
  firstName?: string
  lastName?: string
  dateOfBirth?: number
  mobilePhone?: string
  loginProcessStarted: boolean
  newlyCreatedRecoveryKey?: string
  recoveryKeyRequest?: { reasons: string[] }
  recoveryKeys?: string[]
}

const initialState: CardinalApiState = {
  email: undefined,
  shortToken: undefined,
  user: undefined,
  authProcess: undefined,
  online: false,
  invalidEmail: false,
  invalidToken: false,
  waitingForToken: false,
  firstName: undefined,
  lastName: undefined,
  dateOfBirth: undefined,
  mobilePhone: undefined,
  loginProcessStarted: false,
  newlyCreatedRecoveryKey: undefined,
  recoveryKeyRequest: undefined,
  recoveryKeys: undefined,
}

function getError(e: Error): FetchBaseQueryError {
  return { status: 'CUSTOM_ERROR', error: e.message, data: undefined }
}

export const guard = async <T>(guardedInputs: unknown[], lambda: () => Promise<T>): Promise<{ error: FetchBaseQueryError } | { data: T | undefined }> => {
  if (guardedInputs.some((x) => !x)) {
    return { data: undefined }
  }
  try {
    const res = await lambda()
    const curate = (result: T): T => {
      if (result === null || result === undefined) {
        return null as T
      } else if (Array.isArray(result)) {
        return result.map(curate) as T
      } else {
        return result as T
      }
    }
    return { data: curate(res) }
  } catch (e) {
    return { error: getError(e as Error) }
  }
}

export const getApiFromState = async (getState: () => CardinalApiState | { cardinalApi: CardinalApiState } | undefined): Promise<CardinalSdk | undefined> => {
  const state = getState()
  if (!state) {
    throw new Error('No state found')
  }

  const slice = 'cardinalApi' in state ? state.cardinalApi : state
  const { user } = slice
  if (!user) {
    return undefined
  }

  return apiCache[`${user.groupId}/${user.id}`] as CardinalSdk
}

export const cardinalApi = async (getState: () => unknown) => {
  const state = getState() as { cardinalApi: CardinalApiState }
  return await getApiFromState(() => state)
}

const saveLongLivedTokenInLocalStorageIfNeeded = async (api: CardinalSdk, user: User, dispatch: (v: unknown) => void) => {
  try {
    const newToken = await api.user.getToken(user.id, 'rememberMe', { tokenValidity: REMEMBER_ME_TOKEN_VALIDITY_SECONDS })
    dispatch(
      setSavedCredentials({
        login: `${user.groupId}/${user.id}`,
        token: newToken,
        tokenTimestamp: +Date.now(),
      }),
    )
  } catch (e) {
    console.error('Could not save long-lived token in local storage', e)
  }
}

export const startAuthentication = createAsyncThunk('cardinalApi/startAuthentication', async (_payload: { captchaSolution: Solution }, { getState, dispatch }) => {
  const {
    cardinalApi: { email, firstName, lastName },
  } = getState() as { cardinalApi: CardinalApiState }
  dispatch(setLoginProcessStarted(true))

  if (!email) {
    throw new Error('The email was not found')
  }

  try {
    const authenticationStep = await CardinalBaseSdk.initializeWithProcess(
      import.meta.env.VITE_PROJECT_ID,
      ICURE_CLOUD_URL,
      MSG_GW_URL,
      import.meta.env.VITE_EXTERNAL_SERVICES_SPEC_ID!,
      import.meta.env.VITE_EMAIL_AUTHENTICATION_PROCESS_ID!,
      AuthenticationProcessTelecomType.Email,
      email,
      new CaptchaOptions.Kerberus.Computed({ solution: _payload.captchaSolution }),
      { firstName, lastName },
      baseSdkOptions(),
    )

    return authenticationStep
  } catch (e) {
    console.error(`Couldn't start authentication: ${e}`)
    throw e
  } finally {
    dispatch(setLoginProcessStarted(false))
  }
})

export const completeAuthentication = createAsyncThunk('cardinalApi/completeAuthentication', async (_payload, { getState, dispatch }) => {
  const {
    cardinalApi: { authProcess, shortToken },
  } = getState() as { cardinalApi: CardinalApiState }
  dispatch(setLoginProcessStarted(true))

  if (!authProcess) {
    dispatch(setLoginProcessStarted(false))
    throw new Error('No authProcess provided')
  }

  if (!shortToken) {
    dispatch(setLoginProcessStarted(false))
    throw new Error('No token provided')
  }

  try {
    const baseSdk = await authProcess.completeAuthentication(shortToken)
    const api = await baseSdk.toFullSdk(StorageFacade.usingBrowserLocalStorage(), toFullSdkOptions())
    const user = await api.user.getCurrentUser()

    apiCache[`${user.groupId}/${user.id}`] = api
    await saveLongLivedTokenInLocalStorageIfNeeded(api, user, dispatch)

    return new User(user)
  } catch (e) {
    console.error(`Couldn't complete authentication: ${e}`)
    throw e
  } finally {
    dispatch(setLoginProcessStarted(false))
  }
})

export const login = createAsyncThunk('cardinalApi/login', async (_, { getState, dispatch }) => {
  const {
    cardinalApi: { email, shortToken },
  } = getState() as { cardinalApi: CardinalApiState }
  dispatch(setLoginProcessStarted(true))

  if (!email) {
    dispatch(setLoginProcessStarted(false))
    throw new Error('No email provided')
  }

  if (!shortToken) {
    dispatch(setLoginProcessStarted(false))
    throw new Error('No token provided')
  }

  try {
    const baseSdk = await CardinalBaseSdk.initialize(
      import.meta.env.VITE_PROJECT_ID,
      ICURE_CLOUD_URL,
      new AuthenticationMethod.UsingCredentials.UsernamePassword(email, shortToken),
      baseSdkOptions(),
    )

    const api = await baseSdk.toFullSdk(StorageFacade.usingBrowserLocalStorage(), toFullSdkOptions())
    const user = await api.user.getCurrentUser()

    apiCache[`${user.groupId}/${user.id}`] = api

    return new User(user)
  } catch (e) {
    console.error(`Couldn't login: ${e}`)
    throw e
  } finally {
    dispatch(setLoginProcessStarted(false))
  }
})

export const logout = createAsyncThunk('cardinalApi/logout', async (_payload, { dispatch }) => {
  dispatch(revertAll())
  dispatch(resetCredentials())
})

export const api = createSlice({
  name: 'cardinalApi',
  initialState,
  reducers: {
    setRegistrationInformation: (
      state,
      {
        payload: { firstName, lastName, email },
      }: PayloadAction<{
        firstName: string
        lastName: string
        email: string
      }>,
    ) => {
      state.firstName = firstName
      state.lastName = lastName
      state.email = email
    },
    setToken: (state, { payload: { token } }: PayloadAction<{ token: string }>) => {
      state.shortToken = token
      state.invalidToken = false
    },
    setEmail: (state, { payload: { email } }: PayloadAction<{ email: string }>) => {
      state.email = email
      state.invalidEmail = false
    },
    setUser: (state, { payload: { user } }: PayloadAction<{ user: User }>) => {
      state.user = user
    },
    resetCredentials: (state) => {
      state.online = false
    },
    setLoginProcessStarted(state, { payload: status }: PayloadAction<boolean>) {
      state.loginProcessStarted = status
    },
    setWaitingForToken(state, { payload: status }: PayloadAction<boolean>) {
      state.waitingForToken = status
    },
    setNewlyCreatedRecoveryKey(state, { payload: { recoveryKey } }: PayloadAction<{ recoveryKey: string | undefined }>) {
      state.newlyCreatedRecoveryKey = recoveryKey
    },
    askForRecoveryKey(state, { payload }: PayloadAction<{ reasons: string[] }>) {
      state.recoveryKeyRequest = payload
      state.recoveryKeys = undefined
    },
    setRecoveryKeys(state, { payload }: PayloadAction<{ recoveryKeys: string[] }>) {
      state.recoveryKeys = payload.recoveryKeys
      state.recoveryKeyRequest = undefined
    },
    clearRecoveryKeyRequest(state) {
      state.recoveryKeyRequest = undefined
      state.recoveryKeys = undefined
    },
  },
  extraReducers: (builder) => {
    builder.addCase(startAuthentication.fulfilled, (state, { payload: authProcess }) => {
      state.authProcess = authProcess
      state.waitingForToken = true
    })
    builder.addCase(startAuthentication.rejected, (state) => {
      state.invalidEmail = true
    })
    builder.addCase(completeAuthentication.fulfilled, (state, { payload: user }) => {
      state.user = user as User
      state.online = true
      state.waitingForToken = false
    })
    builder.addCase(completeAuthentication.rejected, (state) => {
      state.invalidToken = true
    })
    builder.addCase(login.fulfilled, (state, { payload: user }) => {
      state.user = user as User
      state.online = true
    })
    builder.addCase(login.rejected, (state) => {
      state.invalidToken = true
      state.online = false
    })
  },
})

export const {
  setRegistrationInformation,
  setToken,
  setEmail,
  setUser,
  resetCredentials,
  setLoginProcessStarted,
  setWaitingForToken,
  setNewlyCreatedRecoveryKey,
  askForRecoveryKey,
  setRecoveryKeys,
  clearRecoveryKeyRequest,
} = api.actions
