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
 * Forwards conversation context so the specialist can resolve follow-up queries.
 */
export const callCinemaAgent = createTool({
  id: 'call-cinema-agent',
  description:
    'Delega consultas sobre séries, programas de TV ou filmes ao agente especialista de cinema',
  inputSchema: cinemaAgentQuerySchema,
  outputSchema: cinemaAgentResponseSchema,
  execute: async (inputData: CinemaAgentQuery): Promise<CinemaAgentResponse> => {
    const prompt = inputData.context
      ? `Contexto da conversa recente:\n${inputData.context}\n\nPergunta atual: ${inputData.query}`
      : inputData.query;
    const result = await cinemaAgent.generate(prompt);
    return { response: result.text };
  },
});
