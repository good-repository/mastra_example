/**
 * API Utilities - Shared functions for API interactions
 * Provides consistent error handling, retry logic, and validation
 */

import { API_ENDPOINTS, API_CONFIG } from '../config';

// Ensure we use native fetch from Node.js globalThis
// This prevents polyfill issues
const fetchFn = globalThis.fetch;

if (!fetchFn) {
  throw new Error('Fetch is not available in this Node.js environment. Ensure Node.js >= 18 is used.');
}

export { API_ENDPOINTS, API_CONFIG };

/**
 * Retry wrapper for API calls with exponential backoff
 */
export async function fetchWithRetry<T>(
  url: string,
  options?: RequestInit,
  retries: number = API_CONFIG.MAX_RETRIES
): Promise<T> {
  try {
    let response: Response;

    try {
      response = await fetchFn(url, {
        ...options,
        method: options?.method || 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Node.js)',
          ...options?.headers,
        },
      } as RequestInit);
    } catch (fetchError) {
      // Handle fetch errors (network issues, etc.)
      if (retries > 0) {
        const delay = API_CONFIG.RETRY_DELAY_MS * (API_CONFIG.MAX_RETRIES - retries + 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry<T>(url, options, retries - 1);
      }

      const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      throw new ApiError(
        `Network error: ${errorMsg}`,
        0,
        url
      );
    }

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
    // Don't retry on deterministic errors
    if (error instanceof ApiError) throw error;
    if (error instanceof SyntaxError) {
      throw new ApiError('Invalid JSON response from API', 0, url);
    }

    // Retry on transient errors (network timeouts, etc.)
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
