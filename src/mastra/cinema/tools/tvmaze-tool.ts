import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  fetchWithRetry,
  API_ENDPOINTS,
} from '../../shared/lib/api-utils';
export const tvTool = createTool({
  id: 'tv-tool',
  description: `Advanced tool for TV show queries via TVMaze API.

Base URL: ${API_ENDPOINTS.TVMAZE.BASE}

Common endpoints:
1) /search/shows?q={name} - Search shows by name
2) /shows/{id} - Get show details by ID
3) /shows/{id}/episodes - Get show episodes

Use the 'endpoint' parameter to specify which endpoint to call.`,
  inputSchema: z.object({
    endpoint: z
      .string()
      .max(500)
      .describe(
        'TVMaze API endpoint. Example: /search/shows?q=breaking%20bad or /shows/1'
      ),
  }),
  outputSchema: z.unknown(),
  execute: async ({ endpoint }: { endpoint: string }) => {
    const url = `${API_ENDPOINTS.TVMAZE.BASE}${endpoint}`;
    return fetchWithRetry<unknown>(url);
  },
});

