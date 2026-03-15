import { Model } from '@nozbe/watermelondb';
import { field, json } from '@nozbe/watermelondb/decorators';
import type { InspectionImageUris, InspectionResponses } from '../../types/db';

const sanitizeResponses = (
  raw: InspectionResponses | null | undefined,
): InspectionResponses => raw ?? ({} as InspectionResponses);

const sanitizeImageUris = (
  raw: InspectionImageUris | null | undefined,
): InspectionImageUris => raw ?? {};

export default class Inspection extends Model {
  static table = 'inspections';

  @field('visit_id') visitId!: string;

  @field('site_id') siteId!: string;

  @field('form_id') formId!: string;

  @json('responses', sanitizeResponses)
  responses!: InspectionResponses;

  @json('image_uris', sanitizeImageUris)
  imageUris!: InspectionImageUris;

  @field('is_synced') isSynced!: boolean;

  @field('created_at') createdAt!: number;

  @field('updated_at') updatedAt!: number;
}

