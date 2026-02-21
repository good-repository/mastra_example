import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

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
    const q = encodeURIComponent(inputData.showName);
    const res = await fetch(`https://api.tvmaze.com/search/shows?q=${q}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('Show not found');
    const show = data[0].show;
    return { id: show.id, name: show.name };
  },
});

const fetchShowDetails = createStep({
  id: 'fetch-show-details',
  description: 'Obtém detalhes completos da série',
  inputSchema: z.object({ id: z.number() }),
  outputSchema: showDetailSchema,
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('Input data not found');
    const res = await fetch(`https://api.tvmaze.com/shows/${inputData.id}`);
    const show = await res.json();
    return {
      id: show.id,
      name: show.name,
      summary: show.summary ?? null,
      genres: show.genres ?? [],
      status: show.status ?? 'unknown',
      premiered: show.premiered ?? null,
      officialSite: show.officialSite ?? null,
    };
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

export { cinemaWorkflow };
