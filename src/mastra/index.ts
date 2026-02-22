
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import {
  Observability,
  DefaultExporter,
  CloudExporter,
  SensitiveDataFilter,
} from '@mastra/observability';
import { weatherWorkflow } from './workflows/weather-workflow';
import { cinemaWorkflow } from './workflows/cinema-workflow';
import { weatherAgent } from './agents/weather-agent';
import { cinemaAgent } from './agents/cinema-agent';
import { weatherTool } from './tools/weather-tool';
import { tvTool } from './tools/tv-tool';
import { cinemaWorkflowTool } from './tools/cinema-workflow-tool';
import { weatherWorkflowTool } from './tools/weather-workflow-tool';

export const mastra = new Mastra({
  workflows: { weatherWorkflow, cinemaWorkflow },
  agents: { weatherAgent, cinemaAgent },
  tools: { weatherTool, tvTool, cinemaWorkflowTool, weatherWorkflowTool },
  storage: new LibSQLStore({
    id: 'mastra-storage',
    // stores observability, scores, ... into persistent file storage
    url: 'file:./mastra.db',
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
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
