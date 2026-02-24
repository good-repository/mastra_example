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
    'Gets a weather forecast for a city and suggests activities based on the conditions',
  inputSchema: weatherInputSchema,
  outputSchema: weatherOutputSchema,
  execute: async (inputData: WeatherInput): Promise<WeatherOutput> => {
    return executeWeatherWorkflow(inputData);
  },
});
