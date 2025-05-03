import { configureStore } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import {
  getClase,
  getAni,
  getMaterii,
  getProfesori,
  getSettigs,
  getAnunturi,
} from "./actions";
const initialState = {
  clase: [],
  ani: [],
  session: {},
  materii: [],
  anunturi: [],
  profesori: [],
  user: null,
  settings: null,
  loading: false,
  chatId: null,
};

export const testSlice = createSlice({
  name: "database",
  initialState,
  reducers: {
    GET_CLASE: (state, action) => ({
      ...state,
      clase: action.payload,
    }),
    GET_TEACHER: (state, action) => ({
      ...state,
      profesori: action.payload,
    }),
    CHANGE_USER: (state, action) => ({
      ...state,
      chatId:
        state.user.uid > action.payload.uid
          ? state.user.uid + action.payload.uid
          : action.payload.uid + state.user.uid,
    }),
    GET_LOADING: (state, action) => ({
      ...state,
      loading: action.payload,
    }),
    ADD_MATERIE: (state, action) => ({
      ...state,
      materii: action.payload,
    }),
    GET_ANI: (state, action) => ({
      ...state,
      ani: action.payload,
    }),
    GET_USER: (state, action) => ({
      ...state,
      user: action.payload,
    }),
    SESSION: (state, action) => ({
      ...state,
      session: action.payload,
    }),
    GET_SETTINGS: (state, action) => {
      return {
        ...state,
        settings: action.payload,
      };
    },
  },
  extraReducers: {
    [getMaterii.fulfilled]: (state, { payload }) => {
      if (payload?.payload?.array?.length > 0) {
        state.materii = [...payload?.payload?.array];
      }
      state.loading = false;
    },
    [getAnunturi.fulfilled]: (state, { payload }) => {
      if (payload?.payload?.array?.length > 0) {
        state.anunturi = [...payload?.payload?.array];
      }
      state.loading = false;
    },
    [getMaterii.pending]: (state, { payload }) => {
      state.loading = true;
    },
    [getProfesori.fulfilled]: (state, { payload }) => {
      if (payload?.payload?.array?.length > 0) {
        state.profesori = [...payload?.payload?.array];
      }
      state.loading = false;
    },
    [getProfesori.pending]: (state, { payload }) => {
      state.loading = true;
    },
    [getClase.fulfilled]: (state, { payload }) => {
      if (payload?.payload?.array?.length > 0) {
        state.clase = [...payload?.payload?.array];
      }
      state.loading = false;
    },
    [getClase.pending]: (state, { payload }) => {
      state.loading = true;
    },
    [getAni.fulfilled]: (state, { payload }) => {
      if (payload?.payload?.array?.length > 0) {
        state.ani = [...payload?.payload?.array];
      }
      state.loading = false;
    },
    [getSettigs.fulfilled]: (state, { payload }) => {
      if (payload?.payload?.settings) {
        state.settings = payload?.payload?.settings;
      }
      state.loading = false;
    },
    [getAni.pending]: (state, { payload }) => {
      state.loading = true;
    },
    [getAnunturi.pending]: (state, { payload }) => {
      state.loading = true;
    },
    [getSettigs.pending]: (state, { payload }) => {
      state.loading = true;
    },
  },
});
export const store = configureStore({
  reducer: testSlice.reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
