import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import {
  fetchWithRetry,
  formatApiError,
  API_ENDPOINTS,
} from '../lib/api-utils';
import { getWeatherCondition } from '../lib/weather-codes';
import { WEATHER_ACTIVITY_PLANNING_PROMPT } from './weather-prompts';
import {
  weatherInputSchema,
  forecastSchema,
  weatherOutputSchema,
} from './weather-types';

const fetchWeather = createStep({
  id: 'fetch-weather',
  description: 'Busca previsão de tempo para uma cidade',
  inputSchema: z.object({
    city: z.string().describe('Cidade para obter previsão de tempo'),
  }),
  outputSchema: forecastSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    try {
      // Geocode location
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

      // Fetch weather
      const weatherUrl = `${API_ENDPOINTS.OPEN_METEO.WEATHER}?latitude=${latitude}&longitude=${longitude}&current=precipitation,weathercode&timezone=auto&hourly=precipitation_probability,temperature_2m`;
      const data = await fetchWithRetry<{
        current: {
          time: string;
          precipitation: number;
          weathercode: number;
        };
        hourly: {
          precipitation_probability: number[];
          temperature_2m: number[];
        };
      }>(weatherUrl);

      const forecast = {
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

      return forecast;
    } catch (error) {
      throw new Error(formatApiError(error));
    }
  },
});

const planActivities = createStep({
  id: 'plan-activities',
  description: 'Sugere atividades baseadas na previsão de tempo',
  inputSchema: forecastSchema,
  outputSchema: weatherOutputSchema,
  execute: async ({ inputData, mastra }) => {
    const forecast = inputData;

    if (!forecast) {
      throw new Error('Forecast data not found');
    }

    const agent = mastra?.getAgent('weatherAgent');
    if (!agent) {
      throw new Error('Weather agent not found');
    }

    const prompt = WEATHER_ACTIVITY_PLANNING_PROMPT(
      forecast.location,
      JSON.stringify(forecast, null, 2)
    );

    const response = await agent.stream([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    let activitiesText = '';

    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      activitiesText += chunk;
    }

    return {
      activities: activitiesText,
    };
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
