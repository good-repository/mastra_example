import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { fetchWithRetry, API_ENDPOINTS } from '../../shared/lib/api-utils';
import { getWeatherCondition } from '../../shared/lib/weather-codes';
import { withCache } from '../../shared/lib/cache';
import {
  GeocodingResponse,
  CurrentWeatherResponse,
} from '../types';

const CACHE_TTL_MS = 30 * 60_000; // 30 minutes

export const weatherTool = createTool({
  id: 'weather-tool',
  description: 'Get current weather information for a specific location',
  inputSchema: z.object({
    location: z.string().max(200).describe('City or location name'),
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
  execute: async ({ location }: { location: string }) => {
    return withCache(`weather:${location.toLowerCase()}`, CACHE_TTL_MS, () => getWeather(location));
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
  const data = await fetchWithRetry<CurrentWeatherResponse>(weatherUrl);

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
