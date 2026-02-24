import { weatherWorkflow } from './workflow';
import type { WeatherInput, WeatherOutput } from './types';
import { validateString, validateObject } from '../shared/lib/validation';

/**
 * Tipo-seguro wrapper para executar o weather workflow
 * Isola a chamada complexa do Mastra e retorna types corretos
 */
export async function executeWeatherWorkflow(
  input: WeatherInput
): Promise<WeatherOutput> {
  try {
    validateObject(input, 'weather workflow input');
    const city = validateString(input.city, 'city');

    console.log('[executeWeatherWorkflow] Starting workflow execution for city:', city);

    // A chamada com any é isolada aqui - não se espalha pelo project
    const result = await (weatherWorkflow.execute as any)({
      inputData: { city },
    });

    console.log('[executeWeatherWorkflow] Workflow executed, result:', result ? 'has data' : 'empty');

    if (!result) {
      console.error('[executeWeatherWorkflow] Workflow returned empty result');
      return {
        activities: '❌ Workflow retornou resultado vazio',
      };
    }

    return result as WeatherOutput;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[executeWeatherWorkflow] Caught error:', msg);
    // Return error as activities instead of throwing
    // This ensures the response gets to the client
    return {
      activities: `❌ Erro na execução: ${msg}`,
    };
  }
}

export type { WeatherInput, WeatherOutput };
