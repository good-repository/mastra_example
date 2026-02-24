import { Agent } from '@mastra/core/agent';

/**
 * Activity Planner Agent
 *
 * Agente interno usado exclusivamente pelo weatherWorkflow na etapa planActivities.
 * Não possui ferramentas para evitar dependência circular:
 *
 *   weatherAgent → weatherWorkflowTool → weatherWorkflow → planActivities
 *                                                            └→ activityPlannerAgent (sem tools)
 *
 * Ao separar a responsabilidade de planejamento de atividades deste agente especializado,
 * o weatherAgent permanece livre para ser usado pelos usuários sem risco de recursão.
 */
export const activityPlannerAgent = new Agent({
  id: 'activity-planner-agent',
  name: 'Activity Planner Agent',
  model: 'google/gemini-2.5-flash-lite',
  instructions: `Você é um especialista em sugestões de atividades baseadas em previsão do tempo.
Recebe dados meteorológicos estruturados e retorna recomendações de atividades organizadas.
Responda apenas com as sugestões — sem saudações ou explicações adicionais.`,
});
