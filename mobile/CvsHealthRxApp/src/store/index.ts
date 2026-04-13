import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

type SessionState = { patientId: string | null; displayName: string | null };
const initial: SessionState = { patientId: null, displayName: null };

const sessionSlice = createSlice({
  name: 'session',
  initialState: initial,
  reducers: {
    setPatient(state, action: PayloadAction<SessionState>) {
      state.patientId = action.payload.patientId;
      state.displayName = action.payload.displayName;
    },
    clear() {
      return initial;
    },
  },
});

export const { setPatient, clear } = sessionSlice.actions;
export const store = configureStore({ reducer: { session: sessionSlice.reducer } });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
