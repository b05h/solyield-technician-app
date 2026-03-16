import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import Inspection from './models/Inspection';
import { appSchema } from './schema';

const adapter = new SQLiteAdapter({
  schema: appSchema,
  dbName: 'technician_app',
});

export const database = new Database({
  adapter,
  modelClasses: [Inspection],
});

export type DatabaseInstance = typeof database;

