import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { Visit, FormFieldValue, Technician } from '../../types/models';
import visitsData from '../../data/visits.json';
import technicianData from '../../data/technician.json';
import type { RootState } from '../index';

const technicianId = (technicianData as Technician).id || undefined;

const visitsInitial = (visitsData as Omit<Visit, 'technicianId'>[]).map((v) => ({
  ...v,
  technicianId,
}));

interface VisitsState {
  items: Visit[];

  /** Form responses by visitId -> fieldId -> value */
  formData: {
    [visitId: string]: {
      [fieldId: string]: FormFieldValue;
    };
  };

  /**
   * Calendar event IDs created for each visit.
   * - visitId -> eventId (string)
   * - null means "not synced / unknown"
   */
  eventIdByVisitId: Record<string, string | null>;

  loading: boolean;
  error: string | null;
}

const initialState: VisitsState = {
  items: visitsInitial,
  formData: {},
  eventIdByVisitId: {},
  loading: false,
  error: null,
};

const visitsSlice = createSlice({
  name: 'visits',
  initialState,
  reducers: {
    setVisits: (state, action: PayloadAction<Visit[]>) => {
      state.items = action.payload;
      state.error = null;

      // Remove eventIds for visits that no longer exist
      const validIds = new Set(action.payload.map((v) => v.id));
      Object.keys(state.eventIdByVisitId).forEach((vid) => {
        if (!validIds.has(vid)) delete state.eventIdByVisitId[vid];
      });

      // Optional: remove formData for visits that no longer exist
      Object.keys(state.formData).forEach((vid) => {
        if (!validIds.has(vid)) delete state.formData[vid];
      });
    },

    addVisit: (state, action: PayloadAction<Visit>) => {
      state.items.push(action.payload);
    },

    updateVisit: (state, action: PayloadAction<{ id: string; updates: Partial<Visit> }>) => {
      const idx = state.items.findIndex((v) => v.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.updates };
      }
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    updateFieldResponse: (
      state,
      action: PayloadAction<{ visitId: string; fieldId: string; value: FormFieldValue }>
    ) => {
      const { visitId, fieldId, value } = action.payload;
      if (!state.formData[visitId]) state.formData[visitId] = {};
      state.formData[visitId][fieldId] = value;
    },

    setVisitResponses: (
      state,
      action: PayloadAction<{ visitId: string; responses: Record<string, FormFieldValue> }>
    ) => {
      const { visitId, responses } = action.payload;
      if (!state.formData[visitId]) state.formData[visitId] = {};
      state.formData[visitId] = { ...state.formData[visitId], ...responses };
    },

    /** Set a single visit -> calendar eventId */
    setVisitEventId: (
      state,
      action: PayloadAction<{ visitId: string; eventId: string | null }>
    ) => {
      const { visitId, eventId } = action.payload;
      state.eventIdByVisitId[visitId] = eventId;
    },

    /**
     * Bulk set mapping after a full sync.
     * IMPORTANT: replace the whole map so removed visits don't keep stale eventIds.
     */
    setVisitEventIds: (state, action: PayloadAction<Record<string, string>>) => {
      const map = action.payload;
      const next: Record<string, string | null> = {};

      // Keep only ids that exist in current visits list
      const validIds = new Set(state.items.map((v) => v.id));

      Object.keys(map).forEach((visitId) => {
        if (validIds.has(visitId)) next[visitId] = map[visitId];
      });

      state.eventIdByVisitId = next;
    },

    clearVisitEventIds: (state) => {
      state.eventIdByVisitId = {};
    },
  },
});

export const {
  setVisits,
  addVisit,
  updateVisit,
  setLoading,
  setError,
  updateFieldResponse,
  setVisitResponses,
  setVisitEventId,
  setVisitEventIds,
  clearVisitEventIds,
} = visitsSlice.actions;

// -------------------- SELECTORS --------------------

// Base selector to get the visits items array
const selectVisitItems = (state: RootState) => state.visits.items;

// If you prefer not passing techId all the time, you can store techId in state and select it instead.
// For now, keep this generic.
export const selectVisitsForTechnician = createSelector(
  [selectVisitItems, (_: RootState, techId: string | undefined) => techId],
  (items, techId) => (techId ? items.filter((visit) => visit.technicianId === techId) : items)
);

/** Selector: eventId for a specific visit */
export const selectEventIdForVisit = (state: RootState, visitId: string) =>
  state.visits.eventIdByVisitId[visitId] ?? null;

export default visitsSlice.reducer;