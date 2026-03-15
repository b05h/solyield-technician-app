import { Q } from '@nozbe/watermelondb';
import * as FileSystem from 'expo-file-system';
import { database } from '../db';
import Inspection from '../db/models/Inspection';
import type { InspectionResponses } from '../types/db';

export async function performSync(): Promise<void> {
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.solyield.com/v1/inspections';

  const collection = database.get<Inspection>('inspections');

  const unsyncedRecords = await collection.query(Q.where('is_synced', false)).fetch();

  if (unsyncedRecords.length === 0) {
    console.log('SyncService: No unsynced records found.');
    return;
  }

  console.log(`SyncService: Starting sync for ${unsyncedRecords.length} records...`);

  for (const record of unsyncedRecords) {
    const formData = new FormData();
    
    // --- Metadata & Bonus Conflict Logic ---
    formData.append('visit_id', record.visitId);
    formData.append('responses', JSON.stringify(record.responses));
    
    // BONUS: Send the local timestamp so the server can check for conflicts
    // If the server's record is newer than this, it should return 409.
    formData.append('last_modified', record.updatedAt.toString());

    // --- Attachment Logic (Refactored to handle async correctly) ---
    const responses = record.responses as unknown as Record<string, unknown>;
    
    // We collect all potential URIs first
    const fileUris: string[] = [];
    Object.values(responses).forEach((val) => {
      if (typeof val === 'string' && val.startsWith('file://')) fileUris.push(val);
      if (Array.isArray(val)) {
        val.forEach((item) => {
          if (typeof item === 'string' && item.startsWith('file://')) fileUris.push(item);
        });
      }
    });

    // Now we append them sequentially to ensure the FormData is complete
    for (const uri of fileUris) {
      try {
        const fileName = uri.split('/').pop() ?? `photo_${Date.now()}.jpg`;
        const ext = fileName.split('.').pop()?.toLowerCase();
        const contentType =
          ext === 'png' ? 'image/png' : 
          (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : 
          'application/octet-stream';

        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists) {
          console.log(`SyncService: Attaching file: ${fileName} (${fileInfo.size} bytes)`);
          
          formData.append('attachment', {
            uri,
            name: fileName,
            type: contentType,
          } as any);
        }
      } catch (error) {
        console.error(`SyncService: Could not attach ${uri}`, error);
      }
    }

    // --- The Sync Request ---
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          // Note: Do not manually set Content-Type for FormData in many RN versions; 
          // fetch will auto-generate it with the correct "boundary" string.
        },
        body: formData as any,
      });

      if (response.ok) {
        console.log(`SyncService: Record ${record.id} synced successfully.`);
        await database.write(async () => {
          await record.update((inspection) => {
            inspection.isSynced = true;
            inspection.updatedAt = Date.now();
          });
        });
      } 
      // --- BONUS: Handle Conflict Response ---
      else if (response.status === 409) {
        console.warn(`SyncService: Conflict detected for record ${record.id}. Server has a newer version.`);
        // Logic: We keep is_synced as FALSE so the user can review it later, 
        // or you could trigger a "Force Sync" or "Pull from Server" action here.
      } 
      else if (response.status === 413) {
        console.error(`SyncService: Payload too large for record ${record.id}. Check image compression.`);
      } 
      else {
        console.warn(`SyncService: Server rejected record ${record.id}; status=${response.status}`);
      }
    } catch (error) {
      console.error(`SyncService: Network error for record ${record.id}`, error);
    }
  }
}