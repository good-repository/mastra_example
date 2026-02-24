import { z } from 'zod';
import {
  cinemaWorkflow,
  showDetailSchema,
} from './workflow';
import { showSearchSchema } from './tools/direct-tool';
import { validateString, validateObject } from '../shared/lib/validation';

type ShowSearchInput = z.infer<typeof showSearchSchema>;
type ShowDetail = z.infer<typeof showDetailSchema>;

/**
 * Tipo-seguro wrapper para executar o workflow
 * Isola a chamada complexa do Mastra e retorna types corretos
 */
export async function executeCinemaWorkflow(
  input: ShowSearchInput
): Promise<ShowDetail> {
  try {
    validateObject(input, 'cinema workflow input');

    const showName = validateString(input.showName, 'showName');

    console.log('[executeCinemaWorkflow] Starting workflow execution for show:', showName);

    const result = await (cinemaWorkflow.execute as any)({ inputData: { showName } });

    console.log('[executeCinemaWorkflow] Workflow executed, result:', result ? 'has data' : 'empty');

    if (!result) {
      console.error('[executeCinemaWorkflow] Workflow returned empty result');
      return {
        id: -1,
        name: 'Erro',
        summary: '❌ Workflow retornou resultado vazio',
        genres: [],
        status: 'error',
        premiered: null,
        officialSite: null,
      };
    }

    return result as ShowDetail;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[executeCinemaWorkflow] Caught error:', msg);
    // Return error response instead of throwing
    return {
      id: -1,
      name: 'Erro',
      summary: `❌ Erro na execução: ${msg}`,
      genres: [],
      status: 'error',
      premiered: null,
      officialSite: null,
    };
  }
}

export type { ShowSearchInput, ShowDetail };
