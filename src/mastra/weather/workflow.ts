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
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[fetchWeather] Caught error:', msg);
      // Don't wrap in formatApiError, just throw raw error
      // So we can see what's really happening
      throw error;
    }
  },
});

const planActivities = createStep({
  id: 'plan-activities',
  description: 'Sugere atividades baseadas na previsão de tempo',
  inputSchema: forecastSchema,
  outputSchema: weatherOutputSchema,
  execute: async ({ inputData, mastra }) => {
    console.log('[planActivities] STARTING');

    // Validate essential inputs
    if (!inputData) {
      console.error('[planActivities] No inputData provided');
      throw new Error('Forecast input data is required');
    }

    const forecast = inputData;
    console.log('[planActivities] Got forecast:', forecast.location);

    // Check Mastra instance
    if (!mastra) {
      console.error('[planActivities] No mastra instance');
      throw new Error('Mastra instance is not available in workflow');
    }

    // Get weather agent
    let agent;
    try {
      console.log('[planActivities] Getting weatherAgent from mastra');
      agent = mastra.getAgent('weatherAgent');
      if (!agent) {
        console.error('[planActivities] Agent is null');
        throw new Error('Weather agent not found in Mastra instance');
      }
      console.log('[planActivities] Got agent successfully');
    } catch (agentError) {
      const msg = agentError instanceof Error ? agentError.message : String(agentError);
      console.error('[planActivities] Failed to get agent:', msg);
      throw agentError;
    }

    // Build prompt
    const prompt = WEATHER_ACTIVITY_PLANNING_PROMPT(
      forecast.location,
      JSON.stringify(forecast, null, 2)
    );
    console.log('[planActivities] Prompt built, length:', prompt.length);

    // Call agent with proper error handling
    let activitiesText = '';

    try {
      const messages = [
        {
          role: 'user' as const,
          content: prompt,
        },
      ];

      console.log('[planActivities] CALLING agent.stream()');

      let response;
      try {
        response = await agent.stream(messages);
        console.log('[planActivities] agent.stream() RETURNED');
      } catch (streamError) {
        const msg = streamError instanceof Error ? streamError.message : String(streamError);
        console.error('[planActivities] agent.stream() THREW:', msg);
        throw streamError;
      }

      if (!response) {
        console.error('[planActivities] Response is null/undefined');
        throw new Error('agent.stream() returned null or undefined');
      }

      console.log('[planActivities] Response object exists');

      // Consume the text stream
      if (!response.textStream) {
        console.error('[planActivities] No textStream in response');
        throw new Error('agent.stream() response missing textStream property');
      }

      console.log('[planActivities] STARTING TO CONSUME TEXT STREAM');
      let chunkCount = 0;

      for await (const chunk of response.textStream) {
        if (chunk) {
          chunkCount++;
          process.stdout.write(chunk);
          activitiesText += chunk;
        }
      }

      console.log(`[planActivities] FINISHED CONSUMING (${chunkCount} chunks)`);

      if (!activitiesText || activitiesText.trim() === '') {
        console.warn('[planActivities] Empty response, using fallback');
        activitiesText = 'Desculpe, não consegui gerar sugestões de atividades no momento. Tente novamente em alguns instantes.';
      }

      console.log('[planActivities] RETURNING SUCCESS');
      return {
        activities: activitiesText,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[planActivities] CAUGHT ERROR AT TOP LEVEL:', errorMsg);
      console.error('[planActivities] Error stack:', error instanceof Error ? error.stack : 'no stack');
      // Instead of throwing, return a user-friendly error message
      return {
        activities: `❌ Erro ao processar: ${errorMsg}`,
      };
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
