import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  fetchWithRetry,
  API_ENDPOINTS,
} from '../../shared/lib/api-utils';
import { validateString, validateObject } from '../../shared/lib/validation';

export const showSearchSchema = z.object({
  showName: z.string().describe('Nome da série a buscar'),
});

export const showDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  summary: z.string().nullable(),
  genres: z.array(z.string()),
  status: z.string(),
  premiered: z.string().nullable(),
  officialSite: z.string().nullable(),
});

/**
 * Direct cinema tool that implements the workflow logic without using Mastra workflows
 * This bypasses potential issues with the Mastra workflow execution framework
 */
export const cinemaDirectTool = createTool({
  id: 'cinema-direct-tool',
  description:
    'Busca informações completas sobre séries (nome, sinopse, gênero, status, etc)',
  inputSchema: showSearchSchema,
  outputSchema: showDetailSchema,
  execute: async (inputData) => {
    try {
      validateObject(inputData, 'cinema input');

      const input = inputData as { showName?: unknown };
      const showName = validateString(input.showName, 'showName');

      // Search for show
      const q = encodeURIComponent(showName);
      const searchUrl = `${API_ENDPOINTS.TVMAZE.BASE}${API_ENDPOINTS.TVMAZE.SEARCH_SHOWS}?q=${q}`;

      const searchData = await fetchWithRetry<
        Array<{ show: { id: number; name: string } }>
      >(searchUrl);

      if (!Array.isArray(searchData) || searchData.length === 0) {
        throw new Error(`Série "${showName}" não encontrada`);
      }

      const showId = searchData[0].show.id;

      // Get show details
      const detailsUrl = `${API_ENDPOINTS.TVMAZE.BASE}${API_ENDPOINTS.TVMAZE.SHOW_DETAILS(
        showId
      )}`;

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
      throw error;
    }
  },
});
