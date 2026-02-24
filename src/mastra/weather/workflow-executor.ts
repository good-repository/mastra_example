import { weatherWorkflow } from './workflow';
import type { WeatherInput, WeatherOutput } from './types';

/**
 * Type-safe wrapper for the weather workflow.
 * Isolates the Mastra execute() call and any casts to a single location.
 */
export async function executeWeatherWorkflow(
  input: WeatherInput
): Promise<WeatherOutput> {
  try {
    const result = await (weatherWorkflow.execute as any)({
      inputData: { city: input.city },
    });

    if (!result) {
      return { activities: '❌ Workflow retornou resultado vazio' };
    }

    return result as WeatherOutput;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { activities: `❌ Erro na execução: ${msg}` };
  }
}

export type { WeatherInput, WeatherOutput };
