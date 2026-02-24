import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import {
  Observability,
  DefaultExporter,
  CloudExporter,
  SensitiveDataFilter,
} from '@mastra/observability';
import { cinemaAgent, cinemaDirectTool, tvTool, cinemaKnowledgeTool } from './cinema';
import {
  weatherAgent,
  weatherWorkflow,
  weatherTool,
  weatherWorkflowTool,
} from './weather';
import { activityPlannerAgent } from './weather/activity-planner-agent';
import {
  orchestratorAgent,
  callWeatherAgent,
  callCinemaAgent,
} from './orchestrator';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { orchestratorAgent, weatherAgent, cinemaAgent, activityPlannerAgent },
  tools: {
    // Weather tools (scoped to weatherAgent)
    weatherTool,
    weatherWorkflowTool,
    // Cinema tools (scoped to cinemaAgent)
    cinemaDirectTool,
    tvTool,
    cinemaKnowledgeTool,
    // Orchestrator tools (scoped to orchestratorAgent)
    callWeatherAgent,
    callCinemaAgent,
  },
  vectors: {
    cinemaKnowledge: new LibSQLVector({ id: 'cinema-knowledge', url: 'file:./mastra.db' }),
  },
  storage: new LibSQLStore({
    id: 'mastra-storage',
    // stores observability, scores, ... into persistent file storage
    url: 'file:./mastra.db',
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: (process.env.LOG_LEVEL ?? 'info') as 'debug' | 'info' | 'warn' | 'error',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new DefaultExporter(), // Persists traces to storage for Mastra Studio
          new CloudExporter(), // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
});
