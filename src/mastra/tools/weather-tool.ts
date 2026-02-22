import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { fetchWithRetry, formatApiError, API_ENDPOINTS } from '../lib/api-utils';
import { getWeatherCondition } from '../lib/weather-codes';

interface GeocodingResponse {
  results: {
    latitude: number;
    longitude: number;
    name: string;
  }[];
}

interface WeatherResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    weather_code: number;
  };
}

export const weatherTool = createTool({
  id: 'weather-tool',
  description: 'Get current weather information for a specific location',
  inputSchema: z.object({
    location: z.string().describe('City or location name'),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    feelsLike: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    windGust: z.number(),
    conditions: z.string(),
    location: z.string(),
  }),
  execute: async (inputData) => {
    try {
      return await getWeather(inputData.location);
    } catch (error) {
      throw new Error(formatApiError(error));
    }
  },
});

const getWeather = async (location: string) => {
  // Geocode location
  const geocodingUrl = `${API_ENDPOINTS.OPEN_METEO.GEOCODING}?name=${encodeURIComponent(
    location
  )}&count=1`;
  const geocodingData = await fetchWithRetry<GeocodingResponse>(geocodingUrl);

  if (!geocodingData.results?.[0]) {
    throw new Error(`Location '${location}' not found`);
  }

  const { latitude, longitude, name } = geocodingData.results[0];

  // Fetch weather
  const weatherUrl = `${API_ENDPOINTS.OPEN_METEO.WEATHER}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;
  const data = await fetchWithRetry<WeatherResponse>(weatherUrl);

  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windGust: data.current.wind_gusts_10m,
    conditions: getWeatherCondition(data.current.weather_code),
    location: name,
  };
};
