import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  executeCinemaWorkflow,
  ShowSearchInput,
  ShowDetail,
} from '../workflows/cinema-workflow-executor';
import { showSearchSchema, showDetailSchema } from '../workflows/cinema-workflow';

export const cinemaWorkflowTool = createTool({
  id: 'cinema-workflow-tool',
  description:
    'Busca informações completas sobre séries (nome, sinopse, gênero, status, etc)',
  inputSchema: showSearchSchema,
  outputSchema: showDetailSchema,
  execute: async (inputData: ShowSearchInput): Promise<ShowDetail> => {
    return executeCinemaWorkflow(inputData);
  },
});
