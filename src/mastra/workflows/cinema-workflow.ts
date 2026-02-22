import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import {
  fetchWithRetry,
  formatApiError,
  API_ENDPOINTS,
} from '../lib/api-utils';

const showSearchSchema = z.object({
  showName: z.string().describe('Nome da série a buscar'),
});

const showDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  summary: z.string().nullable(),
  genres: z.array(z.string()),
  status: z.string(),
  premiered: z.string().nullable(),
  officialSite: z.string().nullable(),
});

const fetchShow = createStep({
  id: 'fetch-show',
  description: 'Busca uma série pelo nome no TVMaze',
  inputSchema: showSearchSchema,
  outputSchema: z.object({ id: z.number(), name: z.string() }),
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('Input data not found');

    try {
      const q = encodeURIComponent(inputData.showName);
      const url = `${API_ENDPOINTS.TVMAZE.BASE}${API_ENDPOINTS.TVMAZE.SEARCH_SHOWS}?q=${q}`;
      const data = await fetchWithRetry<
        Array<{ show: { id: number; name: string } }>
      >(url);

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error(`Série "${inputData.showName}" não encontrada`);
      }

      const show = data[0].show;
      return { id: show.id, name: show.name };
    } catch (error) {
      throw new Error(formatApiError(error));
    }
  },
});

const fetchShowDetails = createStep({
  id: 'fetch-show-details',
  description: 'Obtém detalhes completos da série',
  inputSchema: z.object({ id: z.number() }),
  outputSchema: showDetailSchema,
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('Input data not found');

    try {
      const url = `${API_ENDPOINTS.TVMAZE.BASE}${API_ENDPOINTS.TVMAZE.SHOW_DETAILS(
        inputData.id
      )}`;
      const show = await fetchWithRetry<{
        id: number;
        name: string;
        summary: string | null;
        genres: string[];
        status: string;
        premiered: string | null;
        officialSite: string | null;
      }>(url);

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
      throw new Error(formatApiError(error));
    }
  },
});

const cinemaWorkflow = createWorkflow({
  id: 'cinema-workflow',
  inputSchema: showSearchSchema,
  outputSchema: showDetailSchema,
})
  .then(fetchShow)
  .then(fetchShowDetails);

cinemaWorkflow.commit();

export { cinemaWorkflow, showDetailSchema, showSearchSchema };
