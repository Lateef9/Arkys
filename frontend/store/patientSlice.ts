import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type PatientUiState = {
  selectedPatientId: string | null;
  selectedEventId: string | null;
};

const initialState: PatientUiState = {
  selectedPatientId: null,
  selectedEventId: null,
};

const patientSlice = createSlice({
  name: "patient",
  initialState,
  reducers: {
    setSelectedPatientId(state, action: PayloadAction<string | null>) {
      state.selectedPatientId = action.payload;
    },
    setSelectedEventId(state, action: PayloadAction<string | null>) {
      state.selectedEventId = action.payload;
    },
  },
});

export const { setSelectedPatientId, setSelectedEventId } = patientSlice.actions;
export default patientSlice.reducer;
