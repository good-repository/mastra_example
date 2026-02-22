import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  fetchWithRetry,
  formatApiError,
  API_ENDPOINTS,
} from '../lib/api-utils';

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
      .describe(
        'TVMaze API endpoint. Example: /search/shows?q=breaking%20bad or /shows/1'
      ),
  }),
  outputSchema: z.any(),
  execute: async (inputData) => {
    try {
      const url = `${API_ENDPOINTS.TVMAZE.BASE}${inputData.endpoint}`;
      const data = await fetchWithRetry<unknown>(url);
      return data;
    } catch (error) {
      return {
        error: formatApiError(error),
      };
    }
  },
});
