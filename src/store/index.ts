import { configureStore } from '@reduxjs/toolkit';
import visitsReducer from './slices/visitsSlice';
import sitesReducer from './slices/sitesSlice';
import technicianReducer from './slices/technicianSlice';
import checkinReducer from './slices/checkinSlice';

export const store = configureStore({
  reducer: {
    visits: visitsReducer,
    sites: sitesReducer,
    technician: technicianReducer,
    checkin: checkinReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
