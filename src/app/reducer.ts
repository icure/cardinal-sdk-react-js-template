import { combineReducers } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import { api } from "../services/auth.api";
import { persistConfig, app } from "./config";

export const appReducer = combineReducers({
    app: app.reducer,
    auth: api.reducer
});

export const persistedReducer = persistReducer(persistConfig, appReducer);

export type AppState = ReturnType<typeof appReducer>;