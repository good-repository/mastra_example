import { createTool } from '@mastra/core/tools';
import {
  executeWeatherWorkflow,
  type WeatherInput,
  type WeatherOutput,
} from '../workflows/weather-workflow-executor';
import {
  weatherInputSchema,
  weatherOutputSchema,
} from '../workflows/weather-types';

export const weatherWorkflowTool = createTool({
  id: 'weather-workflow-tool',
  description:
    'Obtém previsão de tempo para uma cidade e sugere atividades baseado no clima',
  inputSchema: weatherInputSchema,
  outputSchema: weatherOutputSchema,
  execute: async (inputData: WeatherInput): Promise<WeatherOutput> => {
    return executeWeatherWorkflow(inputData);
  },
});
