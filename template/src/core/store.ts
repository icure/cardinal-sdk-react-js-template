import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit'
import { persistStore } from 'redux-persist'
import { persistedReducer } from './reducer'
import thunk from 'redux-thunk'
import { practitionerApiRtk } from './api/practitionerApi'

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }).concat(
      practitionerApiRtk.middleware,
      thunk,
      // Add your own middleware here. For example, you can add a logger:
    ),
})

export const persistor = persistStore(store)

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>
