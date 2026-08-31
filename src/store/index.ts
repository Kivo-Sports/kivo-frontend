/**
 * @file index.ts
 * @description Configura a store global do Redux.
 *
 * Mantive a store bem enxuta por enquanto (auth + baseApi), porque prefiro
 * adicionar slices conforme a necessidade real aparece nas telas.
 *
 * @author Kivo Sports - TCC
 */

// - Redux Toolkit
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

// - API
import { baseApi } from "./api/baseApi";

// - Slices
import authReducer from "./slices/authSlice";
import registrationReducer from "./slices/registrationSlice";

export const store = configureStore({
  reducer: {
    // optei por deixar o nome do slice explicito para facilitar debug no devtools
    auth: authReducer,
    registration: registrationReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  // se um dia ficar pesado, da pra revisar serializableCheck aqui
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

setupListeners(store.dispatch);
