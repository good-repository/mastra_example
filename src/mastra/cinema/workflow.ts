import { createStep, createWorkflow } from '@mastra/core/workflows';
import {
  fetchWithRetry,
  API_ENDPOINTS,
} from '../shared/lib/api-utils';
import { showSearchSchema, showDetailSchema } from './tools/direct-tool';

// Combined fetch that gets both show search and details in one step
const fetchShowComplete = createStep({
  id: 'fetch-show-complete',
  description: 'Busca uma série pelo nome no TVMaze e obtém detalhes completos',
  inputSchema: showSearchSchema,
  outputSchema: showDetailSchema,
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('Input data not found');

    try {
      // Search for show
      const q = encodeURIComponent(inputData.showName);
      const searchUrl = `${API_ENDPOINTS.TVMAZE.BASE}${API_ENDPOINTS.TVMAZE.SEARCH_SHOWS}?q=${q}`;

      const searchData = await fetchWithRetry<
        Array<{ show: { id: number; name: string } }>
      >(searchUrl);

      if (!Array.isArray(searchData) || searchData.length === 0) {
        throw new Error(`Série "${inputData.showName}" não encontrada`);
      }

      const showId = searchData[0].show.id;

      // Get show details
      const detailsUrl = `${API_ENDPOINTS.TVMAZE.BASE}${API_ENDPOINTS.TVMAZE.SHOW_DETAILS(showId)}`;

      const show = await fetchWithRetry<{
        id: number;
        name: string;
        summary: string | null;
        genres: string[];
        status: string;
        premiered: string | null;
        officialSite: string | null;
      }>(detailsUrl);

      return {
        id: show.id,
        name: show.name,
        summary: show.summary ?? null,
        genres: show.genres ?? [],
        status: show.status ?? 'unknown',
        premiered: show.premiered ?? null,
        officialSite: show.officialSite ?? null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[cinema-workflow]', message);
      throw error;
    }
  },
});

// Simplified workflow with just one step
const cinemaWorkflow = createWorkflow({
  id: 'cinema-workflow',
  inputSchema: showSearchSchema,
  outputSchema: showDetailSchema,
})
  .then(fetchShowComplete);

cinemaWorkflow.commit();

export { cinemaWorkflow, showDetailSchema, showSearchSchema };
