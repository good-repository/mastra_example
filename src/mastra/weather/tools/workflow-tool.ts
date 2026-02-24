import { createTool } from '@mastra/core/tools';
import {
  executeWeatherWorkflow,
  type WeatherInput,
  type WeatherOutput,
} from '../workflow-executor';
import {
  weatherInputSchema,
  weatherOutputSchema,
} from '../types';

export const weatherWorkflowTool = createTool({
  id: 'weather-workflow-tool',
  description:
    'Obtém previsão de tempo para uma cidade e sugere atividades baseado no clima',
  inputSchema: weatherInputSchema,
  outputSchema: weatherOutputSchema,
  execute: async (inputData: WeatherInput): Promise<WeatherOutput> => {
    try {
      console.log('[weatherWorkflowTool] Executing with input:', inputData);
      const result = await executeWeatherWorkflow(inputData);
      console.log('[weatherWorkflowTool] Result:', result ? 'has data' : 'empty');
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[weatherWorkflowTool] Error:', msg);
      return {
        activities: `❌ Erro na ferramenta: ${msg}`,
      };
    }
  },
});
