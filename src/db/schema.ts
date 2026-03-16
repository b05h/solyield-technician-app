import { appSchema as createAppSchema, tableSchema } from '@nozbe/watermelondb';

export const appSchema = createAppSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'inspections',
      columns: [
        { name: 'visit_id', type: 'string', isIndexed: true },
        { name: 'site_id', type: 'string', isIndexed: true },
        { name: 'form_id', type: 'string' },
        { name: 'responses', type: 'string' },
        { name: 'image_uris', type: 'string' },
        { name: 'is_synced', type: 'boolean', isOptional: false },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

