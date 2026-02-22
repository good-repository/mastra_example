import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import {
  fetchWithRetry,
  formatApiError,
  API_ENDPOINTS,
} from '../lib/api-utils';
import { getWeatherCondition } from '../lib/weather-codes';

const forecastSchema = z.object({
  date: z.string(),
  maxTemp: z.number(),
  minTemp: z.number(),
  precipitationChance: z.number(),
  condition: z.string(),
  location: z.string(),
});

const fetchWeather = createStep({
  id: 'fetch-weather',
  description: 'Fetches weather forecast for a given city',
  inputSchema: z.object({
    city: z.string().describe('The city to get the weather for'),
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
        throw new Error(`Location '${inputData.city}' not found`);
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
  description: 'Suggests activities based on weather conditions',
  inputSchema: forecastSchema,
  outputSchema: z.object({
    activities: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const forecast = inputData;

    if (!forecast) {
      throw new Error('Forecast data not found');
    }

    const agent = mastra?.getAgent('weatherAgent');
    if (!agent) {
      throw new Error('Weather agent not found');
    }

    const prompt = `Based on the following weather forecast for ${forecast.location}, suggest appropriate activities:
      ${JSON.stringify(forecast, null, 2)}
      For each day in the forecast, structure your response exactly as follows:

      📅 [Day, Month Date, Year]
      ═══════════════════════════

      🌡️ WEATHER SUMMARY
      • Conditions: [brief description]
      • Temperature: [X°C/Y°F to A°C/B°F]
      • Precipitation: [X% chance]

      🌅 MORNING ACTIVITIES
      Outdoor:
      • [Activity Name] - [Brief description including specific location/route]
        Best timing: [specific time range]
        Note: [relevant weather consideration]

      🌞 AFTERNOON ACTIVITIES
      Outdoor:
      • [Activity Name] - [Brief description including specific location/route]
        Best timing: [specific time range]
        Note: [relevant weather consideration]

      🏠 INDOOR ALTERNATIVES
      • [Activity Name] - [Brief description including specific venue]
        Ideal for: [weather condition that would trigger this alternative]

      ⚠️ SPECIAL CONSIDERATIONS
      • [Any relevant weather warnings, UV index, wind conditions, etc.]

      Guidelines:
      - Suggest 2-3 time-specific outdoor activities per day
      - Include 1-2 indoor backup options
      - For precipitation >50%, lead with indoor activities
      - All activities must be specific to the location
      - Include specific venues, trails, or locations
      - Consider activity intensity based on temperature
      - Keep descriptions concise but informative

      Maintain this exact formatting for consistency, using the emoji and section headers as shown.`;

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
  inputSchema: z.object({
    city: z.string().describe('The city to get the weather for'),
  }),
  outputSchema: z.object({
    activities: z.string(),
  }),
})
  .then(fetchWeather)
  .then(planActivities);

weatherWorkflow.commit();

export { weatherWorkflow };
