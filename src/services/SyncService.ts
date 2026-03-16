import { Q } from '@nozbe/watermelondb';
import * as FileSystem from 'expo-file-system/legacy';
import { database } from '../db';
import Inspection from '../db/models/Inspection';

interface PerformSyncOptions {
  silent?: boolean;
}

interface PerformSyncResult {
  syncedCount: number;
  failedCount: number;
  hadErrors: boolean;
}

export async function performSync(
  options: PerformSyncOptions = {}
): Promise<PerformSyncResult> {
  const { silent = false } = options;

  const API_URL =
    process.env.EXPO_PUBLIC_API_URL || 'https://api.solyield.com/v1/inspections';

  const collection = database.get<Inspection>('inspections');
  const unsyncedRecords = await collection.query(Q.where('is_synced', false)).fetch();

  if (unsyncedRecords.length === 0) {
    if (!silent) {
      console.log('SyncService: No unsynced records found.');
    }
    return {
      syncedCount: 0,
      failedCount: 0,
      hadErrors: false,
    };
  }

  if (!silent) {
    console.log(`SyncService: Starting sync for ${unsyncedRecords.length} records...`);
  }

  let syncedCount = 0;
  let failedCount = 0;

  for (const record of unsyncedRecords) {
    const formData = new FormData();

    formData.append('visit_id', record.visitId);
    formData.append('responses', JSON.stringify(record.responses));
    formData.append('last_modified', record.updatedAt.toString());

    const responses = record.responses as unknown as Record<string, unknown>;

    // Identify file URIs within the responses
    const fileUris: string[] = [];
    Object.values(responses).forEach((val) => {
      if (typeof val === 'string' && val.startsWith('file://')) {
        fileUris.push(val);
      }
      if (Array.isArray(val)) {
        val.forEach((item) => {
          if (typeof item === 'string' && item.startsWith('file://')) {
            fileUris.push(item);
          }
        });
      }
    });

    let skipRecord = false;

    for (const uriRaw of fileUris) {
      let uri = uriRaw;
      if (!uri.startsWith('file://')) {
        uri = `file://${uri}`;
      }

      try {
        const fileName = uri.split('/').pop() ?? `photo_${Date.now()}.jpg`;
        const ext = fileName.split('.').pop()?.toLowerCase();
        const contentType =
          ext === 'png'
            ? 'image/png'
            : ext === 'jpg' || ext === 'jpeg'
              ? 'image/jpeg'
              : 'application/octet-stream';

        // 1. Fetch file info using the legacy API to avoid deprecation warnings
        const fileInfo = await FileSystem.getInfoAsync(uri); 

        // 2. Type Guard: Ensure the file exists before accessing size/uri
        if (!fileInfo.exists) {
          failedCount += 1;
          skipRecord = true;
          if (!silent) {
            console.warn(`SyncService: File Missing from Disk: ${uri}`);
          }
          break; 
        }

        if (!silent) {
          console.log(
            `SyncService: Attaching file: ${fileName} (${fileInfo.size} bytes)`
          );
        }

        // 3. Append to FormData (casting to any for React Native's specific FormData type)
        formData.append('attachment', {
          uri: fileInfo.uri,
          name: fileName,
          type: contentType,
        } as any);

      } catch (error) {
        failedCount += 1;
        skipRecord = true;
        if (!silent) {
          console.warn(`SyncService: Could not attach file ${uriRaw}`, error);
        }
      }
    }

    if (skipRecord) {
      // Update updatedAt with a number (timestamp) to fix "type mismatch" error
      await database.write(async () => {
        await record.update((inspection) => {
          inspection.isSynced = false;
          inspection.updatedAt = Date.now(); 
        });
      });
      continue;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData as any,
      });

      if (response.ok) {
        if (!silent) {
          console.log(`SyncService: Record ${record.id} synced successfully.`);
        }

        await database.write(async () => {
          await record.update((inspection) => {
            inspection.isSynced = true;
            inspection.updatedAt = Date.now();
          });
        });

        syncedCount += 1;
      } else {
        failedCount += 1;
        if (!silent) {
          console.warn(
            `SyncService: Server rejected record ${record.id}; status=${response.status}`
          );
        }
      }
    } catch (error) {
      failedCount += 1;
      if (!silent) {
        console.warn(`SyncService: Network issue while syncing record ${record.id}`);
      }
    }
  }

  return {
    syncedCount,
    failedCount,
    hadErrors: failedCount > 0,
  };
}