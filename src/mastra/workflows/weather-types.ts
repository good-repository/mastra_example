import { z } from 'zod';

/**
 * Weather Workflow Types
 * Centralized type definitions for the weather workflow
 */

export const weatherInputSchema = z.object({
  city: z.string().describe('Cidade para obter previsão de tempo'),
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

export type WeatherInput = z.infer<typeof weatherInputSchema>;
export type Forecast = z.infer<typeof forecastSchema>;
export type WeatherOutput = z.infer<typeof weatherOutputSchema>;
