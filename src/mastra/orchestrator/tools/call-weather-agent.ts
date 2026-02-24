import { createTool } from '@mastra/core/tools';
import { weatherAgent } from '../../weather/agent';
import {
  weatherAgentQuerySchema,
  weatherAgentResponseSchema,
  type WeatherAgentQuery,
  type WeatherAgentResponse,
} from '../../shared/types/agent-contracts';

/**
 * Delegates weather-related queries to the Weather Agent specialist.
 * Forwards conversation context so the specialist can resolve follow-up queries.
 */
export const callWeatherAgent = createTool({
  id: 'call-weather-agent',
  description:
    'Delega consultas sobre clima, temperatura ou previsão do tempo ao agente especialista de meteorologia',
  inputSchema: weatherAgentQuerySchema,
  outputSchema: weatherAgentResponseSchema,
  execute: async (inputData: WeatherAgentQuery): Promise<WeatherAgentResponse> => {
    const prompt = inputData.context
      ? `Contexto da conversa recente:\n${inputData.context}\n\nPergunta atual: ${inputData.query}`
      : inputData.query;
    const result = await weatherAgent.generate(prompt);
    return { response: result.text };
  },
});
