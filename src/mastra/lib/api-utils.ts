/**
 * API Utilities - Shared functions for API interactions
 * Provides consistent error handling, retry logic, and validation
 */

// API Endpoints
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

// Configuration
export const API_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  TIMEOUT_MS: 10000,
} as const;

/**
 * Retry wrapper for API calls with exponential backoff
 */
export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = API_CONFIG.MAX_RETRIES
): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Validate status code
    if (!response.ok) {
      throw new ApiError(
        `API returned status ${response.status}: ${response.statusText}`,
        response.status,
        url
      );
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    // Don't retry on abort (timeout) or validation errors
    if (
      error instanceof ApiError ||
      (error instanceof Error && error.name === 'AbortError')
    ) {
      throw error;
    }

    // Retry on network errors
    if (retries > 0) {
      const delay = API_CONFIG.RETRY_DELAY_MS * (API_CONFIG.MAX_RETRIES - retries + 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry<T>(url, options, retries - 1);
    }

    throw new ApiError(
      `Failed to fetch: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0,
      url
    );
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public url: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Validate API response structure
 */
export function validateResponse<T>(
  data: unknown,
  validator: (data: unknown) => data is T,
  errorMessage: string
): T {
  if (!validator(data)) {
    throw new Error(errorMessage);
  }
  return data;
}

/**
 * Format API error message for user display
 */
export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.statusCode === 404) {
      return 'Recurso não encontrado. Verifique os parâmetros e tente novamente.';
    }
    if (error.statusCode >= 500) {
      return 'Serviço indisponível temporariamente. Tente novamente em alguns momentos.';
    }
    return error.message;
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return 'Requisição expirou. Tente novamente.';
    }
    return error.message;
  }

  return 'Erro desconhecido ao acessar a API.';
}
