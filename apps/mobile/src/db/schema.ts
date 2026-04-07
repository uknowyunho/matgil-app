import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'restaurants',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'address', type: 'string' },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'memo', type: 'string', isOptional: true },
        { name: 'rating', type: 'number', isOptional: true },
        { name: 'last_visited_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'categories',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'color_hex', type: 'string' },
        { name: 'sort_order', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'reviews',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'restaurant_id', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'rating', type: 'number' },
        { name: 'visited_date', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
