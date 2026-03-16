import { Q } from '@nozbe/watermelondb';

import { database } from './index';
import Inspection from './models/Inspection';
import type { InspectionResponses } from '../types/db';

export async function getInspectionByVisitId(visitId: string): Promise<Inspection | null> {
  const collection = database.get<Inspection>('inspections');
  const rows = await collection.query(Q.where('visit_id', visitId)).fetch();
  return rows.length > 0 ? rows[0] : null;
}

export async function getAllInspections(): Promise<Inspection[]> {
  const collection = database.get<Inspection>('inspections');
  return collection.query().fetch();
}

export async function saveInspectionRecord(
  visitId: string,
  siteId: string,
  formId: string,
  formData: InspectionResponses,
): Promise<void> {
  const collection = database.get<Inspection>('inspections');
  const now = Date.now();
  const existing = await getInspectionByVisitId(visitId);

  await database.write(async () => {
    if (existing) {
      await existing.update((inspection) => {
        inspection.responses = formData;
        inspection.imageUris = {
          f_site_photo: formData.f_site_photo,
          f_docs: formData.f_docs,
        };
        inspection.updatedAt = now;
      });
    } else {
      await collection.create((inspection) => {
        inspection.visitId = visitId;
        inspection.siteId = siteId;
        inspection.formId = formId;
        inspection.responses = formData;
        inspection.imageUris = {
          f_site_photo: formData.f_site_photo,
          f_docs: formData.f_docs,
        };
        inspection.isSynced = false;
        inspection.createdAt = now;
        inspection.updatedAt = now;
      });
    }
  });
}

