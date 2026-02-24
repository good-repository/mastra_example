import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  fetchWithRetry,
  API_ENDPOINTS,
} from '../../shared/lib/api-utils';

export const showSearchSchema = z.object({
  showName: z.string().max(200).describe('Name of the TV show to search for'),
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

export type ShowSearchInput = z.infer<typeof showSearchSchema>;
export type ShowDetail = z.infer<typeof showDetailSchema>;

export const cinemaDirectTool = createTool({
  id: 'cinema-direct-tool',
  description:
    'Searches for complete TV show information: synopsis, genres, status, premiere date, and official site',
  inputSchema: showSearchSchema,
  outputSchema: showDetailSchema,
  execute: async ({ showName }: ShowSearchInput) => {
    const q = encodeURIComponent(showName);
    const searchUrl = `${API_ENDPOINTS.TVMAZE.BASE}${API_ENDPOINTS.TVMAZE.SEARCH_SHOWS}?q=${q}`;

    const searchData = await fetchWithRetry<
      Array<{ show: { id: number; name: string } }>
    >(searchUrl);

    if (!Array.isArray(searchData) || searchData.length === 0) {
      throw new Error(`Série "${showName}" não encontrada`);
    }

    const showId = searchData[0].show.id;
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
      summary: show.summary,
      genres: show.genres ?? [],
      status: show.status ?? 'unknown',
      premiered: show.premiered,
      officialSite: show.officialSite,
    };
  },
});
