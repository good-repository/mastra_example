import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import {
  fetchWithRetry,
  API_ENDPOINTS,
} from '../shared/lib/api-utils';
import { getWeatherCondition } from '../shared/lib/weather-codes';
import { WEATHER_ACTIVITY_PLANNING_PROMPT } from './prompts';
import {
  weatherInputSchema,
  forecastSchema,
  weatherOutputSchema,
  type WeatherResponse,
} from './types';

const fetchWeather = createStep({
  id: 'fetch-weather',
  description: 'Fetches weather forecast for a city',
  inputSchema: z.object({
    city: z.string().max(200).describe('City name to get the weather forecast for'),
  }),
  outputSchema: forecastSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const geocodingUrl = `${API_ENDPOINTS.OPEN_METEO.GEOCODING}?name=${encodeURIComponent(
      inputData.city
    )}&count=1`;
    const geocodingData = await fetchWithRetry<{
      results: { latitude: number; longitude: number; name: string }[];
    }>(geocodingUrl);

    if (!geocodingData.results?.[0]) {
      throw new Error(`Localização '${inputData.city}' não encontrada`);
    }

    const { latitude, longitude, name } = geocodingData.results[0];

    const weatherUrl = `${API_ENDPOINTS.OPEN_METEO.WEATHER}?latitude=${latitude}&longitude=${longitude}&current=precipitation,weathercode&timezone=auto&hourly=precipitation_probability,temperature_2m`;
    const data = await fetchWithRetry<WeatherResponse>(weatherUrl);

    return {
      date: new Date().toISOString(),
      maxTemp: Math.max(...data.hourly.temperature_2m),
      minTemp: Math.min(...data.hourly.temperature_2m),
      condition: getWeatherCondition(data.current.weathercode),
      precipitationChance: data.hourly.precipitation_probability.reduce(
        (acc, curr) => Math.max(acc, curr),
        0
      ),
      location: name,
    };
  },
});

const planActivities = createStep({
  id: 'plan-activities',
  description: 'Suggests activities based on the weather forecast',
  inputSchema: forecastSchema,
  outputSchema: weatherOutputSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Forecast input data is required');
    }

    if (!mastra) {
      throw new Error('Mastra instance is not available in workflow');
    }

    // Uses activityPlannerAgent (no tools) instead of weatherAgent to avoid
    // circular dependency: weatherAgent → weatherWorkflowTool → weatherWorkflow → here
    const agent = mastra.getAgent('activityPlannerAgent');
    if (!agent) {
      throw new Error('activityPlannerAgent not found in Mastra instance');
    }

    const prompt = WEATHER_ACTIVITY_PLANNING_PROMPT(
      inputData.location,
      JSON.stringify(inputData, null, 2)
    );

    try {
      const response = await agent.stream([{ role: 'user', content: prompt }]);

      let activitiesText = '';
      for await (const chunk of response.textStream) {
        if (chunk) {
          activitiesText += chunk;
        }
      }

      if (!activitiesText.trim()) {
        return {
          activities: 'Desculpe, não consegui gerar sugestões de atividades no momento. Tente novamente em alguns instantes.',
        };
      }

      return { activities: activitiesText };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { activities: `❌ Erro ao processar: ${errorMsg}` };
    }
  },
});

const weatherWorkflow = createWorkflow({
  id: 'weather-workflow',
  inputSchema: weatherInputSchema,
  outputSchema: weatherOutputSchema,
})
  .then(fetchWeather)
  .then(planActivities);

weatherWorkflow.commit();

export { weatherWorkflow };
