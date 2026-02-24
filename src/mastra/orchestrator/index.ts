/**
 * Orchestrator Feature
 * Centralized exports for the orchestrator domain
 */

export { orchestratorAgent } from './agent';
export { callWeatherAgent } from './tools/call-weather-agent';
export { callCinemaAgent } from './tools/call-cinema-agent';
export type {
  WeatherAgentQuery,
  WeatherAgentResponse,
  CinemaAgentQuery,
  CinemaAgentResponse,
} from '../shared/types/agent-contracts';
