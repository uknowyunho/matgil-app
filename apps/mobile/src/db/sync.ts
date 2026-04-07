import { synchronize } from '@nozbe/watermelondb/sync';
import { Database } from '@nozbe/watermelondb';

import { apiClient } from '../api/client';

/**
 * Synchronizes the local WatermelonDB database with the server.
 * Uses the WatermelonDB synchronize protocol:
 * - pullChanges: fetches changes from the server since the last sync
 * - pushChanges: sends local changes to the server
 */
export async function syncDatabase(database: Database): Promise<void> {
  await synchronize({
    database,

    pullChanges: async ({ lastPulledAt }) => {
      const response = await apiClient.get('/sync/pull', {
        params: { lastPulledAt },
      });

      const { changes, timestamp } = response.data.data;

      return {
        changes,
        timestamp,
      };
    },

    pushChanges: async ({ changes, lastPulledAt }) => {
      await apiClient.post('/sync/push', {
        changes,
        lastPulledAt,
      });
    },

    migrationsEnabledAtVersion: 1,
  });
}
