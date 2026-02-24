import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CheckIn } from '../../types/models';

interface CheckInState {
  history: CheckIn[];
  pendingVisitId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: CheckInState = {
  history: [],
  pendingVisitId: null,
  loading: false,
  error: null,
};

const checkinSlice = createSlice({
  name: 'checkin',
  initialState,
  reducers: {
    addCheckIn: (state, action: PayloadAction<CheckIn>) => {
      state.history.push(action.payload);
      state.pendingVisitId = null;
      state.error = null;
    },
    setPendingVisitId: (state, action: PayloadAction<string | null>) => {
      state.pendingVisitId = action.payload;
    },
    setCheckInLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setCheckInError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { addCheckIn, setPendingVisitId, setCheckInLoading, setCheckInError } =
  checkinSlice.actions;
export default checkinSlice.reducer;
