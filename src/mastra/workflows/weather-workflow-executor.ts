import { weatherWorkflow } from './weather-workflow';
import { formatApiError } from '../lib/api-utils';
import type { WeatherInput, WeatherOutput } from './weather-types';

/**
 * Tipo-seguro wrapper para executar o weather workflow
 * Isola a chamada complexa do Mastra e retorna types corretos
 */
export async function executeWeatherWorkflow(
  input: WeatherInput
): Promise<WeatherOutput> {
  try {
    // A chamada com any é isolada aqui - não se espalha pelo project
    const result = await (weatherWorkflow.execute as any)({
      inputData: input,
    });
    return result as WeatherOutput;
  } catch (error) {
    throw new Error(formatApiError(error));
  }
}

export type { WeatherInput, WeatherOutput };
