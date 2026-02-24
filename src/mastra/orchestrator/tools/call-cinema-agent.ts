import { createTool } from '@mastra/core/tools';
import { cinemaAgent } from '../../cinema/agent';
import {
  cinemaAgentQuerySchema,
  cinemaAgentResponseSchema,
  type CinemaAgentQuery,
  type CinemaAgentResponse,
} from '../../shared/types/agent-contracts';

/**
 * Delegates TV show / series queries to the Cinema Agent specialist.
 * Used by the Orchestrator Agent for routing.
 */
export const callCinemaAgent = createTool({
  id: 'call-cinema-agent',
  description:
    'Delega consultas sobre séries, programas de TV ou filmes ao agente especialista de cinema',
  inputSchema: cinemaAgentQuerySchema,
  outputSchema: cinemaAgentResponseSchema,
  execute: async (inputData: CinemaAgentQuery): Promise<CinemaAgentResponse> => {
    const result = await cinemaAgent.generate(inputData.query);
    return { response: result.text };
  },
});
