import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Site } from '../../types/models';
import sitesData from '../../data/sites.json';

const sitesInitial = sitesData as Site[];

interface SitesState {
  items: Site[];
  loading: boolean;
  error: string | null;
}

const initialState: SitesState = {
  items: sitesInitial,
  loading: false,
  error: null,
};

const sitesSlice = createSlice({
  name: 'sites',
  initialState,
  reducers: {
    setSites: (state, action: PayloadAction<Site[]>) => {
      state.items = action.payload;
      state.error = null;
    },
    addSite: (state, action: PayloadAction<Site>) => {
      state.items.push(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setSites, addSite, setLoading, setError } = sitesSlice.actions;
export default sitesSlice.reducer;
