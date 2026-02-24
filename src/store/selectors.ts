import type { RootState } from './index';
import type { Visit } from '../types/models';

/**
 * Returns visits assigned to the current technician (technician id from technician.json / state).
 */
export function selectVisitsForTechnician(state: RootState): Visit[] {
  const technicianId = state.technician.current?.id;
  if (technicianId == null || technicianId === '') {
    return [];
  }
  return state.visits.items.filter((v) => v.technicianId === technicianId);
}
