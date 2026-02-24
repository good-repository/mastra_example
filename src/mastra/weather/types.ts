import { z } from 'zod';

/**
 * Weather Workflow Types
 * Centralized type definitions for the weather workflow
 */

// Input and output schemas
export const weatherInputSchema = z.object({
  city: z.string().max(200).describe('City name to get the weather forecast for'),
});

export const forecastSchema = z.object({
  date: z.string(),
  maxTemp: z.number(),
  minTemp: z.number(),
  precipitationChance: z.number(),
  condition: z.string(),
  location: z.string(),
});

export const weatherOutputSchema = z.object({
  activities: z.string(),
});

// External API response types
export interface GeocodingResponse {
  results: {
    latitude: number;
    longitude: number;
    name: string;
  }[];
}

export interface WeatherResponse {
  current: {
    time: string;
    precipitation: number;
    weathercode: number;
  };
  hourly: {
    precipitation_probability: number[];
    temperature_2m: number[];
  };
}

export interface CurrentWeatherResponse {
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

// Derived types
export type WeatherInput = z.infer<typeof weatherInputSchema>;
export type Forecast = z.infer<typeof forecastSchema>;
export type WeatherOutput = z.infer<typeof weatherOutputSchema>;
