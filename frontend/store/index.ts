import { configureStore } from "@reduxjs/toolkit";
import patientReducer from "./patientSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      patient: patientReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
