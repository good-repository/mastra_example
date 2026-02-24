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
 * Used by the Orchestrator Agent for routing.
 */
export const callWeatherAgent = createTool({
  id: 'call-weather-agent',
  description:
    'Delega consultas sobre clima, temperatura ou previsão do tempo ao agente especialista de meteorologia',
  inputSchema: weatherAgentQuerySchema,
  outputSchema: weatherAgentResponseSchema,
  execute: async (inputData: WeatherAgentQuery): Promise<WeatherAgentResponse> => {
    const result = await weatherAgent.generate(inputData.query);
    return { response: result.text };
  },
});
