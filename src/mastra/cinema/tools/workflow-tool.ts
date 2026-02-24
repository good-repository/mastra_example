import { createTool } from '@mastra/core/tools';
import {
  executeCinemaWorkflow,
  ShowSearchInput,
  ShowDetail,
} from '../workflow-executor';
import { showSearchSchema, showDetailSchema } from './direct-tool';

export const cinemaWorkflowTool = createTool({
  id: 'cinema-workflow-tool',
  description:
    'Busca informações completas sobre séries (nome, sinopse, gênero, status, etc)',
  inputSchema: showSearchSchema,
  outputSchema: showDetailSchema,
  execute: async (inputData: ShowSearchInput): Promise<ShowDetail> => {
    try {
      console.log('[cinemaWorkflowTool] Executing with input:', inputData);
      const result = await executeCinemaWorkflow(inputData);
      console.log('[cinemaWorkflowTool] Result:', result ? 'has data' : 'empty');
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[cinemaWorkflowTool] Error:', msg);
      return {
        id: -1,
        name: 'Erro',
        summary: `❌ Erro na ferramenta: ${msg}`,
        genres: [],
        status: 'error',
        premiered: null,
        officialSite: null,
      };
    }
  },
});
