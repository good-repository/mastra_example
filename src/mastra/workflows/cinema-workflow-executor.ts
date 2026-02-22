import { z } from 'zod';
import {
  cinemaWorkflow,
  showDetailSchema,
  showSearchSchema,
} from './cinema-workflow';
import { formatApiError } from '../lib/api-utils';

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
    // A chamada com any é isolada aqui - não se espalha pelo project
    const result = await (cinemaWorkflow.execute as any)({ inputData: input });
    return result as ShowDetail;
  } catch (error) {
    throw new Error(formatApiError(error));
  }
}

export type { ShowSearchInput, ShowDetail };
