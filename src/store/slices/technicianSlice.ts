import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Technician } from '../../types/models';
import technicianData from '../../data/technician.json';

const technicianInitial = technicianData as Technician;

interface TechnicianState {
  current: Technician | null;
  loading: boolean;
  error: string | null;
}

const initialState: TechnicianState = {
  current: technicianInitial,
  loading: false,
  error: null,
};

const technicianSlice = createSlice({
  name: 'technician',
  initialState,
  reducers: {
    setTechnician: (state, action: PayloadAction<Technician | null>) => {
      state.current = action.payload;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setTechnician, setLoading, setError } = technicianSlice.actions;
export default technicianSlice.reducer;
