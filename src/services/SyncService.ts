import { Q } from '@nozbe/watermelondb';
import { database } from '../db';
import Inspection from '../db/models/Inspection';
import type { InspectionResponses } from '../types/db';

interface InspectionSyncPayload {
  visit_id: string;
  responses: InspectionResponses;
}

export async function performSync(): Promise<void> {
  // Use the environment variable, fallback to the placeholder for safety
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.solyield.com/v1/inspections';
  
  const collection = database.get<Inspection>('inspections');

  const unsyncedRecords = await collection
    .query(Q.where('is_synced', false))
    .fetch();

  if (unsyncedRecords.length === 0) {
    console.log('SyncService: No unsynced records found.');
    return;
  }

  console.log(`SyncService: Starting sync for ${unsyncedRecords.length} records...`);

  for (const record of unsyncedRecords) {
    const payload: InspectionSyncPayload = {
      visit_id: record.visitId,
      responses: record.responses,
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Beeceptor/Standard APIs usually return 200, 201, or 204 on success
      if (response.ok) { 
        console.log(`SyncService: Record ${record.id} synced successfully to Beeceptor.`);
        
        await database.write(async () => {
          await record.update((inspection) => {
            inspection.isSynced = true;
            inspection.updatedAt = Date.now();
          });
        });
      } else {
        console.warn(
          `SyncService: Server rejected record ${record.id}; status=${response.status}`
        );
      }
    } catch (error) {
      console.error(`SyncService: Network error while syncing record ${record.id}. Is Beeceptor up?`, error);
    }
  }
}