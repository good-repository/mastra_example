import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { cinemaWorkflow } from '../workflows/cinema-workflow';
import { formatApiError } from '../lib/api-utils';

export const cinemaWorkflowTool = createTool({
  id: 'cinema-workflow-tool',
  description:
    'Busca informações completas sobre séries (nome, sinopse, gênero, status, etc)',
  inputSchema: z.object({
    showName: z.string().describe('Nome da série'),
  }),
  outputSchema: z.object({
    id: z.number(),
    name: z.string(),
    summary: z.string().nullable(),
    genres: z.array(z.string()),
    status: z.string(),
    premiered: z.string().nullable(),
    officialSite: z.string().nullable(),
  }),
  execute: async (inputData) => {
    try {
      const result = await cinemaWorkflow.execute({
        input: { showName: inputData.showName },
      });

      if (result.error) {
        return { error: formatApiError(result.error) };
      }

      return result.output;
    } catch (error) {
      return {
        error: formatApiError(error),
      };
    }
  },
});
