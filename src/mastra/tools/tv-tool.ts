import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const tvTool = createTool({
  id: 'tv-tool',
  description: `Ferramenta para buscar informações sobre séries de TV.

Base URL: https://api.tvmaze.com

Endpoints disponíveis:
1) GET /search/shows?q={nome} - Busca séries pelo nome
2) GET /shows/{id} - Retorna detalhes completos de uma série pelo ID

Use o parâmetro 'endpoint' para especificar qual endpoint chamar.`,
  inputSchema: z.object({
    endpoint: z
      .string()
      .describe('O endpoint da API TVMaze. Ex: /search/shows?q=breaking%20bad ou /shows/1'),
  }),
  outputSchema: z.any(),
  execute: async (inputData) => {
    const endpoint = inputData.endpoint;
    try {
      const response = await fetch(`https://api.tvmaze.com${endpoint}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        error: `Erro ao buscar dados da API: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});
