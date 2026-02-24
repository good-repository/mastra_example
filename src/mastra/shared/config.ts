/**
 * Application configuration
 * Centralized configuration for all API integrations and timeouts
 */

/**
 * API endpoints configuration
 */
export const API_ENDPOINTS = {
  TVMAZE: {
    BASE: 'https://api.tvmaze.com',
    SEARCH_SHOWS: '/search/shows',
    SHOW_DETAILS: (id: number) => `/shows/${id}`,
  },
  OPEN_METEO: {
    GEOCODING: 'https://geocoding-api.open-meteo.com/v1/search',
    WEATHER: 'https://api.open-meteo.com/v1/forecast',
  },
} as const;

/**
 * Retry and timeout configuration
 */
export const API_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  TIMEOUT_MS: 10000,
} as const;

/**
 * Default models for agents
 */
export const MODELS = {
  DEFAULT: 'google/gemini-2.5-flash-lite',
} as const;
